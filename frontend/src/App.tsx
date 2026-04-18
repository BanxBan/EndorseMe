import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientProfile from './pages/PatientProfile';
import DetailScreen from './pages/DetailScreen';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
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
