import { db } from '../db';
import { train_timetable, goods_forecast, available_slots } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface ComputedSlot {
  id: number;
  corridor_id: string;
  start_time: string; // ISO timestamp string
  end_time: string;   // ISO timestamp string
}

/**
 * Computes available 2-hour maintenance block windows for a given corridor and planning horizon.
 * Excludes any window that overlaps with scheduled passenger train timetables or goods freight forecasts.
 *
 * @param corridorId - Station-pair identifier (e.g. "NDLS-PNP")
 * @param horizon - "weekly" (7 days) or "monthly" (30 days)
 * @returns Array of available non-conflicting time slots
 */
export async function computeAvailableSlots(
  corridorId: string,
  horizon: 'weekly' | 'monthly'
): Promise<ComputedSlot[]> {
  const numDays = horizon === 'monthly' ? 30 : 7;
  const now = new Date();

  // Normalize start to the beginning of the current day (00:00:00)
  const rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const rangeEnd = new Date(rangeStart.getTime() + numDays * 24 * 60 * 60 * 1000);

  // 1. Fetch passenger train timetables for this corridor
  const timetables = await db
    .select()
    .from(train_timetable)
    .where(eq(train_timetable.corridorId, corridorId));

  // 2. Fetch freight goods forecasts for this corridor
  const goods = await db
    .select()
    .from(goods_forecast)
    .where(eq(goods_forecast.corridorId, corridorId));

  const survivingSlots: ComputedSlot[] = [];
  let slotCounter = 0;

  // 3. Generate candidate 2-hour windows (12 per day: 00:00-02:00, 02:00-04:00, ... 22:00-24:00)
  for (let day = 0; day < numDays; day++) {
    for (let hour = 0; hour < 24; hour += 2) {
      const windowStart = new Date(rangeStart.getTime() + (day * 24 + hour) * 60 * 60 * 1000);
      const windowEnd = new Date(windowStart.getTime() + 2 * 60 * 60 * 1000);

      // Overlap check with passenger timetable: windowStart < entryEnd AND windowEnd > entryStart
      const overlapsPassenger = timetables.some((t) => {
        const trainStart = new Date(t.startTime);
        const trainEnd = new Date(t.endTime);
        return windowStart < trainEnd && windowEnd > trainStart;
      });

      if (overlapsPassenger) {
        continue;
      }

      // Overlap check with goods forecast: windowStart < entryEnd AND windowEnd > entryStart
      const overlapsGoods = goods.some((g) => {
        const goodsStart = new Date(g.windowStart);
        const goodsEnd = new Date(g.windowEnd);
        return windowStart < goodsEnd && windowEnd > goodsStart;
      });

      if (overlapsGoods) {
        continue;
      }

      // Surviving non-conflicting slot
      slotCounter++;
      survivingSlots.push({
        id: slotCounter,
        corridor_id: corridorId,
        start_time: windowStart.toISOString(),
        end_time: windowEnd.toISOString(),
      });
    }
  }

  return survivingSlots;
}
