import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/UI';
import api from '../services/api';
import toast from 'react-hot-toast';
import styles from './Escritorio.module.css';

export default function Escritorio() {
  const { atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState('criar');
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  async function criar(e) {
    e.preventDefault();
    if (!nome.trim()) { toast.error('Informe o nome do escritório'); return; }
    setLoading(true);
    try {
      await api.post('/escritorio', { nome });
      const { data } = await api.get('/auth/me');
      atualizarUsuario(data.usuario);
      toast.success('Escritório criado!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar escritório');
    } finally { setLoading(false); }
  }

  async function entrar(e) {
    e.preventDefault();
    if (!slug.trim()) { toast.error('Informe o código do escritório'); return; }
    setLoading(true);
    try {
      await api.post('/escritorio/entrar', { slug: slug.trim().toLowerCase() });
      const { data } = await api.get('/auth/me');
      atualizarUsuario(data.usuario);
      toast.success('Você entrou no escritório!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Escritório não encontrado');
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>ZEM<span className={styles.logoAccent}>POFY</span></div>
        <h1 className={styles.title}>Configurar escritório</h1>
        <p className={styles.sub}>Crie um escritório ou entre em um existente com o código</p>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${aba==='criar'?styles.tabActive:''}`} onClick={() => setAba('criar')}>Criar escritório</button>
          <button className={`${styles.tab} ${aba==='entrar'?styles.tabActive:''}`} onClick={() => setAba('entrar')}>Entrar em um</button>
        </div>
        {aba === 'criar' ? (
          <form onSubmit={criar} className={styles.form}>
            <Input label="Nome do escritório" placeholder="Ex: Silva Contabilidade"
              value={nome} onChange={e => setNome(e.target.value)} required />
            <p className={styles.hint}>Após criar, compartilhe o código gerado com sua equipe.</p>
            <Btn variant="primary" size="lg" loading={loading} type="submit" style={{ width:'100%' }}>Criar escritório</Btn>
          </form>
        ) : (
          <form onSubmit={entrar} className={styles.form}>
            <Input label="Código do escritório" placeholder="Ex: silva-contabilidade"
              value={slug} onChange={e => setSlug(e.target.value)} required />
            <p className={styles.hint}>Peça o código para o administrador do seu escritório.</p>
            <Btn variant="primary" size="lg" loading={loading} type="submit" style={{ width:'100%' }}>Entrar no escritório</Btn>
          </form>
        )}
      </div>
    </div>
  );
}
