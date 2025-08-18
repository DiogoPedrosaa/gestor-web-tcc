import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import DashboardPage from "../pages/Dashboard";
import UsersPage from "../pages/Users";
import FoodsPage from "../pages/Foods";
import ReportsPage from "../pages/Reports";
import LoginPage from "../pages/Login";
import ComplicationsPage from "../pages/Complications";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
        
          <Route path="/login" element={<LoginPage />} />

         
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute requireAdmin><DashboardPage /></ProtectedRoute>} />
            <Route path="/usuarios"  element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
            <Route path="/alimentos" element={<ProtectedRoute requireAdmin><FoodsPage /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute requireAdmin><ReportsPage /></ProtectedRoute>} />
            <Route path="/complicações" element={<ProtectedRoute requireAdmin><ComplicationsPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
