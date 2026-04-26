import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Escritorio  from './pages/Escritorio';
import Dashboard   from './pages/Dashboard';

function RotaProtegida({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-2)', fontSize:13 }}>Carregando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

function RotaPublica({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  if (usuario) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<RotaPublica><Login /></RotaPublica>} />
      <Route path="/cadastro" element={<RotaPublica><Register /></RotaPublica>} />
      <Route path="/escritorio" element={<RotaProtegida><Escritorio /></RotaProtegida>} />
      <Route path="/"         element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
