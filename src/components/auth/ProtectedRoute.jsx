// components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { session, profile, loading } = UserAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/main" replace />;
  }

  return children;
};

export default ProtectedRoute;