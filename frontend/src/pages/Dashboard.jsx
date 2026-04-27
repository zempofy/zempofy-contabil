import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Toggle, Badge, Modal, Btn, Input, Select, Textarea } from '../components/UI';
import api from '../services/api';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const hoje = new Date();

function eMesAtivo(freq, mes) {
  return freq === 'mensal' || [3,6,9,12].includes(mes);
}

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const [mes, setMes]       = useState(hoje.getMonth() + 1);
  const [ano, setAno]       = useState(hoje.getFullYear());
  const [periodos, setPeriodos] = useState([]);
  const [loadingPeriodos, setLoadingPeriodos] = useState(true);
  const [aba, setAba]       = useState('todas');
  const [filtroFreq, setFiltroFreq] = useState('todas');
  const [busca, setBusca]   = useState('');
  const [modalEmpresa, setModalEmpresa] = useState(null); // null | 'nova' | empresa obj
  const [modalPendentes, setModalPendentes] = useState(false);
  const [salvando, setSalvando] = useState({});

  // Anos disponíveis no select
  const anos = [];
  for (let a = hoje.getFullYear() - 2; a <= hoje.getFullYear() + 1; a++) anos.push(a);

  const carregarPeriodos = useCallback(async () => {
    setLoadingPeriodos(true);
    try {
      const { data } = await api.get(`/periodos?mes=${mes}&ano=${ano}`);
      setPeriodos(data.periodos);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingPeriodos(false);
    }
  }, [mes, ano]);

  useEffect(() => { carregarPeriodos(); }, [carregarPeriodos]);

  async function toggleExtrato(empresaId, valor) {
    setSalvando(s => ({ ...s, [empresaId + '_e']: true }));
    try {
      await api.patch(`/periodos/${empresaId}`, { mes, ano, extratoRecebido: valor });
      setPeriodos(ps => ps.map(p =>
        p.empresaId === empresaId
          ? { ...p, extratoRecebido: valor, contabilFechado: valor ? p.contabilFechado : false }
          : p
      ));
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(s => ({ ...s, [empresaId + '_e']: false })); }
  }

  async function toggleContabil(empresaId, valor) {
    setSalvando(s => ({ ...s, [empresaId + '_c']: true }));
    try {
      await api.patch(`/periodos/${empresaId}`, { mes, ano, contabilFechado: valor });
      setPeriodos(ps => ps.map(p => p.empresaId === empresaId ? { ...p, contabilFechado: valor } : p));
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(s => ({ ...s, [empresaId + '_c']: false })); }
  }

  // Filtros
  const lista = periodos.filter(p => {
    if (!eMesAtivo(p.frequencia, mes) && aba !== 'trimestrais') return false;
    if (filtroFreq !== 'todas' && p.frequencia !== filtroFreq) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (aba === 'sem-extrato')  return !p.extratoRecebido;
    if (aba === 'sem-contabil') return p.extratoRecebido && !p.contabilFechado;
    if (aba === 'trimestrais')  return p.frequencia === 'trimestral';
    return true;
  });

  // Métricas
  const ativos = periodos.filter(p => eMesAtivo(p.frequencia, mes));
  const metrics = {
    total:     ativos.length,
    extrato:   ativos.filter(p => p.extratoRecebido).length,
    aguardando:ativos.filter(p => !p.extratoRecebido).length,
    fechado:   ativos.filter(p => p.contabilFechado).length,
    pendente:  ativos.filter(p => !p.contabilFechado).length,
  };

  const pendentes = ativos.filter(p => !p.extratoRecebido);

  return (
    <div className={styles.root}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.dot} />
          <span className={styles.topbarTitle}>Controle Contábil</span>
          {usuario?.escritorio?.nome && (
            <span className={styles.topbarEsc}>{usuario.escritorio.nome}</span>
          )}
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.topbarUser}>{usuario?.nome}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sair</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Header com período */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{MESES[mes-1]} / {ano}</h1>
            <p className={styles.pageSub}>Gerencie extratos e fechamentos contábeis</p>
          </div>
          <div className={styles.headerControls}>
            <select className={styles.sel} value={mes} onChange={e => setMes(+e.target.value)}>
              {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className={styles.sel} value={ano} onChange={e => setAno(+e.target.value)}>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <Btn variant="primary" onClick={() => setModalEmpresa('nova')}>+ Empresa</Btn>
            <Btn onClick={() => setModalPendentes(true)}>Ver pendentes</Btn>
          </div>
        </div>

        {/* Métricas */}
        <div className={styles.metrics}>
          {[
            { label: 'No ciclo',           value: metrics.total,      color: '' },
            { label: 'Extrato recebido',   value: metrics.extrato,    color: 'green' },
            { label: 'Aguardando extrato', value: metrics.aguardando, color: 'amber' },
            { label: 'Contábil fechado',   value: metrics.fechado,    color: 'green' },
            { label: 'Contábil pendente',  value: metrics.pendente,   color: 'red'   },
          ].map(m => (
            <div key={m.label} className={styles.metric}>
              <div className={styles.metricLabel}>{m.label}</div>
              <div className={`${styles.metricValue} ${m.color ? styles[m.color] : ''}`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className={styles.tabs}>
          {[
            { key: 'todas',       label: 'Todas' },
            { key: 'sem-extrato', label: 'Sem extrato' },
            { key: 'sem-contabil',label: 'Contábil pendente' },
            { key: 'trimestrais', label: 'Trimestrais' },
          ].map(t => (
            <button key={t.key} className={`${styles.tab} ${aba === t.key ? styles.tabActive : ''}`}
              onClick={() => setAba(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* Barra de filtros */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className={styles.searchInput} placeholder="Buscar empresa..." value={busca}
              onChange={e => setBusca(e.target.value)} />
          </div>
          {['todas','mensal','trimestral'].map(f => (
            <button key={f} className={`${styles.filterBtn} ${filtroFreq === f ? styles.filterActive : ''}`}
              onClick={() => setFiltroFreq(f)}>
              {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className={styles.tableCard}>
          {loadingPeriodos ? (
            <div className={styles.loading}>Carregando...</div>
          ) : lista.length === 0 ? (
            <div className={styles.empty}>Nenhuma empresa encontrada para este filtro.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Freq.</th>
                  <th>Extrato</th>
                  <th>Contábil</th>
                  <th>Observações</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(p => {
                  const ativo = eMesAtivo(p.frequencia, mes);
                  return (
                    <tr key={p.empresaId}>
                      <td className={styles.tdNome}>{p.nome}</td>
                      <td>
                        <Badge color={p.frequencia === 'mensal' ? 'blue' : 'amber'}>
                          {p.frequencia === 'mensal' ? 'Mensal' : 'Trimestral'}
                        </Badge>
                      </td>
                      <td>
                        <Toggle
                          on={p.extratoRecebido}
                          disabled={salvando[p.empresaId + '_e']}
                          onClick={() => toggleExtrato(p.empresaId, !p.extratoRecebido)}
                        />
                      </td>
                      <td>
                        {ativo && p.extratoRecebido ? (
                          <Toggle
                            on={p.contabilFechado}
                            disabled={salvando[p.empresaId + '_c']}
                            onClick={() => toggleContabil(p.empresaId, !p.contabilFechado)}
                          />
                        ) : (
                          <Badge color="gray">{!ativo ? 'Fora do ciclo' : 'Aguarda extrato'}</Badge>
                        )}
                      </td>
                      <td className={styles.tdObs} title={p.observacoes || ''}>
                        {p.observacoes || <span className={styles.semObs}>sem obs.</span>}
                      </td>
                      <td>
                        <button className={styles.editBtn} onClick={() => setModalEmpresa(p)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal empresa */}
      <ModalEmpresa
        open={!!modalEmpresa}
        empresa={modalEmpresa === 'nova' ? null : modalEmpresa}
        onClose={() => setModalEmpresa(null)}
        onSaved={carregarPeriodos}
      />

      {/* Modal pendentes */}
      <Modal open={modalPendentes} onClose={() => setModalPendentes(false)}
        title={`Pendentes de extrato — ${MESES[mes-1]}/${ano}`}>
        <div style={{ padding: '16px 20px 20px' }}>
          {pendentes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              Todas as empresas do ciclo já enviaram o extrato! 🎉
            </p>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>
                <strong>{pendentes.length}</strong> empresa{pendentes.length > 1 ? 's' : ''} sem extrato:
              </p>
              <div className={styles.pendList}>
                {pendentes.map(p => <div key={p.empresaId}>{p.nome}</div>)}
              </div>
              <Btn style={{ marginTop: 14 }} onClick={() => {
                const txt = pendentes.map(p => `• ${p.nome}`).join('\n');
                navigator.clipboard.writeText(txt).then(() => toast.success('Lista copiada!'));
              }}>Copiar lista</Btn>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ─── Modal de empresa (criar / editar) ─── */
function ModalEmpresa({ open, empresa, onClose, onSaved }) {
  const [form, setForm] = useState({ nome: '', cnpj: '', frequencia: 'mensal', observacoes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresa) setForm({ nome: empresa.nome, cnpj: empresa.cnpj || '', frequencia: empresa.frequencia, observacoes: empresa.observacoes || '' });
    else setForm({ nome: '', cnpj: '', frequencia: 'mensal', observacoes: '' });
  }, [empresa, open]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setLoading(true);
    try {
      if (empresa) await api.put(`/empresas/${empresa.empresaId}`, form);
      else await api.post('/empresas', form);
      toast.success(empresa ? 'Empresa atualizada!' : 'Empresa adicionada!');
      onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  async function remover() {
    if (!confirm(`Remover "${empresa.nome}"?`)) return;
    try {
      await api.delete(`/empresas/${empresa.empresaId}`);
      toast.success('Empresa removida');
      onSaved(); onClose();
    } catch { toast.error('Erro ao remover'); }
  }

  return (
    <Modal open={open} onClose={onClose} title={empresa ? 'Editar empresa' : 'Nova empresa'}>
      <form onSubmit={salvar} style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Nome da empresa" placeholder="Razão social ou nome fantasia"
          value={form.nome} onChange={set('nome')} required />
        <Input label="CNPJ (opcional)" placeholder="00.000.000/0001-00"
          value={form.cnpj} onChange={set('cnpj')} />
        <Select label="Frequência contábil" value={form.frequencia} onChange={set('frequencia')}>
          <option value="mensal">Mensal</option>
          <option value="trimestral">Trimestral</option>
        </Select>
        <Textarea label="Observações" placeholder="Ex: distribuição de lucro mensal, ajuste no balancete..."
          value={form.observacoes} onChange={set('observacoes')} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          {empresa && <Btn variant="danger" type="button" onClick={remover} style={{ marginRight: 'auto' }}>Remover</Btn>}
          <Btn type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" loading={loading} type="submit">Salvar</Btn>
        </div>
      </form>
    </Modal>
  );
}
