import { Navigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = UserAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/signin" replace />;
  return children;
};

export default ProtectedRoute;