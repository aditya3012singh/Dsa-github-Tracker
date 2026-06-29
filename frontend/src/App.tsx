import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Particles from './components/Layout/Particles';
import Leaderboard from './pages/Dashboard/Leaderboard';
import Login from './pages/Auth/Login';
import Profile from './pages/Profile/Profile';
import EditProfile from './pages/Profile/EditProfile';
import AdminLogin from './pages/Auth/AdminLogin';
import AdminDashboard from './pages/Auth/AdminDashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const adminKey = localStorage.getItem('adminKey');
  if (!adminKey) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

function App() {
  const token = localStorage.getItem('token');
  const adminKey = localStorage.getItem('adminKey');
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/admin/login';

  return (
    <div className="min-h-screen flex flex-col bg- text-text-main font-sans selection:bg-primary/30 relative">
      {/* ── WebGL Particle Background (Atmospheric Blur) ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ filter: 'blur(2px)' }}>
        <Particles
          particleColors={['#ffffff', '#ffffff', '#ddeeff', '#bbccff']}
          particleCount={450}
          particleSpread={15}
          speed={0.1}
          particleBaseSize={110}
          sizeRandomness={5}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={false}
          pixelRatio={2}
        />
      </div>
      {!hideNavbar && <Navbar />}
      {/* No top padding here – each page handles its own spacing to account for the fixed navbar */}
      <main className="flex-1 w-full flex flex-col">
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/admin/login" element={!adminKey ? <AdminLogin /> : <Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id?"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
