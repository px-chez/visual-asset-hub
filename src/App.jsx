import { Outlet, useLocation, Link } from 'react-router-dom';
import { UserAuth } from './context/AuthContext';

const App = () => {
  const { session, signOut, profile } = UserAuth();
  const location = useLocation();
  const isAuthPage = ['/signin', '/signup'].includes(location.pathname);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {!isAuthPage && session && (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
          <div className="container">
            <Link className="navbar-brand fw-bold" to="/main">
              🎨 DesignHub
            </Link>
            <div className="d-flex align-items-center gap-3">
              <ul className="navbar-nav flex-row gap-3">
                <li className="nav-item">
                  <Link className="nav-link" to="/main">
                    Мои проекты
                  </Link>
                </li>
              </ul>
              <div className="d-flex align-items-center text-white gap-3">
                <span className="small opacity-75">
                  {profile?.full_name || session?.user?.email}
                </span>
                <button className="btn btn-outline-danger btn-sm" onClick={handleSignOut}>
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-grow-1 container py-4">
        <Outlet />
      </main>

      {!isAuthPage && session && (
        <footer className="bg-dark text-white text-center py-3 mt-auto">
          <div className="container small">
            © {new Date().getFullYear()} DesignHub
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;