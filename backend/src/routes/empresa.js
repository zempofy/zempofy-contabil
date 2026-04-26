const router = require('express').Router();
const Empresa = require('../models/Empresa');
const Periodo = require('../models/Periodo');
const auth = require('../middleware/auth');

function escritorioId(req) { return req.usuario.escritorio; }

function semEscritorio(res) {
  return res.status(403).json({ error: 'Você precisa pertencer a um escritório' });
}

// GET /api/empresas
router.get('/', auth, async (req, res) => {
  try {
    if (!escritorioId(req)) return semEscritorio(res);
    const empresas = await Empresa.find({ escritorio: escritorioId(req), ativa: true })
      .sort({ nome: 1 });
    res.json({ empresas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/empresas
router.post('/', auth, async (req, res) => {
  try {
    if (!escritorioId(req)) return semEscritorio(res);
    const { nome, cnpj, frequencia, observacoes } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

    const empresa = await Empresa.create({
      escritorio: escritorioId(req),
      nome, cnpj, frequencia, observacoes,
    });
    res.status(201).json({ empresa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/empresas/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (!escritorioId(req)) return semEscritorio(res);
    const empresa = await Empresa.findOneAndUpdate(
      { _id: req.params.id, escritorio: escritorioId(req) },
      { $set: req.body },
      { new: true }
    );
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json({ empresa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/empresas/:id — soft delete
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!escritorioId(req)) return semEscritorio(res);
    const empresa = await Empresa.findOneAndUpdate(
      { _id: req.params.id, escritorio: escritorioId(req) },
      { ativa: false },
      { new: true }
    );
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
