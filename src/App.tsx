import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { CommonDashboardPage } from './pages/CommonDashboardPage';
import { ManagementDashboardPage } from './pages/ManagementDashboardPage';

/**
 * Redireciona automaticamente cada perfil para sua página correspondente:
 * - COMMON -> /portal (CommonDashboardPage - somente visualização / reserva futura)
 * - ADMIN / OWNER -> /gestao (ManagementDashboardPage - painel administrativo)
 */
const RoleHomeRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return user.role === 'COMMON' ? (
    <Navigate to="/portal" replace />
  ) : (
    <Navigate to="/gestao" replace />
  );
};

const CommonRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'COMMON') {
    return <Navigate to="/gestao" replace />;
  }
  return <>{children}</>;
};

const ManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'COMMON') {
    return <Navigate to="/portal" replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/painel" replace /> : <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route path="/painel" element={<RoleHomeRedirect />} />
          <Route
            path="/portal"
            element={
              <CommonRoute>
                <CommonDashboardPage />
              </CommonRoute>
            }
          />
          <Route
            path="/gestao"
            element={
              <ManagementRoute>
                <ManagementDashboardPage />
              </ManagementRoute>
            }
          />
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
