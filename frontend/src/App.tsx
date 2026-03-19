import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Leaderboard from './pages/Dashboard/Leaderboard';
import Login from './pages/Auth/Login';
import Profile from './pages/Profile/Profile';
import EditProfile from './pages/Profile/EditProfile';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const token = localStorage.getItem('token');
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-text-main font-sans selection:bg-primary/30">
      <Navbar />
      {/* No top padding here – each page handles its own spacing to account for the fixed navbar */}
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" replace />} />
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
