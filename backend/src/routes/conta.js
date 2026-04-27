const router = require('express').Router();
const ContaBancaria = require('../models/ContaBancaria');
const auth = require('../middleware/auth');

function eid(req) { return req.usuario.escritorio; }
function semEsc(res) { return res.status(403).json({ error: 'Sem escritório' }); }

// GET /api/contas/:empresaId — listar contas de uma empresa
router.get('/:empresaId', auth, async (req, res) => {
  try {
    if (!eid(req)) return semEsc(res);
    const contas = await ContaBancaria.find({
      empresa: req.params.empresaId,
      escritorio: eid(req),
    }).sort({ banco: 1 });
    res.json({ contas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contas/:empresaId — adicionar conta
router.post('/:empresaId', auth, async (req, res) => {
  try {
    if (!eid(req)) return semEsc(res);
    const { banco, agencia, conta, descricao, dataAbertura } = req.body;
    if (!banco) return res.status(400).json({ error: 'Nome do banco é obrigatório' });

    const nova = await ContaBancaria.create({
      empresa: req.params.empresaId,
      escritorio: eid(req),
      banco, agencia, conta, descricao,
      dataAbertura: dataAbertura || null,
    });
    res.status(201).json({ conta: nova });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contas/:empresaId/:contaId — editar conta
router.put('/:empresaId/:contaId', auth, async (req, res) => {
  try {
    if (!eid(req)) return semEsc(res);
    const conta = await ContaBancaria.findOneAndUpdate(
      { _id: req.params.contaId, empresa: req.params.empresaId, escritorio: eid(req) },
      { $set: req.body },
      { new: true }
    );
    if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
    res.json({ conta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contas/:empresaId/:contaId/desativar — desativar conta
router.patch('/:empresaId/:contaId/desativar', auth, async (req, res) => {
  try {
    if (!eid(req)) return semEsc(res);
    const { dataEncerramento } = req.body;
    const conta = await ContaBancaria.findOneAndUpdate(
      { _id: req.params.contaId, empresa: req.params.empresaId, escritorio: eid(req) },
      { ativa: false, dataEncerramento: dataEncerramento || new Date() },
      { new: true }
    );
    if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
    res.json({ conta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contas/:empresaId/:contaId/reativar — reativar conta
router.patch('/:empresaId/:contaId/reativar', auth, async (req, res) => {
  try {
    if (!eid(req)) return semEsc(res);
    const conta = await ContaBancaria.findOneAndUpdate(
      { _id: req.params.contaId, empresa: req.params.empresaId, escritorio: eid(req) },
      { ativa: true, dataEncerramento: null },
      { new: true }
    );
    if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
    res.json({ conta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contas/:empresaId/:contaId — excluir conta (só se cadastrou errado)
router.delete('/:empresaId/:contaId', auth, async (req, res) => {
  try {
    if (!eid(req)) return semEsc(res);
    await ContaBancaria.findOneAndDelete({
      _id: req.params.contaId,
      empresa: req.params.empresaId,
      escritorio: eid(req),
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
