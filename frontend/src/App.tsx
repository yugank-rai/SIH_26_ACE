import React from 'react';

export const App: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight text-white">RailAID Platform</h1>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          AI-assisted railway maintenance scheduling, corridor conflict resolution, and slot optimization engine.
        </p>

        <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
          <div className="text-slate-500 uppercase font-semibold">Environment Config</div>
          <div className="flex justify-between text-slate-300">
            <span>API Target:</span>
            <span className="text-blue-400">{apiUrl}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Status:</span>
            <span className="text-emerald-400">Scaffold Initialized</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center">
          Pages and interactive dashboard modules will be connected in subsequent phases.
        </div>
      </div>
    </div>
  );
};

export default App;
