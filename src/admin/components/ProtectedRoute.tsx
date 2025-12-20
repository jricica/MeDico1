import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta requiere admin
  if (requireAdmin) {
    // Si NO es admin, redirigir al dashboard de usuario
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
    // Si es admin, permitir acceso
    return <>{children}</>;
  }

  // Si NO requiere admin (es ruta de usuario normal)
  // Si ES admin, redirigir al panel de admin
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Si es usuario normal, permitir acceso
  return <>{children}</>;
}