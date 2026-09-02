import { db, pool } from './index';
import {
  departments,
  defects,
  train_timetable,
  goods_forecast,
  available_slots,
  schedule_results,
  run_metrics,
} from './schema';
import { sql } from 'drizzle-orm';

/**
 * Deterministic Seeding Script for RailAID
 *
 * Populates:
 * 1. 3 Departments (Engineering, S&T, Traction Distribution)
 * 2. 5 Corridors (NDLS-PNP, NDLS-GZB, NDLS-AGC, NDLS-CNB, NDLS-UMB)
 * 3. 22 Defects total across the 3 departments with varied severities (1-5) and overdue days (0-45)
 * 4. 12 Timetable entries across 5 corridors
 * 5. 6 Goods forecasts with 3 deliberately overlapping timetable entries to create realistic scheduling conflicts
 *
 * Leaves available_slots, schedule_results, and run_metrics empty.
 * Idempotent: ensures schema exists and clears existing data safely before inserting.
 */

async function seed() {
  console.log('🌱 Starting RailAID database seed...');

  try {
    // 1. Ensure tables exist (handles freshly initialized databases seamlessly)
    console.log('📦 Ensuring database schema exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS defects (
        id SERIAL PRIMARY KEY,
        dept_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        corridor_id TEXT NOT NULL,
        asset_id TEXT NOT NULL,
        defect_type TEXT NOT NULL,
        severity INTEGER NOT NULL,
        overdue_days INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS train_timetable (
        id SERIAL PRIMARY KEY,
        corridor_id TEXT NOT NULL,
        train_id TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL
      );
      CREATE TABLE IF NOT EXISTS goods_forecast (
        id SERIAL PRIMARY KEY,
        corridor_id TEXT NOT NULL,
        window_start TIMESTAMP NOT NULL,
        window_end TIMESTAMP NOT NULL,
        priority TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS available_slots (
        id SERIAL PRIMARY KEY,
        corridor_id TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        horizon TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS schedule_results (
        id SERIAL PRIMARY KEY,
        defect_id INTEGER NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
        slot_id INTEGER REFERENCES available_slots(id) ON DELETE SET NULL,
        horizon TEXT NOT NULL,
        score NUMERIC(10, 2) NOT NULL,
        status TEXT NOT NULL,
        reason_code TEXT,
        run_id TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS run_metrics (
        id SERIAL PRIMARY KEY,
        run_id TEXT NOT NULL,
        horizon TEXT NOT NULL,
        uptime_pct NUMERIC(6, 2) NOT NULL,
        downtime_hours_saved NUMERIC(10, 2) NOT NULL,
        conflicts_resolved INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Clean existing data in reverse dependency order
    console.log('🧹 Clearing existing table records...');
    await db.execute(sql`TRUNCATE TABLE schedule_results, run_metrics, available_slots, goods_forecast, train_timetable, defects, departments RESTART IDENTITY CASCADE;`);

    // 3. Insert Departments
    console.log('🏢 Seeding departments...');
    const deptRows = await db
      .insert(departments)
      .values([
        { name: 'Engineering' }, // id 1
        { name: 'S&T' }, // id 2
        { name: 'Traction Distribution' }, // id 3
      ])
      .returning();

    const [engDept, stDept, trdDept] = deptRows;
    console.log(`   ✓ Created ${deptRows.length} departments (Eng: ${engDept.id}, S&T: ${stDept.id}, TRD: ${trdDept.id})`);

    // 4. Insert 22 Defects (8 Engineering, 7 S&T, 7 Traction Distribution)
    console.log('⚠️  Seeding 22 defects across departments & corridors...');
    const defectSeedData = [
      // Engineering (8 defects)
      {
        deptId: engDept.id,
        corridorId: 'NDLS-PNP',
        assetId: 'TRK-NDLS-PNP-014',
        defectType: 'Rail Flaw / USFD Ultrasonic Defect Detected',
        severity: 5,
        overdueDays: 14,
        status: 'open',
        createdAt: new Date('2026-08-20T06:30:00Z'),
      },
      {
        deptId: engDept.id,
        corridorId: 'NDLS-GZB',
        assetId: 'TRK-NDLS-GZB-082',
        defectType: 'Fishplate Joint Micro-Fracture',
        severity: 4,
        overdueDays: 28,
        status: 'open',
        createdAt: new Date('2026-08-06T11:00:00Z'),
      },
      {
        deptId: engDept.id,
        corridorId: 'NDLS-AGC',
        assetId: 'TRK-NDLS-AGC-105',
        defectType: 'Ballast Deficiency & Track Bed Settling',
        severity: 2,
        overdueDays: 42,
        status: 'open',
        createdAt: new Date('2026-07-23T09:15:00Z'),
      },
      {
        deptId: engDept.id,
        corridorId: 'NDLS-CNB',
        assetId: 'PNT-NDLS-CNB-003',
        defectType: 'Point & Crossing Tongue Rail Wear',
        severity: 4,
        overdueDays: 6,
        status: 'open',
        createdAt: new Date('2026-08-28T14:20:00Z'),
      },
      {
        deptId: engDept.id,
        corridorId: 'NDLS-UMB',
        assetId: 'TRK-NDLS-UMB-057',
        defectType: 'Expansion Joint Gap Misalignment',
        severity: 3,
        overdueDays: 19,
        status: 'open',
        createdAt: new Date('2026-08-15T08:45:00Z'),
      },
      {
        deptId: engDept.id,
        corridorId: 'NDLS-PNP',
        assetId: 'TRK-NDLS-PNP-029',
        defectType: 'Missing Pandrol Fastener Clips & Pad Decay',
        severity: 1,
        overdueDays: 35,
        status: 'open',
        createdAt: new Date('2026-07-30T16:00:00Z'),
      },
      {
        deptId: engDept.id,
        corridorId: 'NDLS-GZB',
        assetId: 'PNT-NDLS-GZB-012',
        defectType: 'Switch Rail Tip Chipping & Burrs',
        severity: 5,
        overdueDays: 3,
        status: 'open',
        createdAt: new Date('2026-08-31T05:10:00Z'),
      },
      {
        deptId: engDept.id,
        corridorId: 'NDLS-AGC',
        assetId: 'LC-NDLS-AGC-044',
        defectType: 'Level Crossing Check-Rail Flangeway Choking',
        severity: 2,
        overdueDays: 8,
        status: 'open',
        createdAt: new Date('2026-08-26T12:00:00Z'),
      },

      // S&T (7 defects)
      {
        deptId: stDept.id,
        corridorId: 'NDLS-GZB',
        assetId: 'SIG-NDLS-GZB-201',
        defectType: 'Digital Axle Counter (DAC) Intermittent Reset Error',
        severity: 5,
        overdueDays: 1,
        status: 'open',
        createdAt: new Date('2026-09-02T02:00:00Z'),
      },
      {
        deptId: stDept.id,
        corridorId: 'NDLS-CNB',
        assetId: 'SIG-NDLS-CNB-114',
        defectType: 'Electric Point Machine Motor High Friction Stalling',
        severity: 4,
        overdueDays: 11,
        status: 'open',
        createdAt: new Date('2026-08-23T10:30:00Z'),
      },
      {
        deptId: stDept.id,
        corridorId: 'NDLS-UMB',
        assetId: 'SIG-NDLS-UMB-305',
        defectType: 'Signal Lamp Aspect LED Current Degradation',
        severity: 3,
        overdueDays: 25,
        status: 'open',
        createdAt: new Date('2026-08-09T07:40:00Z'),
      },
      {
        deptId: stDept.id,
        corridorId: 'NDLS-PNP',
        assetId: 'SIG-NDLS-PNP-088',
        defectType: 'Track Circuit Glued Insulated Joint (GIJ) Breakdown',
        severity: 4,
        overdueDays: 17,
        status: 'open',
        createdAt: new Date('2026-08-17T13:15:00Z'),
      },
      {
        deptId: stDept.id,
        corridorId: 'NDLS-AGC',
        assetId: 'SIG-NDLS-AGC-019',
        defectType: 'Electronic Interlocking (EI) Sync Packet Loss',
        severity: 3,
        overdueDays: 31,
        status: 'open',
        createdAt: new Date('2026-08-03T15:50:00Z'),
      },
      {
        deptId: stDept.id,
        corridorId: 'NDLS-UMB',
        assetId: 'SIG-NDLS-UMB-042',
        defectType: 'Block Instrument Relay Chatter & Contact Resistance',
        severity: 2,
        overdueDays: 44,
        status: 'open',
        createdAt: new Date('2026-07-21T09:00:00Z'),
      },
      {
        deptId: stDept.id,
        corridorId: 'NDLS-CNB',
        assetId: 'TEL-NDLS-CNB-502',
        defectType: 'OFC Optical Fiber Core Attenuation Spike',
        severity: 1,
        overdueDays: 5,
        status: 'open',
        createdAt: new Date('2026-08-29T18:00:00Z'),
      },

      // Traction Distribution (7 defects)
      {
        deptId: trdDept.id,
        corridorId: 'NDLS-PNP',
        assetId: 'OHE-NDLS-PNP-142',
        defectType: 'OHE Current Dropper Snapped / Contact Wire Sag',
        severity: 5,
        overdueDays: 2,
        status: 'open',
        createdAt: new Date('2026-09-01T04:15:00Z'),
      },
      {
        deptId: trdDept.id,
        corridorId: 'NDLS-AGC',
        assetId: 'OHE-NDLS-AGC-077',
        defectType: 'Cantilever Insulator Flashover & Heavy Carbon Tracking',
        severity: 4,
        overdueDays: 15,
        status: 'open',
        createdAt: new Date('2026-08-19T08:20:00Z'),
      },
      {
        deptId: trdDept.id,
        corridorId: 'NDLS-CNB',
        assetId: 'OHE-NDLS-CNB-210',
        defectType: 'Contact Wire Height & Stagger Deviation',
        severity: 3,
        overdueDays: 38,
        status: 'open',
        createdAt: new Date('2026-07-27T11:45:00Z'),
      },
      {
        deptId: trdDept.id,
        corridorId: 'NDLS-GZB',
        assetId: 'OHE-NDLS-GZB-063',
        defectType: 'Neutral Section Overlap Arc Horn Severe Pitting',
        severity: 4,
        overdueDays: 9,
        status: 'open',
        createdAt: new Date('2026-08-25T14:30:00Z'),
      },
      {
        deptId: trdDept.id,
        corridorId: 'NDLS-UMB',
        assetId: 'TSS-NDLS-UMB-008',
        defectType: 'Traction Substation 25kV Circuit Breaker SF6 Low',
        severity: 5,
        overdueDays: 22,
        status: 'open',
        createdAt: new Date('2026-08-12T10:00:00Z'),
      },
      {
        deptId: trdDept.id,
        corridorId: 'NDLS-PNP',
        assetId: 'OHE-NDLS-PNP-095',
        defectType: 'Structure Bond & Earth Continuity Cable Severed',
        severity: 2,
        overdueDays: 30,
        status: 'open',
        createdAt: new Date('2026-08-04T17:10:00Z'),
      },
      {
        deptId: trdDept.id,
        corridorId: 'NDLS-AGC',
        assetId: 'OHE-NDLS-AGC-131',
        defectType: 'Auto Tensioning Device (ATD) Pulley Jamming',
        severity: 3,
        overdueDays: 0,
        status: 'open',
        createdAt: new Date('2026-09-03T01:00:00Z'),
      },
    ];

    const insertedDefects = await db.insert(defects).values(defectSeedData).returning();
    console.log(`   ✓ Created ${insertedDefects.length} defects across 5 corridors.`);

    // 5. Insert 12 Train Timetable Entries across 5 Corridors (Base Week: Sept 7 - Sept 13, 2026)
    console.log('🚆 Seeding 12 passenger train timetable entries...');
    const timetableSeedData = [
      // Corridor 1: NDLS-PNP (3 trains)
      {
        corridorId: 'NDLS-PNP',
        trainId: '12012 KLK-NDLS Shatabdi Exp',
        startTime: new Date('2026-09-07T08:00:00Z'),
        endTime: new Date('2026-09-07T09:45:00Z'),
      },
      {
        corridorId: 'NDLS-PNP',
        trainId: '22439 NDLS-SVDK Vande Bharat Exp',
        startTime: new Date('2026-09-08T06:00:00Z'),
        endTime: new Date('2026-09-08T07:30:00Z'),
      },
      {
        corridorId: 'NDLS-PNP',
        trainId: '12460 ASR-NDLS Intercity Exp',
        startTime: new Date('2026-09-09T17:30:00Z'),
        endTime: new Date('2026-09-09T19:15:00Z'),
      },

      // Corridor 2: NDLS-GZB (3 trains)
      {
        corridorId: 'NDLS-GZB',
        trainId: '12424 NDLS-DBRG Rajdhani Exp',
        startTime: new Date('2026-09-07T16:10:00Z'),
        endTime: new Date('2026-09-07T17:00:00Z'),
      },
      {
        corridorId: 'NDLS-GZB',
        trainId: '12004 NDLS-LKO Shatabdi Exp',
        startTime: new Date('2026-09-08T06:10:00Z'),
        endTime: new Date('2026-09-08T07:05:00Z'),
      },
      {
        corridorId: 'NDLS-GZB',
        trainId: '14041 DLI-DDN Mussoorie Exp',
        startTime: new Date('2026-09-10T22:25:00Z'),
        endTime: new Date('2026-09-10T23:30:00Z'),
      },

      // Corridor 3: NDLS-AGC (2 trains)
      {
        corridorId: 'NDLS-AGC',
        trainId: '12050 NZM-JHS Gatimaan Exp',
        startTime: new Date('2026-09-08T08:10:00Z'),
        endTime: new Date('2026-09-08T09:50:00Z'),
      },
      {
        corridorId: 'NDLS-AGC',
        trainId: '12002 NDLS-BPL Shatabdi Exp',
        startTime: new Date('2026-09-09T06:00:00Z'),
        endTime: new Date('2026-09-09T07:50:00Z'),
      },

      // Corridor 4: NDLS-CNB (2 trains)
      {
        corridorId: 'NDLS-CNB',
        trainId: '22436 NDLS-BSB Vande Bharat Exp',
        startTime: new Date('2026-09-07T06:00:00Z'),
        endTime: new Date('2026-09-07T10:08:00Z'),
      },
      {
        corridorId: 'NDLS-CNB',
        trainId: '12418 NDLS-PRYJ Prayagraj Exp',
        startTime: new Date('2026-09-09T22:10:00Z'),
        endTime: new Date('2026-09-10T03:55:00Z'),
      },

      // Corridor 5: NDLS-UMB (2 trains)
      {
        corridorId: 'NDLS-UMB',
        trainId: '12005 NDLS-KLK Kalka Shatabdi Exp',
        startTime: new Date('2026-09-10T17:15:00Z'),
        endTime: new Date('2026-09-10T19:50:00Z'),
      },
      {
        corridorId: 'NDLS-UMB',
        trainId: '12425 NDLS-JAT Jammu Rajdhani Exp',
        startTime: new Date('2026-09-11T20:40:00Z'),
        endTime: new Date('2026-09-11T23:20:00Z'),
      },
    ];

    const insertedTimetable = await db.insert(train_timetable).values(timetableSeedData).returning();
    console.log(`   ✓ Created ${insertedTimetable.length} train timetable entries.`);

    // 6. Insert 6 Goods Forecast entries (with 3 deliberately overlapping timetable entries)
    console.log('📦 Seeding 6 goods forecast entries (including deliberate conflict overlaps)...');
    const goodsSeedData = [
      // Conflict 1: Overlaps 12012 Shatabdi (08:00-09:45) on NDLS-PNP
      {
        corridorId: 'NDLS-PNP',
        windowStart: new Date('2026-09-07T08:30:00Z'),
        windowEnd: new Date('2026-09-07T10:30:00Z'),
        priority: 'high', // Critical coal rake to thermal power plant
      },
      // Conflict 2: Overlaps 12050 Gatimaan Exp (08:10-09:50) on NDLS-AGC
      {
        corridorId: 'NDLS-AGC',
        windowStart: new Date('2026-09-08T08:45:00Z'),
        windowEnd: new Date('2026-09-08T10:45:00Z'),
        priority: 'medium', // Fertilizer rake
      },
      // Conflict 3: Overlaps 22436 Vande Bharat (06:00-10:08) on NDLS-CNB
      {
        corridorId: 'NDLS-CNB',
        windowStart: new Date('2026-09-07T07:30:00Z'),
        windowEnd: new Date('2026-09-07T11:30:00Z'),
        priority: 'high', // POL Petroleum tanker rake
      },
      // Non-conflict 4: Dedicated night freight window on NDLS-GZB
      {
        corridorId: 'NDLS-GZB',
        windowStart: new Date('2026-09-07T01:00:00Z'),
        windowEnd: new Date('2026-09-07T04:00:00Z'),
        priority: 'high', // CONCOR container freight
      },
      // Non-conflict 5: Early morning freight on NDLS-UMB
      {
        corridorId: 'NDLS-UMB',
        windowStart: new Date('2026-09-10T02:00:00Z'),
        windowEnd: new Date('2026-09-10T05:30:00Z'),
        priority: 'medium', // Steel coils BOST rake
      },
      // Non-conflict 6: Off-peak freight on NDLS-PNP
      {
        corridorId: 'NDLS-PNP',
        windowStart: new Date('2026-09-11T01:30:00Z'),
        windowEnd: new Date('2026-09-11T04:45:00Z'),
        priority: 'low', // Automobile carrier NMG rake
      },
    ];

    const insertedGoods = await db.insert(goods_forecast).values(goodsSeedData).returning();
    console.log(`   ✓ Created ${insertedGoods.length} goods forecast entries (3 with deliberate timetable conflicts).`);

    console.log('✨ Seed complete! (available_slots, schedule_results, run_metrics left empty for runtime computation).');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
