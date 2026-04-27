import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/UI';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.senha.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await register(form.nome, form.email, form.senha);
      navigate('/escritorio');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar');
    } finally { setLoading(false); }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>ZEM<span className={styles.logoAccent}>POFY</span></div>
        <h1 className={styles.title}>Criar conta</h1>
        <p className={styles.sub}>Comece a organizar seu escritório</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Nome completo" placeholder="João Silva" value={form.nome} onChange={set('nome')} required />
          <Input label="E-mail" type="email" placeholder="voce@escritorio.com" value={form.email} onChange={set('email')} required />
          <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={set('senha')} required />
          <Btn variant="primary" size="lg" loading={loading} type="submit" style={{ width:'100%', marginTop:4 }}>
            Criar conta
          </Btn>
        </form>
        <p className={styles.footer}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
