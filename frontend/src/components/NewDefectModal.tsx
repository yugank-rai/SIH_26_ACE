import React, { useState } from 'react';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { createDefect, dispatchToast } from '../lib/api';

interface NewDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewDefectModal: React.FC<NewDefectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [corridorId, setCorridorId] = useState('NDLS-PNP');
  const [deptId, setDeptId] = useState(1);
  const [assetId, setAssetId] = useState('');
  const [defectType, setDefectType] = useState('');
  const [severity, setSeverity] = useState(4);
  const [overdueDays, setOverdueDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectType.trim()) {
      setError('Please provide a description of the defect.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createDefect({
        dept_id: deptId,
        corridor_id: corridorId,
        asset_id: assetId.trim() || undefined,
        defect_type: defectType.trim(),
        severity: Number(severity),
        overdue_days: Number(overdueDays),
        status: 'open',
      });

      dispatchToast('New maintenance defect logged successfully!', 'success');
      onSuccess();
      onClose();
      // Reset form
      setDefectType('');
      setAssetId('');
      setSeverity(4);
      setOverdueDays(7);
    } catch (err: any) {
      setError(err?.message || 'Failed to create defect');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Log Maintenance Defect</h2>
            <p className="text-xs text-slate-500">Record a new infrastructure issue for optimization</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Department
              </label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              >
                <option value={1}>Engineering (Track/Civil)</option>
                <option value={2}>S&T (Signals & Telecom)</option>
                <option value={3}>Traction Distribution (TRD)</option>
              </select>
            </div>

            {/* Corridor */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Corridor
              </label>
              <select
                value={corridorId}
                onChange={(e) => setCorridorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              >
                <option value="NDLS-PNP">NDLS-PNP (Panipat)</option>
                <option value="NDLS-GZB">NDLS-GZB (Ghaziabad)</option>
                <option value="NDLS-AGC">NDLS-AGC (Agra Cantt)</option>
                <option value="NDLS-CNB">NDLS-CNB (Kanpur)</option>
                <option value="NDLS-UMB">NDLS-UMB (Ambala)</option>
              </select>
            </div>
          </div>

          {/* Asset ID */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Asset ID <span className="text-slate-400 font-normal">(optional, auto-generated if empty)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. TRK-NDLS-PNP-014 or SIG-GZB-102"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
            />
          </div>

          {/* Defect Type / Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Defect Description & Type
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Ultrasonic flaw detected on weld joint near km 42"
              value={defectType}
              onChange={(e) => setDefectType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Severity (1-5) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Severity Level: <span className="text-blue-600 font-bold">{severity} / 5</span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>1 (Routine)</span>
                <span>3 (Medium)</span>
                <span>5 (Critical)</span>
              </div>
            </div>

            {/* Overdue Days */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Overdue Days
              </label>
              <input
                type="number"
                min={0}
                max={180}
                required
                value={overdueDays}
                onChange={(e) => setOverdueDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm shadow-blue-500/30 flex items-center space-x-1.5 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Defect</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
