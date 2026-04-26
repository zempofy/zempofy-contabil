import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/UI';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const usuario = await login(form.email, form.senha);
      if (!usuario.escritorio) navigate('/escritorio');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>📊</div>
        <h1 className={styles.title}>Controle Contábil</h1>
        <p className={styles.sub}>Entre na sua conta</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="E-mail" type="email" placeholder="voce@escritorio.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="Senha" type="password" placeholder="••••••••"
            value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} required />
          <Btn variant="primary" size="lg" loading={loading} type="submit" style={{ width: '100%', marginTop: 4 }}>
            Entrar
          </Btn>
        </form>
        <p className={styles.footer}>
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
