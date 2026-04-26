const router = require('express').Router();
const Escritorio = require('../models/Escritorio');
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');

// POST /api/escritorio — criar novo escritório
router.post('/', auth, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome do escritório é obrigatório' });

    if (req.usuario.escritorio)
      return res.status(400).json({ error: 'Você já pertence a um escritório' });

    // Gera slug único a partir do nome
    let slug = nome.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existe = await Escritorio.findOne({ slug });
    if (existe) slug = `${slug}-${Date.now().toString(36)}`;

    const escritorio = await Escritorio.create({
      nome,
      slug,
      dono: req.usuario._id,
      membros: [req.usuario._id],
    });

    await Usuario.findByIdAndUpdate(req.usuario._id, {
      escritorio: escritorio._id,
      role: 'admin',
    });

    res.status(201).json({ escritorio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/escritorio/slug/:slug — buscar escritório pelo slug (para convite)
router.get('/slug/:slug', auth, async (req, res) => {
  try {
    const escritorio = await Escritorio.findOne({ slug: req.params.slug })
      .populate('dono', 'nome email')
      .populate('membros', 'nome email');
    if (!escritorio) return res.status(404).json({ error: 'Escritório não encontrado' });
    res.json({ escritorio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/escritorio/entrar — entrar em um escritório pelo slug
router.post('/entrar', auth, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: 'Slug é obrigatório' });

    if (req.usuario.escritorio)
      return res.status(400).json({ error: 'Você já pertence a um escritório' });

    const escritorio = await Escritorio.findOne({ slug });
    if (!escritorio) return res.status(404).json({ error: 'Escritório não encontrado' });

    if (escritorio.membros.includes(req.usuario._id))
      return res.status(400).json({ error: 'Você já é membro deste escritório' });

    escritorio.membros.push(req.usuario._id);
    await escritorio.save();

    await Usuario.findByIdAndUpdate(req.usuario._id, {
      escritorio: escritorio._id,
      role: 'membro',
    });

    res.json({ escritorio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/escritorio/meu — dados do escritório do usuário logado
router.get('/meu', auth, async (req, res) => {
  try {
    if (!req.usuario.escritorio)
      return res.status(404).json({ error: 'Usuário não pertence a nenhum escritório' });

    const escritorio = await Escritorio.findById(req.usuario.escritorio)
      .populate('membros', 'nome email role');
    res.json({ escritorio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
