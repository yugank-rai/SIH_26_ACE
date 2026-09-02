import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDefects } from '../lib/api';
import { Defect } from '../types';
import { DepartmentBadge, SeverityBadge } from '../components/Badge';
import { NewDefectModal } from '../components/NewDefectModal';
import { Plus, Search, ShieldCheck, MapPin } from 'lucide-react';

export const AssetsScreen: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: defects = [], isLoading, refetch } = useQuery({
    queryKey: ['defects'],
    queryFn: getDefects,
  });

  const filteredDefects = defects.filter((d) => {
    const matchesDept = selectedDept === 'All' || d.department_name === selectedDept;
    const matchesSearch =
      searchQuery === '' ||
      d.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.corridor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.defect_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const activeDefect = selectedDefect || (filteredDefects.length > 0 ? filteredDefects[0] : null);

  const deptTabs = ['All', 'Engineering', 'S&T', 'Traction Distribution'];

  return (
    <div className="p-8 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Maintenance Asset Backlog</h2>
          <p className="text-sm text-slate-500">
            Track, inspect, and manage infrastructure defects across Indian Railways corridors
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/30 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Defect
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Department Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {deptTabs.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                selectedDept === dept
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {dept} {dept === 'All' ? `(${defects.length})` : `(${defects.filter((d) => d.department_name === dept).length})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search asset, corridor, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Defect Table (7 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Defects List ({filteredDefects.length})
            </div>
            <div className="text-xs text-slate-400">Click a row to view full details</div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading defects list...</div>
          ) : filteredDefects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No defects match your filter.</div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50/80 sticky top-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Asset ID</th>
                    <th className="px-4 py-3">Defect Type</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Overdue</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDefects.map((defect) => {
                    const isSelected = activeDefect?.id === defect.id;
                    return (
                      <tr
                        key={defect.id}
                        onClick={() => setSelectedDefect(defect)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 hover:bg-blue-50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                          {defect.asset_id}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {defect.corridor_id}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 max-w-[220px]">
                          <div
                            className="font-medium text-slate-900 truncate"
                            title={defect.defect_type}
                          >
                            {defect.defect_type}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <DepartmentBadge department={defect.department_name} size="sm" />
                        </td>
                        <td className="px-4 py-3.5">
                          <SeverityBadge severity={defect.severity} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">
                          {defect.overdue_days} days
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase ${
                              defect.status === 'open'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {defect.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Detail Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs p-6 sticky top-24 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Asset Detail View</h3>
            <span className="text-xs font-mono text-slate-400">ID #{activeDefect?.id}</span>
          </div>

          {activeDefect ? (
            <div className="space-y-5">
              {/* Asset Badge & Type */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-800 border border-slate-200">
                    {activeDefect.asset_id}
                  </span>
                  <DepartmentBadge department={activeDefect.department_name} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 leading-snug">
                  {activeDefect.defect_type}
                </h4>
              </div>

              {/* Corridor & Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <div className="text-slate-400 font-medium mb-0.5">Corridor Route</div>
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {activeDefect.corridor_id}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium mb-0.5">Severity Rating</div>
                  <SeverityBadge severity={activeDefect.severity} />
                </div>
                <div>
                  <div className="text-slate-400 font-medium mb-0.5">Overdue Days</div>
                  <div className="font-bold text-slate-800 font-mono text-sm">
                    {activeDefect.overdue_days} days
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium mb-0.5">Defect Status</div>
                  <span className="inline-block font-semibold uppercase text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-[10px]">
                    {activeDefect.status}
                  </span>
                </div>
              </div>

              {/* Maintenance Context */}
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  AI Planning Assessment
                </div>
                <p className="text-blue-950/80 leading-relaxed">
                  Candidate for CP-SAT slot assignment. Safety risk score weighted heavily based on{' '}
                  <span className="font-semibold">{activeDefect.department_name}</span> protocols and{' '}
                  <span className="font-semibold">{activeDefect.overdue_days} overdue days</span>.
                </p>
              </div>

              {/* Timestamps */}
              <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-100">
                <div>Logged: {new Date(activeDefect.created_at).toLocaleString()}</div>
                <div>Target Resolution: Next Available Designated Block Window</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Select an asset from the list to inspect specifications.
            </div>
          )}
        </div>
      </div>

      {/* Log Defect Modal */}
      <NewDefectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
