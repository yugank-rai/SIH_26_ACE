import React from 'react';

interface DepartmentBadgeProps {
  department: 'Engineering' | 'S&T' | 'Traction Distribution' | string;
  size?: 'sm' | 'md';
}

export const DepartmentBadge: React.FC<DepartmentBadgeProps> = ({ department, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (department) {
    case 'Engineering':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
          Engineering
        </span>
      );
    case 'S&T':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          S&T
        </span>
      );
    case 'Traction Distribution':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md bg-rose-50 text-rose-900 ring-1 ring-inset ring-rose-700/20 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-700 mr-1.5" />
          Traction Distribution
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20 ${sizeClasses}`}
        >
          {department}
        </span>
      );
  }
};

interface SeverityBadgeProps {
  severity: number;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  if (severity >= 5) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1 animate-pulse" />
        CRITICAL ({severity})
      </span>
    );
  }
  if (severity >= 3) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
        MEDIUM ({severity})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      ROUTINE ({severity})
    </span>
  );
};
