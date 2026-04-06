import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/Admin';
import { ToastContainer } from './components/Toast';
import { useAuthStore } from './store/useAuthStore';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />;
};
const AdminRoute = ({ children }: { children: React.ReactElement }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token && role === 'admin' ? children : <Navigate to="/" replace />;
};

export default function App() {
  const { theme, fetchMe, token } = useAuthStore();

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Restore user profile on refresh
  useEffect(() => {
    if (token) fetchMe();
  }, []);

  const T = theme === 'dark';
  const bg = T ? '#161b22' : '#ffffff';
  const color = T ? '#e6edf3' : '#1f2328';

  return (
    <Router>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', background: bg, color }}>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <PrivateRoute>
              <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
                <Sidebar />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                  <ChatWindow />
                </div>
              </div>
            </PrivateRoute>
          } />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        </Routes>
      </div>
    </Router>
  );
}
