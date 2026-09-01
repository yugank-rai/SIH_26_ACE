import { pgTable, serial, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * 1. departments
 * Stores railway maintenance departments.
 * Values: "Engineering", "S&T", "Traction Distribution"
 */
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const departmentsRelations = relations(departments, ({ many }) => ({
  defects: many(defects),
}));

/**
 * 2. defects
 * Tracks infrastructure defects across corridors with severities (1-5) and overdue days.
 */
export const defects = pgTable('defects', {
  id: serial('id').primaryKey(),
  deptId: integer('dept_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'cascade' }),
  corridorId: text('corridor_id').notNull(),
  assetId: text('asset_id').notNull(),
  defectType: text('defect_type').notNull(),
  severity: integer('severity').notNull(), // 1 to 5
  overdueDays: integer('overdue_days').notNull(),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const defectsRelations = relations(defects, ({ one, many }) => ({
  department: one(departments, {
    fields: [defects.deptId],
    references: [departments.id],
  }),
  scheduleResults: many(schedule_results),
}));

/**
 * 3. train_timetable
 * Scheduled passenger train operations across corridors.
 */
export const train_timetable = pgTable('train_timetable', {
  id: serial('id').primaryKey(),
  corridorId: text('corridor_id').notNull(),
  trainId: text('train_id').notNull(),
  startTime: timestamp('start_time', { mode: 'date' }).notNull(),
  endTime: timestamp('end_time', { mode: 'date' }).notNull(),
});

/**
 * 4. goods_forecast
 * Freight train operations forecast and priority windows.
 */
export const goods_forecast = pgTable('goods_forecast', {
  id: serial('id').primaryKey(),
  corridorId: text('corridor_id').notNull(),
  windowStart: timestamp('window_start', { mode: 'date' }).notNull(),
  windowEnd: timestamp('window_end', { mode: 'date' }).notNull(),
  priority: text('priority').notNull(),
});

/**
 * 5. available_slots
 * Calculated maintenance opportunity windows (weekly / monthly).
 * Populated dynamically via corridor capacity calculation.
 */
export const available_slots = pgTable('available_slots', {
  id: serial('id').primaryKey(),
  corridorId: text('corridor_id').notNull(),
  startTime: timestamp('start_time', { mode: 'date' }).notNull(),
  endTime: timestamp('end_time', { mode: 'date' }).notNull(),
  horizon: text('horizon').notNull(), // "weekly" | "monthly"
});

export const availableSlotsRelations = relations(available_slots, ({ many }) => ({
  scheduleResults: many(schedule_results),
}));

/**
 * 6. schedule_results
 * Output of optimization runs mapping defects to slots with score & reasons.
 */
export const schedule_results = pgTable('schedule_results', {
  id: serial('id').primaryKey(),
  defectId: integer('defect_id')
    .notNull()
    .references(() => defects.id, { onDelete: 'cascade' }),
  slotId: integer('slot_id').references(() => available_slots.id, {
    onDelete: 'set null',
  }),
  horizon: text('horizon').notNull(),
  score: numeric('score', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull(), // "scheduled" | "unscheduled"
  reasonCode: text('reason_code'), // "NO_CORRIDOR_SLOT" | "LOWER_PRIORITY" | "CAPACITY_EXCEEDED" | null
  runId: text('run_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const scheduleResultsRelations = relations(schedule_results, ({ one }) => ({
  defect: one(defects, {
    fields: [schedule_results.defectId],
    references: [defects.id],
  }),
  slot: one(available_slots, {
    fields: [schedule_results.slotId],
    references: [available_slots.id],
  }),
}));

/**
 * 7. run_metrics
 * Overall summary metrics per optimization run.
 */
export const run_metrics = pgTable('run_metrics', {
  id: serial('id').primaryKey(),
  runId: text('run_id').notNull(),
  horizon: text('horizon').notNull(),
  uptimePct: numeric('uptime_pct', { precision: 6, scale: 2 }).notNull(),
  downtimeHoursSaved: numeric('downtime_hours_saved', { precision: 10, scale: 2 }).notNull(),
  conflictsResolved: integer('conflicts_resolved').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// Infer types
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Defect = typeof defects.$inferSelect;
export type NewDefect = typeof defects.$inferInsert;

export type TrainTimetable = typeof train_timetable.$inferSelect;
export type NewTrainTimetable = typeof train_timetable.$inferInsert;

export type GoodsForecast = typeof goods_forecast.$inferSelect;
export type NewGoodsForecast = typeof goods_forecast.$inferInsert;

export type AvailableSlot = typeof available_slots.$inferSelect;
export type NewAvailableSlot = typeof available_slots.$inferInsert;

export type ScheduleResult = typeof schedule_results.$inferSelect;
export type NewScheduleResult = typeof schedule_results.$inferInsert;

export type RunMetric = typeof run_metrics.$inferSelect;
export type NewRunMetric = typeof run_metrics.$inferInsert;
