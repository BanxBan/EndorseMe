import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthGateway from './pages/AuthGateway';
import Dashboard from './pages/Dashboard';
import PatientProfile from './pages/PatientProfile';
import DetailScreen from './pages/DetailScreen';
import NurseProfile from './pages/NurseProfile';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthGateway />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/auth'} replace />} />
        <Route 
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile"
          element={
            <ProtectedRoute>
              <NurseProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient/:id" 
          element={
            <ProtectedRoute>
              <PatientProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient/:id/:type" 
          element={
            <ProtectedRoute>
              <DetailScreen />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
