import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTimetable, getGoodsForecast } from '../lib/api';
import { Train, Package, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export const CorridorsScreen: React.FC = () => {
  const { data: timetables = [] } = useQuery({
    queryKey: ['timetable'],
    queryFn: getTimetable,
  });

  const { data: goods = [] } = useQuery({
    queryKey: ['goods-forecast'],
    queryFn: getGoodsForecast,
  });

  // Extract distinct corridors
  const corridors = useMemo(() => {
    const set = new Set<string>();
    timetables.forEach((t) => set.add(t.corridor_id));
    goods.forEach((g) => set.add(g.corridor_id));
    const list = Array.from(set);
    return list.length > 0 ? list : ['NDLS-PNP', 'NDLS-GZB', 'NDLS-AGC', 'NDLS-CNB', 'NDLS-UMB'];
  }, [timetables, goods]);

  const [selectedCorridor, setSelectedCorridor] = useState<string>('NDLS-PNP');

  // Filter entries for selected corridor
  const corridorTimetable = timetables.filter((t) => t.corridor_id === selectedCorridor);
  const corridorGoods = goods.filter((g) => g.corridor_id === selectedCorridor);

  // 7-day Block Availability Simulation
  const daysOfWeek = useMemo(() => {
    const days = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      const isDesignated = i === 2 || i === 5; // mid-week and end-of-week designated block days
      
      // Check if any goods or timetable overlaps 00:00-02:00 window on this day
      const windowStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const windowEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 2, 0, 0);

      const hasPassengerConflict = corridorTimetable.some((t) => {
        const s = new Date(t.start_time);
        const e = new Date(t.end_time);
        return windowStart < e && windowEnd > s;
      });

      const hasGoodsConflict = corridorGoods.some((g) => {
        const s = new Date(g.window_start);
        const e = new Date(g.window_end);
        return windowStart < e && windowEnd > s;
      });

      const isConflict = hasPassengerConflict || hasGoodsConflict;

      days.push({
        dayIndex: i,
        dateString: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isDesignated,
        isConflict,
        conflictReason: hasGoodsConflict ? 'Freight Rake Overlap' : hasPassengerConflict ? 'Timetable Overlap' : null,
      });
    }
    return days;
  }, [corridorTimetable, corridorGoods]);

  return (
    <div className="p-8 space-y-6">
      {/* Top Header & Corridor Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Corridor Traffic & Block Monitor</h2>
          <p className="text-sm text-slate-500">
            Inspect passenger schedules, freight forecasts, and slot scarcity across key routes
          </p>
        </div>

        {/* Corridor Dropdown */}
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
          <label className="text-xs font-semibold text-slate-500 uppercase">Route Corridor:</label>
          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            className="bg-transparent text-sm font-bold text-blue-600 outline-hidden cursor-pointer"
          >
            {corridors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Corridor Visual Availability Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              7-Day Maintenance Block Availability Matrix ({selectedCorridor})
            </h3>
            <p className="text-xs text-slate-500">
              Corridor maintenance blocks are granted on designated low-traffic days (00:00 - 02:00 hrs)
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Open Slot
            </span>
            <span className="flex items-center gap-1 text-red-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Traffic Conflict
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> Non-Block Day
            </span>
          </div>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {daysOfWeek.map((day) => {
            return (
              <div
                key={day.dayIndex}
                className={`p-3.5 rounded-xl border flex flex-col justify-between h-28 transition-all ${
                  day.isDesignated
                    ? day.isConflict
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{day.dateString}</div>
                  <div className="text-[10px] uppercase font-semibold mt-0.5">
                    {day.isDesignated ? 'Designated Block' : 'No Allocation'}
                  </div>
                </div>

                <div className="pt-2">
                  {day.isDesignated ? (
                    day.isConflict ? (
                      <div className="flex items-center text-xs font-semibold text-red-700 gap-1">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-[10px] leading-tight truncate" title={day.conflictReason || 'Blocked'}>
                          {day.conflictReason || 'Traffic Block'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs font-bold text-emerald-700 gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[10px]">00:00 - 02:00</span>
                      </div>
                    )
                  ) : (
                    <div className="text-[10px] text-slate-400">Restricted Window</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 Tables: Passenger Timetable and Freight Goods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passenger Train Timetable */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Train className="w-4 h-4 text-blue-600" />
              Scheduled Passenger Trains ({corridorTimetable.length})
            </h3>
            <span className="text-xs font-mono text-slate-400">{selectedCorridor}</span>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            {corridorTimetable.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No scheduled passenger runs on this corridor in the demo timetable.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Train No. & Service</th>
                    <th className="px-4 py-3">Departure</th>
                    <th className="px-4 py-3">Arrival</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corridorTimetable.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 text-xs">
                        {item.train_id}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {new Date(item.start_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {new Date(item.end_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Freight Goods Forecast */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              Freight & Goods Traffic Forecast ({corridorGoods.length})
            </h3>
            <span className="text-xs font-mono text-slate-400">{selectedCorridor}</span>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            {corridorGoods.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No freight paths logged for this corridor.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Window Start</th>
                    <th className="px-4 py-3">Window End</th>
                    <th className="px-4 py-3">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corridorGoods.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {new Date(item.window_start).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">
                        {new Date(item.window_end).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.priority === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : item.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.priority} Priority
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
