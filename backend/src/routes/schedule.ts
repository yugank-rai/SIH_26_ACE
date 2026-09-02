import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import {
  defects,
  departments,
  available_slots,
  schedule_results,
  run_metrics,
} from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { computeAvailableSlots } from '../services/availability';

export const scheduleRouter = Router();

/**
 * POST /api/schedule/generate
 * Triggers the AI optimization pipeline:
 * 1. Fetches open defects and determines relevant corridors.
 * 2. Computes available conflict-free maintenance windows.
 * 3. Calls the Python Optimizer microservice via HTTP.
 * 4. Persists schedule results and performance metrics in PostgreSQL.
 */
scheduleRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const horizon = req.body.horizon === 'monthly' ? 'monthly' : 'weekly';

    // 1. Fetch all open defects from DB
    const openDefects = await db
      .select()
      .from(defects)
      .where(eq(defects.status, 'open'))
      .orderBy(defects.id);

    if (openDefects.length === 0) {
      res.status(200).json({
        run_id: null,
        schedule: [],
        unscheduled: [],
        metrics: { uptime_pct: 0.0, downtime_hours_saved: 0.0, conflicts_resolved: 0 },
        message: 'No open defects to schedule',
      });
      return;
    }

    // 2. Get distinct corridors
    const distinctCorridors = Array.from(new Set(openDefects.map((d) => d.corridorId)));

    // 3. Compute available non-overlapping slots per corridor
    const computedSlotsByCorridor: Array<{
      corridorId: string;
      startTime: Date;
      endTime: Date;
      horizon: string;
    }> = [];

    for (const corridorId of distinctCorridors) {
      const slots = await computeAvailableSlots(corridorId, horizon);
      for (const s of slots) {
        computedSlotsByCorridor.push({
          corridorId: s.corridor_id,
          startTime: new Date(s.start_time),
          endTime: new Date(s.end_time),
          horizon,
        });
      }
    }

    // 4. Persist computed slots to available_slots table so foreign keys and start/end times are reliable
    let persistedSlots: Array<{
      id: number;
      corridorId: string;
      startTime: Date;
      endTime: Date;
      horizon: string;
    }> = [];

    if (computedSlotsByCorridor.length > 0) {
      persistedSlots = await db
        .insert(available_slots)
        .values(computedSlotsByCorridor)
        .returning();
    }

    // 5. Build request payload matching docs/contract.md exactly
    const optimizerPayload = {
      tasks: openDefects.map((d) => ({
        id: d.id,
        corridor_id: d.corridorId,
        severity: d.severity,
        overdue_days: d.overdueDays,
        defect_type: d.defectType,
      })),
      available_slots: persistedSlots.map((s) => ({
        id: s.id,
        corridor_id: s.corridorId,
        start_time: s.startTime.toISOString(),
        end_time: s.endTime.toISOString(),
      })),
      horizon,
    };

    // 6. Invoke Optimizer service
    const optimizerUrl = process.env.OPTIMIZER_URL || 'http://optimizer:8000';
    let optimizerResponse: globalThis.Response;

    try {
      optimizerResponse = await fetch(`${optimizerUrl}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizerPayload),
      });
    } catch (networkError: any) {
      console.error('Failed to reach optimizer service:', networkError);
      res.status(502).json({
        error: 'Optimizer service is unreachable',
        details: networkError?.message || String(networkError),
      });
      return;
    }

    if (!optimizerResponse.ok) {
      const errorText = await optimizerResponse.text();
      console.error(`Optimizer returned error HTTP ${optimizerResponse.status}:`, errorText);
      res.status(502).json({
        error: `Optimizer service returned HTTP ${optimizerResponse.status}`,
        details: errorText,
      });
      return;
    }

    const optimizerData = (await optimizerResponse.json()) as {
      schedule: Array<{ task_id: number; slot_id: number; score: number }>;
      unscheduled: Array<{ task_id: number; reason_code: string; score: number }>;
      metrics: {
        uptime_pct: number;
        downtime_hours_saved: number;
        conflicts_resolved: number;
      };
    };

    // 7. Persist schedule results & metrics
    const runId = `run-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const scheduleInsertions = [
      ...optimizerData.schedule.map((s) => ({
        defectId: s.task_id,
        slotId: s.slot_id,
        horizon,
        score: s.score.toFixed(2),
        status: 'scheduled' as const,
        reasonCode: null as string | null,
        runId,
      })),
      ...optimizerData.unscheduled.map((u) => ({
        defectId: u.task_id,
        slotId: null as number | null,
        horizon,
        score: u.score.toFixed(2),
        status: 'unscheduled' as const,
        reasonCode: u.reason_code,
        runId,
      })),
    ];

    if (scheduleInsertions.length > 0) {
      await db.insert(schedule_results).values(scheduleInsertions);
    }

    await db.insert(run_metrics).values({
      runId,
      horizon,
      uptimePct: optimizerData.metrics.uptime_pct.toFixed(2),
      downtimeHoursSaved: optimizerData.metrics.downtime_hours_saved.toFixed(2),
      conflictsResolved: optimizerData.metrics.conflicts_resolved,
    });

    res.status(200).json({
      run_id: runId,
      horizon,
      schedule: optimizerData.schedule,
      unscheduled: optimizerData.unscheduled,
      metrics: optimizerData.metrics,
    });
  } catch (error) {
    console.error('Error in /api/schedule/generate:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

/**
 * GET /api/schedule?horizon=weekly|monthly
 * Returns the most recent run's schedule_results for the given horizon,
 * joined with defect details and slot start/end times.
 */
scheduleRouter.get('/', async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) === 'monthly' ? 'monthly' : 'weekly';

    // Find latest run for this horizon
    const latestMetrics = await db
      .select()
      .from(run_metrics)
      .where(eq(run_metrics.horizon, horizon))
      .orderBy(desc(run_metrics.createdAt), desc(run_metrics.id))
      .limit(1);

    if (latestMetrics.length === 0) {
      res.json({
        run_id: null,
        horizon,
        schedule: [],
        unscheduled: [],
        results: [],
      });
      return;
    }

    const latestRunId = latestMetrics[0].runId;

    // Join schedule_results with defects, departments, and available_slots
    const rawResults = await db
      .select({
        id: schedule_results.id,
        run_id: schedule_results.runId,
        defect_id: schedule_results.defectId,
        slot_id: schedule_results.slotId,
        horizon: schedule_results.horizon,
        score: schedule_results.score,
        status: schedule_results.status,
        reason_code: schedule_results.reasonCode,
        created_at: schedule_results.createdAt,
        corridor_id: defects.corridorId,
        asset_id: defects.assetId,
        defect_type: defects.defectType,
        severity: defects.severity,
        overdue_days: defects.overdueDays,
        department_name: departments.name,
        slot_start_time: available_slots.startTime,
        slot_end_time: available_slots.endTime,
      })
      .from(schedule_results)
      .innerJoin(defects, eq(schedule_results.defectId, defects.id))
      .innerJoin(departments, eq(defects.deptId, departments.id))
      .leftJoin(available_slots, eq(schedule_results.slotId, available_slots.id))
      .where(eq(schedule_results.runId, latestRunId))
      .orderBy(desc(schedule_results.status), desc(schedule_results.score));

    const scheduled = rawResults.filter((r) => r.status === 'scheduled');
    const unscheduled = rawResults.filter((r) => r.status === 'unscheduled');

    res.json({
      run_id: latestRunId,
      horizon,
      schedule: scheduled,
      unscheduled: unscheduled,
      results: rawResults,
    });
  } catch (error) {
    console.error('Error fetching schedule results:', error);
    res.status(500).json({ error: 'Failed to retrieve schedule results' });
  }
});

/**
 * GET /api/metrics?horizon=weekly|monthly
 * Returns the most recent run_metrics row for the requested horizon.
 */
scheduleRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) === 'monthly' ? 'monthly' : 'weekly';

    const latestMetric = await db
      .select({
        id: run_metrics.id,
        run_id: run_metrics.runId,
        horizon: run_metrics.horizon,
        uptime_pct: run_metrics.uptimePct,
        downtime_hours_saved: run_metrics.downtimeHoursSaved,
        conflicts_resolved: run_metrics.conflictsResolved,
        created_at: run_metrics.createdAt,
      })
      .from(run_metrics)
      .where(eq(run_metrics.horizon, horizon))
      .orderBy(desc(run_metrics.createdAt), desc(run_metrics.id))
      .limit(1);

    if (latestMetric.length === 0) {
      res.status(404).json({ error: `No metrics found for horizon '${horizon}'` });
      return;
    }

    res.json(latestMetric[0]);
  } catch (error) {
    console.error('Error fetching run metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve run metrics' });
  }
});
