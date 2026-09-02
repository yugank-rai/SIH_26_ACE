import { Router, Request, Response } from 'express';
import { db } from '../db';
import { train_timetable, goods_forecast } from '../db/schema';
import { asc } from 'drizzle-orm';

export const corridorsRouter = Router();

/**
 * GET /api/timetable
 * Returns all passenger train timetable entries.
 */
corridorsRouter.get('/timetable', async (req: Request, res: Response) => {
  try {
    const timetableEntries = await db
      .select({
        id: train_timetable.id,
        corridor_id: train_timetable.corridorId,
        train_id: train_timetable.trainId,
        start_time: train_timetable.startTime,
        end_time: train_timetable.endTime,
      })
      .from(train_timetable)
      .orderBy(asc(train_timetable.startTime));

    res.json(timetableEntries);
  } catch (error) {
    console.error('Error fetching train timetables:', error);
    res.status(500).json({ error: 'Failed to retrieve train timetables' });
  }
});

/**
 * GET /api/goods-forecast
 * Returns all freight goods forecast entries.
 */
corridorsRouter.get('/goods-forecast', async (req: Request, res: Response) => {
  try {
    const goodsEntries = await db
      .select({
        id: goods_forecast.id,
        corridor_id: goods_forecast.corridorId,
        window_start: goods_forecast.windowStart,
        window_end: goods_forecast.windowEnd,
        priority: goods_forecast.priority,
      })
      .from(goods_forecast)
      .orderBy(asc(goods_forecast.windowStart));

    res.json(goodsEntries);
  } catch (error) {
    console.error('Error fetching goods forecasts:', error);
    res.status(500).json({ error: 'Failed to retrieve goods forecasts' });
  }
});
