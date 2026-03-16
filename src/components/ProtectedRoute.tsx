import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, canAccess } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default page
    const defaultRoutes: Record<string, string> = {
      "Administrador": "/dashboard",
      "Técnico Validador": "/tecnico",
      "Auditor / Fiscal TCA": "/dashboard",
      "Secretaria": "/secretaria",
      "Preparador / Contabilista": "/portal",
    };
    return <Navigate to={defaultRoutes[user.role] || "/login"} replace />;
  }

  return <>{children}</>;
}
