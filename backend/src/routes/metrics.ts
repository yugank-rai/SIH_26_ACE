import { Router, Request, Response } from 'express';
import { db } from '../db';
import { run_metrics } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const metricsRouter = Router();

/**
 * GET /api/metrics?horizon=weekly|monthly
 * Returns the most recent run_metrics row for that horizon.
 */
metricsRouter.get('/', async (req: Request, res: Response) => {
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
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});
