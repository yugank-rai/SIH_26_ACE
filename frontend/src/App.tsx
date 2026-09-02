import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar, ScreenTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { DashboardScreen } from './screens/DashboardScreen';
import { PlannerScreen } from './screens/PlannerScreen';
import { AssetsScreen } from './screens/AssetsScreen';
import { CorridorsScreen } from './screens/CorridorsScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ScreenTab>('dashboard');

  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Operations Dashboard',
          subtitle: 'Systemwide corridor maintenance capacity and uptime metrics',
        };
      case 'planner':
        return {
          title: 'AI Corridor Slot Planner',
          subtitle: 'Constraint-based maintenance block optimization powered by OR-Tools CP-SAT',
        };
      case 'assets':
        return {
          title: 'Infrastructure Maintenance Assets',
          subtitle: 'Defect ticketing, inspection severity, and department coordination',
        };
      case 'corridors':
        return {
          title: 'Corridor Traffic & Block Monitor',
          subtitle: 'Passenger timetables, freight paths, and slot availability matrix',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Dark Navy Fixed Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={headerInfo.title} subtitle={headerInfo.subtitle} />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardScreen
              onNavigateToPlanner={() => setCurrentTab('planner')}
              onNavigateToAssets={() => setCurrentTab('assets')}
            />
          )}
          {currentTab === 'planner' && <PlannerScreen />}
          {currentTab === 'assets' && <AssetsScreen />}
          {currentTab === 'corridors' && <CorridorsScreen />}
        </main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
