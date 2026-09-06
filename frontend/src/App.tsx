import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreHome } from './pages/store/StoreHome';
import { Login } from './pages/admin/Login';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { POS } from './pages/admin/POS';
import { Invoices } from './pages/admin/Invoices';
import { Purchases } from './pages/admin/Purchases';
import { Inventory } from './pages/admin/Inventory';
import { Debts } from './pages/admin/Debts';
import { Clients } from './pages/admin/Clients';
import { Rates } from './pages/admin/Rates';
import { Settings } from './pages/admin/Settings';
import { CashRegister } from './pages/admin/CashRegister';
import { KitchenDisplay } from './pages/admin/KitchenDisplay';
import { useAuthStore } from './store/useAuthStore';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Store / Catalog */}
        <Route path="/" element={<StoreHome />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Protected Admin Backoffice */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="cocina" element={<KitchenDisplay />} />
          <Route path="caja" element={<CashRegister />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="debts" element={<Debts />} />
          <Route path="clients" element={<Clients />} />
          <Route path="rates" element={<Rates />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
