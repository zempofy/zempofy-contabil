import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => setUsuario(r.data.usuario))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  async function register(nome, email, senha) {
    const { data } = await api.post('/auth/register', { nome, email, senha });
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    localStorage.removeItem('token');
    setUsuario(null);
  }

  function atualizarUsuario(u) { setUsuario(u); }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, register, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
