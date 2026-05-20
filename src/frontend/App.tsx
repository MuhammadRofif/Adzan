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
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    width: '100%',
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '4px solid #e5e7eb',
      borderTopColor: '#10b981',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
