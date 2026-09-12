import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { SettingsProvider } from './theme/SettingsContext';
import { LoginPage } from './auth/LoginPage';
import { Layout } from './components/Layout';
import { PersonsPage } from './pages/PersonsPage';
import { EventsPage } from './pages/EventsPage';
import { SpecimensPage } from './pages/SpecimensPage';
import { LinkagesPage } from './pages/LinkagesPage';
import { ContactsPage } from './pages/ContactsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LabMessagePage } from './pages/LabMessagePage';
import { SettingsPage } from './pages/SettingsPage';
import './index.css';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/persons" replace />} />
          <Route path="persons" element={<PersonsPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="specimens" element={<SpecimensPage />} />
          <Route path="linkages" element={<LinkagesPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="lab-message" element={<LabMessagePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="trace/link" element={<ContactsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/persons" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}