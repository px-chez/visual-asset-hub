// App.jsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserAuth } from './context/AuthContext';
import './index.css'; // Твои стили

const App = () => {
  const { session, signOut, profile } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Определяем, находимся ли мы на страницах авторизации
  const isAuthPage = ['/signin', '/signup', '/'].includes(location.pathname);

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      
      {/* === ШАПКА САЙТА (Скрывается на страницах входа) === */}
      {!isAuthPage && (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
          <div className="container">
            <a className="navbar-brand fw-bold" href="/main">
              🎨 DesignHub
            </a>
            
            {session && (
              <div className="d-flex align-items-center gap-3">
                {/* Меню навигации */}
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <a className="nav-link" href="/main">Мои проекты</a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="/settings">Настройки</a>
                  </li>
                </ul>

                {/* Профиль и Выход */}
                <div className="d-flex align-items-center text-white">
                  <span className="me-2 small opacity-75">
                    {profile?.full_name || session?.user?.email}
                  </span>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleSignOut}
                  >
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* === ОСНОВНОЙ КОНТЕНТ === */}
      <main className="flex-grow-1 container py-4">
        {/* Outlet рендерит компонент, который соответствует текущему URL */}
        {/* Например: <Landing />, <Signin />, <Profile /> */}
        <Outlet />
      </main>

      {/* === ПОДВАЛ === */}
      {!isAuthPage && (
        <footer className="bg-dark text-white text-center py-3 mt-auto">
          <div className="container small">
            © {new Date().getFullYear()} DesignHub. Курсовая работа.
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;