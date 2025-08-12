import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import React from "react";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: { children: React.ReactElement; requireAdmin?: boolean }) {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (requireAdmin && profile?.role !== "admin") {
    return <Navigate to="/login" replace state={{ reason: "not-admin" }} />;
  }
  return children;
}
