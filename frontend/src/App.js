import React, { useState, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';

// Lazy load pages
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const PassengersList = React.lazy(() => import('./pages/PassengersList'));
const PassengerDetails = React.lazy(() => import('./pages/PassengerDetails'));
const AddEditPassenger = React.lazy(() => import('./pages/AddEditPassenger'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const AdvanceTargetPage = React.lazy(() => import('./pages/AdvanceTargetPage'));
const ExportPage = React.lazy(() => import('./pages/ExportPage'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const AddEditUser = React.lazy(() => import('./pages/AddEditUser'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  const [, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const handleLogin = (userData, token) => {
    setIsAuthenticated(true);
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <ThemeProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <div className="app">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/passengers"
                element={
                  <PrivateRoute>
                    <PassengersList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/passengers/:id"
                element={
                  <PrivateRoute>
                    <PassengerDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/passengers/add"
                element={
                  <PrivateRoute>
                    <AddEditPassenger />
                  </PrivateRoute>
                }
              />
              <Route
                path="/passengers/:id/edit"
                element={
                  <PrivateRoute>
                    <AddEditPassenger />
                  </PrivateRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <PrivateRoute>
                    <AnalyticsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/advance-target"
                element={
                  <PrivateRoute>
                    <AdvanceTargetPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/export"
                element={
                  <PrivateRoute>
                    <ExportPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute>
                    <UserManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users/add"
                element={
                  <PrivateRoute>
                    <AddEditUser />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users/:id/edit"
                element={
                  <PrivateRoute>
                    <AddEditUser />
                  </PrivateRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <PrivateRoute>
                    <AuditLogs />
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
