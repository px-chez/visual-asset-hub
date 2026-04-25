import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import Signin from './components/auth/Signin';
import Signup from './components/auth/Signup';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import DiffView from './pages/DiffView';
import ProtectedRoute from './components/auth/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,        // общий layout с шапкой и футером
    children: [
      { index: true, element: <Navigate to="/main" replace /> },
      { path: 'signin', element: <Signin /> },
      { path: 'signup', element: <Signup /> },
      {
        path: 'main',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'project/:projectId',
        element: (
          <ProtectedRoute>
            <ProjectView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'project/:projectId/diff',
        element: (
          <ProtectedRoute>
            <DiffView />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <Navigate to="/main" replace /> },
    ],
  },
]);

export default router;