import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedule, getMetrics, generateSchedule, dispatchToast } from '../lib/api';
import { DepartmentBadge, SeverityBadge } from '../components/Badge';
import {
  BrainCircuit,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export const PlannerScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const [horizon, setHorizon] = useState<'weekly' | 'monthly'>('weekly');
  const [activeTab, setActiveTab] = useState<'scheduled' | 'unscheduled'>('scheduled');

  // Queries
  const { data: scheduleData, isLoading: loadingSchedule } = useQuery({
    queryKey: ['schedule', horizon],
    queryFn: () => getSchedule(horizon),
  });

  const { data: metricsData } = useQuery({
    queryKey: ['metrics', horizon],
    queryFn: () => getMetrics(horizon),
  });

  // Mutation to generate schedule
  const generateMutation = useMutation({
    mutationFn: (targetHorizon: 'weekly' | 'monthly') => generateSchedule(targetHorizon),
    onSuccess: (data) => {
      dispatchToast(
        `Optimization plan generated! Scheduled ${data.schedule.length} tasks, ${data.unscheduled.length} deferred.`,
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
    onError: (err: any) => {
      dispatchToast(err?.message || 'Failed to generate schedule', 'error');
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate(horizon);
  };

  const scheduleList = scheduleData?.schedule || [];
  const unscheduledList = scheduleData?.unscheduled || [];
  const totalTasks = scheduleList.length + unscheduledList.length;

  // Reason code mapping
  const formatReasonCode = (code: string | null) => {
    switch (code) {
      case 'LOWER_PRIORITY':
        return 'Deferred — higher priority tasks took available slots';
      case 'NO_CORRIDOR_SLOT':
        return 'No block windows available on this corridor this horizon';
      case 'CAPACITY_EXCEEDED':
        return 'Corridor over capacity even after priority ranking';
      default:
        return 'Awaiting next optimization window';
    }
  };

  // Find highest scoring unscheduled task
  const highestDeferred = [...unscheduledList].sort(
    (a, b) => Number(b.score) - Number(a.score)
  )[0];

  return (
    <div className="p-8 space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Google OR-Tools CP-SAT
            </span>
            <span className="text-slate-400 text-xs font-mono">Horizon: {horizon.toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">AI Maintenance Slot Planner</h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Solves multi-corridor maintenance constraints, eliminates passenger train delays, and maximizes network uptime.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Horizon Toggle */}
          <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
            <button
              onClick={() => setHorizon('weekly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                horizon === 'weekly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly (7d)
            </button>
            <button
              onClick={() => setHorizon('monthly')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                horizon === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly (30d)
            </button>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Optimized Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Schedule Tables (8 cols) + AI Insights (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Schedule Results / Backlog */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Tabs: Scheduled vs Unscheduled */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'scheduled'
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Allocated Schedule ({scheduleList.length})
            </button>
            <button
              onClick={() => setActiveTab('unscheduled')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'unscheduled'
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Unscheduled / Backlog ({unscheduledList.length})
            </button>
          </div>

          {loadingSchedule ? (
            <div className="p-16 text-center text-slate-400 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading optimization results...
            </div>
          ) : activeTab === 'scheduled' ? (
            /* Scheduled Table */
            <div className="overflow-x-auto">
              {scheduleList.length === 0 ? (
                <div className="p-16 text-center text-slate-400 text-sm">
                  No active scheduled runs found. Click{' '}
                  <span className="font-semibold text-slate-700">"Generate Optimized Plan"</span> to compute slot assignments.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Corridor & Asset</th>
                      <th className="px-5 py-3">Defect Specification</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Assigned Block Window</th>
                      <th className="px-5 py-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduleList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 text-xs">{item.corridor_id}</div>
                          <div className="text-[11px] font-mono text-slate-500">{item.asset_id}</div>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="font-medium text-slate-800 text-xs leading-snug">
                            {item.defect_type}
                          </div>
                          <div className="mt-1">
                            <SeverityBadge severity={item.severity} />
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <DepartmentBadge department={item.department_name} size="sm" />
                        </td>
                        <td className="px-5 py-3.5">
                          {item.slot_start_time ? (
                            <div className="text-xs space-y-0.5">
                              <div className="font-semibold text-emerald-800 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                {new Date(item.slot_start_time).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {new Date(item.slot_start_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                -{' '}
                                {new Date(item.slot_end_time || '').toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">Slot #{item.slot_id}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-blue-600">
                          {Number(item.score).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Unscheduled / Backlog Table */
            <div className="overflow-x-auto">
              {unscheduledList.length === 0 ? (
                <div className="p-16 text-center text-slate-400 text-sm">
                  All candidate tasks were successfully scheduled during this horizon!
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Corridor & Asset</th>
                      <th className="px-5 py-3">Defect Description</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Reason Code & Explanation</th>
                      <th className="px-5 py-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unscheduledList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 text-xs">{item.corridor_id}</div>
                          <div className="text-[11px] font-mono text-slate-500">{item.asset_id}</div>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="font-medium text-slate-800 text-xs leading-snug">
                            {item.defect_type}
                          </div>
                          <div className="mt-1">
                            <SeverityBadge severity={item.severity} />
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <DepartmentBadge department={item.department_name} size="sm" />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="inline-block px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                            {formatReasonCode(item.reason_code)}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-slate-500">
                          {Number(item.score).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Right 4 Cols: AI Insights Cards */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base px-1">
            <BrainCircuit className="w-5 h-5 text-blue-600" />
            <span>AI Insights & Analytics</span>
          </div>

          {/* Insight Card 1: Scheduling Capacity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Optimization Throughput</span>
              <span className="text-blue-600 font-bold font-mono">
                {metricsData?.uptime_pct || 0}% Uptime
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {scheduleList.length} of {totalTasks} Tasks Scheduled
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Allocated {scheduleList.length} maintenance blocks during the {horizon} horizon. Higher-priority items were favored to maximize network safety.
            </p>
          </div>

          {/* Insight Card 2: Highest Deferred Priority */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
              <span>Backlog Recommendation</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            {highestDeferred ? (
              <>
                <div className="text-sm font-bold text-slate-900">
                  Top Deferred: {highestDeferred.asset_id}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  "{highestDeferred.defect_type}" (Score: {Number(highestDeferred.score).toFixed(2)}) deferred due to corridor slot capacity. Recommended for next monthly cycle.
                </p>
              </>
            ) : (
              <div className="text-xs text-emerald-700 font-medium">
                No deferred critical items! Full backlog clear in current horizon.
              </div>
            )}
          </div>

          {/* Insight Card 3: Conflicts Resolved vs Manual */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-2">
            <div className="text-xs font-semibold text-blue-300 uppercase flex items-center justify-between">
              <span>Coordination Engine</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {metricsData?.conflicts_resolved || 0} Conflicts Avoided
            </div>
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Prevented double-bookings and timetable collisions across Engineering, S&T, and TRD that occurred in the naive baseline.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-400 font-semibold">
              Downtime Saved: {metricsData?.downtime_hours_saved || 0} hrs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
