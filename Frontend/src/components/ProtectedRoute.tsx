import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

export const ProtectedRoute = () => {
  if (import.meta.env.DEV) return <Outlet />;
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const CaRoute = () => {
  if (import.meta.env.DEV) return <Outlet />;
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "CA_PARTNER") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  if (import.meta.env.DEV) return <Navigate to="/dashboard" replace />;
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};
