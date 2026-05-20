import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { BocilLayout } from './components/layout/BocilLayout';
import { AdminGuard } from './components/layout/AdminGuard';

import { Dashboard } from './pages/Dashboard';
import { Participants } from './pages/Participants';
import { SchedulePage } from './pages/Schedule';
import { Tracking } from './pages/Tracking';
import { QuizPage } from './pages/Quiz';
import { Redeem } from './pages/Redeem';
import { Settings } from './pages/Settings';
import { AdminLogin } from './pages/AdminLogin';
import { BocilDashboard } from './pages/bocil/BocilDashboard';
import { BocilQuiz } from './pages/bocil/BocilQuiz';
import { BocilRedeem } from './pages/bocil/BocilRedeem';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
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

      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
