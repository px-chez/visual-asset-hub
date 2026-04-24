// router.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";

// Импорт основных компонентов
import App from "./App";
import Signin from "./components/auth/Signin";
import Signup from "./components/auth/Signup"
import Landing from "./pages/Landing";

// Импорт компонента защиты (убедись, что файл ProtectedRoute.jsx создан)
import ProtectedRoute from "./components/auth/ProtectedRoute"

export const router = createBrowserRouter([
  {
    // Главный путь. Здесь рендерится App.jsx (с Header и Footer)
    path: "/",
    element: <App />,
    children: [
      // 1. По умолчанию (если зашли просто на сайт) перенаправляем на вход или дашборд
      { index: true, element: <Navigate to="/main" replace /> },
      
      // 2. Публичные страницы (авторизация)
      { path: "signin", element: <Signin /> },
      { path: "signup", element: <Signup /> },

      // 3. Защищенные страницы (доступны только после входа)
      {
        path: "main",
        element: (
          <ProtectedRoute>
            <Landing />
          </ProtectedRoute>
        ),
      },
      
      // Сюда в будущем будешь добавлять новые страницы, например:
      // {
      //   path: "project/:id",
      //   element: (
      //     <ProtectedRoute>
      //       <ProjectView />
      //     </ProtectedRoute>
      //   )
      // },
    ],
  },
]);