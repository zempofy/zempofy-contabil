import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge, Modal, Btn, Input, Select, Textarea } from '../components/UI';
import api from '../services/api';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const hoje = new Date();

function eMesAtivo(freq, mes) {
  return freq === 'mensal' || [3,6,9,12].includes(mes);
}

function mascaraCNPJ(v) {
  return v.replace(/\D/g,'').slice(0,14)
    .replace(/^(\d{2})(\d)/,'$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
    .replace(/\.(\d{3})(\d)/,'.$1/$2')
    .replace(/(\d{4})(\d)/,'$1-$2');
}

/* ─── Toast de desfazer ─── */
function useUndoToast() {
  const [state, setState] = useState({ show: false, msg: '', onUndo: null });
  const timer = useRef(null);

  function show(msg, onUndo) {
    clearTimeout(timer.current);
    setState({ show: true, msg, onUndo });
    timer.current = setTimeout(() => setState(s => ({ ...s, show: false, onUndo: null })), 3500);
  }

  function undo() {
    clearTimeout(timer.current);
    if (state.onUndo) state.onUndo();
    setState({ show: false, msg: '', onUndo: null });
  }

  return { toastState: state, showUndo: show, doUndo: undo };
}

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const [mes, setMes]   = useState(hoje.getMonth() + 1);
  const [ano, setAno]   = useState(hoje.getFullYear());
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [aba, setAba]   = useState('todas');
  const [busca, setBusca] = useState('');
  const [modalEmpresa, setModalEmpresa]     = useState(null);
  const [modalExtrato, setModalExtrato]     = useState(null);
  const [modalBancos, setModalBancos]       = useState(null);
  const [modalPendentes, setModalPendentes] = useState(false);
  const { toastState, showUndo, doUndo } = useUndoToast();

  const anos = [];
  for (let a = hoje.getFullYear() - 2; a <= hoje.getFullYear() + 1; a++) anos.push(a);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/periodos?mes=${mes}&ano=${ano}`);
      setPeriodos(data.periodos);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  }, [mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);

  async function toggleContabil(empresaId, valor) {
    const anterior = !valor;
    try {
      await api.patch(`/periodos/${empresaId}`, { mes, ano, contabilFechado: valor });
      setPeriodos(ps => ps.map(p => p.empresaId === empresaId ? { ...p, contabilFechado: valor } : p));
      showUndo(
        valor ? 'Contábil marcado como fechado' : 'Contábil reaberto',
        async () => {
          await api.patch(`/periodos/${empresaId}`, { mes, ano, contabilFechado: anterior });
          setPeriodos(ps => ps.map(p => p.empresaId === empresaId ? { ...p, contabilFechado: anterior } : p));
        }
      );
    } catch { toast.error('Erro ao salvar'); }
  }

  const lista = periodos.filter(p => {
    if (aba === 'todas') return !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
    if (!eMesAtivo(p.frequencia, mes) && aba !== 'trimestrais') return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (aba === 'sem-extrato')  return !p.extratoRecebido;
    if (aba === 'sem-contabil') return p.extratoRecebido && !p.contabilFechado;
    if (aba === 'trimestrais')  return p.frequencia === 'trimestral';
    return true;
  });

  const ativos = periodos.filter(p => eMesAtivo(p.frequencia, mes));
  const metrics = {
    total:      ativos.length,
    extrato:    ativos.filter(p => p.extratoRecebido).length,
    aguardando: ativos.filter(p => !p.extratoRecebido).length,
    fechado:    ativos.filter(p => p.contabilFechado).length,
    pendente:   ativos.filter(p => !p.contabilFechado).length,
  };
  const pendentes = ativos.filter(p => !p.extratoRecebido);

  return (
    <div className={styles.root}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.logo}>
            ZEM<span className={styles.logoAccent}>POFY</span>
          </div>
          <div className={styles.divider} />
          <span className={styles.pageLabel}>Contábil</span>
          {usuario?.escritorio?.nome && (
            <span className={styles.topbarEsc}>{usuario.escritorio.nome}</span>
          )}
        </div>
        <div className={styles.topbarRight}>
          <select className={styles.sel} value={mes} onChange={e => setMes(+e.target.value)}>
            {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className={styles.sel} value={ano} onChange={e => setAno(+e.target.value)}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <span className={styles.topbarUser}>{usuario?.nome}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sair</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{MESES[mes-1]} / {ano}</h1>
            <p className={styles.pageSub}>Controle de extratos e fechamentos contábeis</p>
          </div>
          <div className={styles.headerControls}>
            <Btn variant="primary" onClick={() => setModalEmpresa('nova')}>+ Empresa</Btn>
            <Btn onClick={() => setModalPendentes(true)}>Ver pendentes</Btn>
          </div>
        </div>

        {/* Métricas */}
        <div className={styles.metrics}>
          {[
            { label: 'No ciclo',           value: metrics.total,      color: '' },
            { label: 'Extrato completo',   value: metrics.extrato,    color: 'green' },
            { label: 'Aguardando extrato', value: metrics.aguardando, color: 'amber' },
            { label: 'Contábil fechado',   value: metrics.fechado,    color: 'blue' },
            { label: 'Contábil pendente',  value: metrics.pendente,   color: 'red' },
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
            { key: 'todas',        label: 'Todas' },
            { key: 'sem-extrato',  label: 'Sem extrato' },
            { key: 'sem-contabil', label: 'Contábil pendente' },
            { key: 'trimestrais',  label: 'Trimestrais' },
          ].map(t => (
            <button key={t.key}
              className={`${styles.tab} ${aba === t.key ? styles.tabActive : ''}`}
              onClick={() => setAba(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* Busca */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className={styles.searchInput} placeholder="Buscar empresa..."
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : lista.length === 0 ? (
          <div className={styles.empty}>Nenhuma empresa encontrada.</div>
        ) : (
          <div className={styles.cards}>
            {lista.map(p => (
              <EmpresaCard
                key={p.empresaId}
                periodo={p}
                mes={mes} ano={ano}
                ativo={eMesAtivo(p.frequencia, mes)}
                onEditarEmpresa={() => setModalEmpresa(p)}
                onGerenciarBancos={() => setModalBancos(p)}
                onToggleContabil={() => toggleContabil(p.empresaId, !p.contabilFechado)}
                showUndo={showUndo}
                onExtratoAtualizado={carregar}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modais */}
      <ModalEmpresa open={!!modalEmpresa} empresa={modalEmpresa === 'nova' ? null : modalEmpresa}
        onClose={() => setModalEmpresa(null)} onSaved={carregar} />

      {modalBancos && (
        <ModalBancos empresa={modalBancos} onClose={() => setModalBancos(null)} />
      )}

      <Modal open={modalPendentes} onClose={() => setModalPendentes(false)}
        title={`Pendentes — ${MESES[mes-1]}/${ano}`}>
        <div style={{ padding:'16px 20px 20px' }}>
          {pendentes.length === 0 ? (
            <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:16 }}>
              Todas as empresas já enviaram todos os extratos! 🎉
            </p>
          ) : (
            <>
              <p style={{ fontSize:13, color:'var(--text-2)', marginBottom:10 }}>
                <strong style={{ color:'var(--text)' }}>{pendentes.length}</strong> empresa{pendentes.length>1?'s':''} com extratos pendentes:
              </p>
              <div className={styles.pendList}>
                {pendentes.map(p => (
                  <div key={p.empresaId} style={{ padding:'6px 0', borderBottom:'0.5px solid var(--border)' }}>{p.nome}</div>
                ))}
              </div>
              <Btn style={{ marginTop:14 }} onClick={() => {
                navigator.clipboard.writeText(pendentes.map(p=>`• ${p.nome}`).join('\n'))
                  .then(() => toast.success('Lista copiada!'));
              }}>Copiar lista</Btn>
            </>
          )}
        </div>
      </Modal>

      {/* Toast desfazer */}
      <div className={`${styles.toast} ${toastState.show ? styles.show : ''}`}>
        <span style={{ color:'var(--text-2)' }}>{toastState.msg}</span>
        <button className={styles.toastUndo} onClick={doUndo}>Desfazer</button>
      </div>
    </div>
  );
}

/* ─── Card de empresa ─── */
function EmpresaCard({ periodo: p, mes, ano, ativo, onEditarEmpresa, onGerenciarBancos, onToggleContabil, showUndo, onExtratoAtualizado }) {
  const [extratos, setExtratos] = useState([]);
  const [loadingEx, setLoadingEx] = useState(true);
  const [salvando, setSalvando]   = useState({});

  const carregarExtratos = useCallback(() => {
    api.get(`/extratos/${p.empresaId}?mes=${mes}&ano=${ano}`)
      .then(r => setExtratos(r.data.extratos || []))
      .catch(() => {})
      .finally(() => setLoadingEx(false));
  }, [p.empresaId, mes, ano]);

  useEffect(() => { carregarExtratos(); }, [carregarExtratos]);

  async function toggleBanco(contaId, atual) {
    setSalvando(s => ({ ...s, [contaId]: true }));
    try {
      await api.patch(`/extratos/${p.empresaId}/${contaId}`, { mes, ano, recebido: !atual });
      setExtratos(es => es.map(e => e.contaId === contaId ? { ...e, recebido: !atual } : e));
      onExtratoAtualizado();
      const banco = extratos.find(e => e.contaId === contaId);
      showUndo(
        !atual ? `${banco?.banco} marcado` : `${banco?.banco} desmarcado`,
        async () => {
          await api.patch(`/extratos/${p.empresaId}/${contaId}`, { mes, ano, recebido: atual });
          setExtratos(es => es.map(e => e.contaId === contaId ? { ...e, recebido: atual } : e));
          onExtratoAtualizado();
        }
      );
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(s => ({ ...s, [contaId]: false })); }
  }

  const total     = extratos.length;
  const recebidos = extratos.filter(e => e.recebido).length;
  const todosOk   = total > 0 && recebidos === total;
  const faltam    = total - recebidos;

  return (
    <div className={`${styles.card} ${!ativo ? styles.cardInativo : ''}`}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardNome} title={p.nome}>{p.nome}</div>
        <Badge color={p.frequencia === 'mensal' ? 'blue' : 'amber'}>
          {p.frequencia === 'mensal' ? 'Mensal' : 'Trim.'}
        </Badge>
      </div>

      {p.observacoes && <div className={styles.cardObs}>{p.observacoes}</div>}

      {/* Extratos por banco */}
      <div className={styles.cardSection}>
        <div className={styles.sectionLabel}>Extratos</div>
        {loadingEx ? (
          <div className={styles.cardLoading}>...</div>
        ) : total === 0 ? (
          <div className={styles.cardSemBancos}>
            Nenhum banco —{' '}
            <button className={styles.linkBtn} onClick={onGerenciarBancos}>adicionar</button>
          </div>
        ) : (
          <>
            <div className={styles.bancosList}>
              {extratos.map(e => (
                <div
                  key={e.contaId}
                  className={`${styles.bancoItem} ${e.recebido ? styles.recebido : ''}`}
                  onClick={() => !salvando[e.contaId] && toggleBanco(e.contaId, e.recebido)}
                >
                  <span className={styles.bancoNome}>{e.banco}</span>
                  <div className={styles.bancoDot} />
                </div>
              ))}
            </div>
            <div className={styles.bancosResumo}>{recebidos}/{total} recebidos</div>
          </>
        )}
      </div>

      {/* Contábil */}
      {ativo && total > 0 && (
        <div className={styles.cardSection}>
          <div className={styles.sectionLabel}>Contábil</div>
          {!todosOk ? (
            <div className={styles.contabilBloqueado}>
              🔒 Aguardando {faltam} extrato{faltam > 1 ? 's' : ''}
            </div>
          ) : (
            <button
              className={`${styles.contabilBtn} ${p.contabilFechado ? styles.contabilFeito : ''}`}
              onClick={onToggleContabil}
            >
              {p.contabilFechado ? '✓ Fechado — clique para reabrir' : '◯ Marcar como fechado'}
            </button>
          )}
        </div>
      )}

      {/* Rodapé */}
      <div className={styles.cardFooter}>
        <Btn size="sm" onClick={onGerenciarBancos}>Bancos</Btn>
        <Btn size="sm" onClick={onEditarEmpresa}>Editar</Btn>
      </div>
    </div>
  );
}

/* ─── Modal bancos ─── */
function ModalBancos({ empresa, onClose }) {
  const [contas, setContas]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ banco:'', agencia:'', conta:'', descricao:'', dataAbertura:'' });
  const [salvando, setSalvando] = useState(false);
  const [mostraForm, setMostraForm] = useState(false);

  const carregar = useCallback(() => {
    setLoading(true);
    api.get(`/contas/${empresa.empresaId}`)
      .then(r => setContas(r.data.contas || []))
      .catch(() => toast.error('Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [empresa.empresaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function adicionar(e) {
    e.preventDefault();
    if (!form.banco.trim()) { toast.error('Nome do banco é obrigatório'); return; }
    setSalvando(true);
    try {
      await api.post(`/contas/${empresa.empresaId}`, form);
      toast.success('Banco adicionado!');
      setForm({ banco:'', agencia:'', conta:'', descricao:'', dataAbertura:'' });
      setMostraForm(false); carregar();
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao adicionar'); }
    finally { setSalvando(false); }
  }

  async function desativar(id) {
    if (!confirm('Desativar esta conta?')) return;
    try { await api.patch(`/contas/${empresa.empresaId}/${id}/desativar`, { dataEncerramento: new Date() }); toast.success('Conta desativada'); carregar(); }
    catch { toast.error('Erro'); }
  }

  async function reativar(id) {
    try { await api.patch(`/contas/${empresa.empresaId}/${id}/reativar`); toast.success('Conta reativada'); carregar(); }
    catch { toast.error('Erro'); }
  }

  async function excluir(id) {
    if (!confirm('Excluir? Use apenas se cadastrou errado.')) return;
    try { await api.delete(`/contas/${empresa.empresaId}/${id}`); toast.success('Excluída'); carregar(); }
    catch { toast.error('Erro'); }
  }

  const ativas   = contas.filter(c => c.ativa);
  const inativas = contas.filter(c => !c.ativa);

  return (
    <Modal open onClose={onClose} title={`Bancos — ${empresa.nome}`}>
      <div style={{ padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:12 }}>
        {loading ? <div style={{ color:'var(--text-3)', fontSize:13 }}>Carregando...</div> : (
          <>
            {ativas.length === 0 && !mostraForm && (
              <div style={{ color:'var(--text-3)', fontSize:13, textAlign:'center', padding:'12px 0' }}>Nenhum banco cadastrado.</div>
            )}
            {ativas.map(c => (
              <div key={c._id} className={styles.contaItem}>
                <div className={styles.contaInfo}>
                  <span style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{c.banco}</span>
                  {(c.agencia || c.conta) && <span style={{ fontSize:11, color:'var(--text-2)' }}>{[c.agencia&&`Ag. ${c.agencia}`, c.conta&&`Cc. ${c.conta}`].filter(Boolean).join(' • ')}</span>}
                  {c.descricao && <span style={{ fontSize:11, color:'var(--text-3)' }}>{c.descricao}</span>}
                  {c.dataAbertura && <span style={{ fontSize:11, color:'var(--text-3)' }}>Aberta em {new Date(c.dataAbertura).toLocaleDateString('pt-BR')}</span>}
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <Btn size="sm" onClick={() => desativar(c._id)}>Desativar</Btn>
                  <Btn size="sm" variant="danger" onClick={() => excluir(c._id)}>Excluir</Btn>
                </div>
              </div>
            ))}
            {inativas.length > 0 && (
              <div>
                <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'8px 0 6px' }}>Inativas</div>
                {inativas.map(c => (
                  <div key={c._id} className={`${styles.contaItem} ${styles.contaInativa}`}>
                    <div className={styles.contaInfo}>
                      <span style={{ fontSize:13, color:'var(--text-2)' }}>{c.banco}</span>
                      {c.dataEncerramento && <span style={{ fontSize:11, color:'var(--text-3)' }}>Encerrada em {new Date(c.dataEncerramento).toLocaleDateString('pt-BR')}</span>}
                    </div>
                    <Btn size="sm" onClick={() => reativar(c._id)}>Reativar</Btn>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {mostraForm ? (
          <form onSubmit={adicionar} style={{ background:'var(--surface-2)', borderRadius:'var(--radius)', padding:14, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>Novo banco</div>
            <Input label="Banco *" placeholder="Ex: Bradesco, Itaú, Nubank..." value={form.banco} onChange={set('banco')} required />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Input label="Agência" placeholder="0000" value={form.agencia} onChange={set('agencia')} />
              <Input label="Conta" placeholder="00000-0" value={form.conta} onChange={set('conta')} />
            </div>
            <Input label="Descrição (opcional)" placeholder="Ex: Conta corrente PJ" value={form.descricao} onChange={set('descricao')} />
            <Input label="Data de abertura (opcional)" type="date" value={form.dataAbertura} onChange={set('dataAbertura')} />
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <Btn type="button" onClick={() => setMostraForm(false)}>Cancelar</Btn>
              <Btn variant="primary" loading={salvando} type="submit">Salvar banco</Btn>
            </div>
          </form>
        ) : (
          <Btn variant="primary" onClick={() => setMostraForm(true)}>+ Adicionar banco</Btn>
        )}

        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <Btn onClick={onClose}>Fechar</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Modal empresa ─── */
function ModalEmpresa({ open, empresa, onClose, onSaved }) {
  const [form, setForm] = useState({ nome:'', cnpj:'', frequencia:'mensal', observacoes:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresa) setForm({ nome:empresa.nome, cnpj:empresa.cnpj||'', frequencia:empresa.frequencia, observacoes:empresa.observacoes||'' });
    else setForm({ nome:'', cnpj:'', frequencia:'mensal', observacoes:'' });
  }, [empresa, open]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleCNPJ = e => setForm(f => ({ ...f, cnpj: mascaraCNPJ(e.target.value) }));

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setLoading(true);
    try {
      if (empresa) await api.put(`/empresas/${empresa.empresaId}`, form);
      else await api.post('/empresas', form);
      toast.success(empresa ? 'Empresa atualizada!' : 'Empresa adicionada!');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setLoading(false); }
  }

  async function remover() {
    if (!confirm(`Remover "${empresa.nome}"?`)) return;
    try { await api.delete(`/empresas/${empresa.empresaId}`); toast.success('Removida'); onSaved(); onClose(); }
    catch { toast.error('Erro ao remover'); }
  }

  return (
    <Modal open={open} onClose={onClose} title={empresa ? 'Editar empresa' : 'Nova empresa'}>
      <form onSubmit={salvar} style={{ padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        <Input label="Nome da empresa" placeholder="Razão social ou nome fantasia" value={form.nome} onChange={set('nome')} required />
        <Input label="CNPJ (opcional)" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={handleCNPJ} maxLength={18} inputMode="numeric" />
        <Select label="Frequência contábil" value={form.frequencia} onChange={set('frequencia')}>
          <option value="mensal">Mensal</option>
          <option value="trimestral">Trimestral</option>
        </Select>
        <Textarea label="Observações" placeholder="Ex: distribuição de lucro mensal..." value={form.observacoes} onChange={set('observacoes')} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
          {empresa && <Btn variant="danger" type="button" onClick={remover} style={{ marginRight:'auto' }}>Remover</Btn>}
          <Btn type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" loading={loading} type="submit">Salvar</Btn>
        </div>
      </form>
    </Modal>
  );
}
