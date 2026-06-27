import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { BocilLayout } from './components/layout/BocilLayout';
import { AdminGuard } from './components/layout/AdminGuard';

// ── Lazy-loaded pages (Route-level code splitting) ──────────────────────────
// Bocil (public) pages
const BocilDashboard = React.lazy(() =>
  import('./pages/bocil/BocilDashboard').then(m => ({ default: m.BocilDashboard }))
);
const BocilQuiz = React.lazy(() =>
  import('./pages/bocil/BocilQuiz').then(m => ({ default: m.BocilQuiz }))
);
const BocilRedeem = React.lazy(() =>
  import('./pages/bocil/BocilRedeem').then(m => ({ default: m.BocilRedeem }))
);
const SeasonHistory = React.lazy(() =>
  import('./pages/SeasonHistory').then(m => ({ default: m.SeasonHistoryPage }))
);

// Admin pages
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then(m => ({ default: m.Dashboard }))
);
const Participants = React.lazy(() =>
  import('./pages/Participants').then(m => ({ default: m.Participants }))
);
const SchedulePage = React.lazy(() =>
  import('./pages/Schedule').then(m => ({ default: m.SchedulePage }))
);
const Tracking = React.lazy(() =>
  import('./pages/Tracking').then(m => ({ default: m.Tracking }))
);
const QuizPage = React.lazy(() =>
  import('./pages/Quiz').then(m => ({ default: m.QuizPage }))
);
const Redeem = React.lazy(() =>
  import('./pages/Redeem').then(m => ({ default: m.Redeem }))
);
const Settings = React.lazy(() =>
  import('./pages/Settings').then(m => ({ default: m.Settings }))
);
const AdminLogin = React.lazy(() =>
  import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin }))
);

// ── Lightweight Loading Spinner (pure CSS, no library) ──────────────────────
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
    {/* Skeleton Header */}
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 rounded-full bg-gray-200"></div>
      <div className="flex-1">
        <div className="h-6 w-1/3 bg-gray-200 rounded-md mb-2"></div>
        <div className="h-4 w-1/4 bg-gray-200 rounded-md"></div>
      </div>
    </div>
    
    {/* Skeleton Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
      <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
    </div>
    
    {/* Skeleton List */}
    <div className="mt-4 flex flex-col gap-3">
      <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
      <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
      <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Bocil (Public) Routes - Kid-friendly dashboard */}
            <Route path="/" element={<BocilLayout />}>
              <Route index element={<BocilDashboard />} />
              <Route path="quiz" element={<BocilQuiz />} />
              <Route path="redeem" element={<BocilRedeem />} />
              <Route path="seasons" element={<SeasonHistory />} />
            </Route>

            {/* Admin Login */}
            <Route path="/login" element={<AdminLogin />} />

            {/* Admin Routes - Protected by password */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="participants" element={<Participants />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="quiz" element={<QuizPage />} />
                <Route path="redeem" element={<Redeem />} />
                <Route path="settings" element={<Settings />} />
                <Route path="seasons" element={<SeasonHistory />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
