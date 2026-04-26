const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');

function gerarToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha)
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    if (senha.length < 6)
      return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });

    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(409).json({ error: 'E-mail já cadastrado' });

    const usuario = await Usuario.create({ nome, email, senha });
    const token = gerarToken(usuario._id);

    res.status(201).json({ token, usuario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

    const usuario = await Usuario.findOne({ email }).populate('escritorio');
    if (!usuario) return res.status(401).json({ error: 'E-mail ou senha incorretos' });

    const ok = await usuario.compararSenha(senha);
    if (!ok) return res.status(401).json({ error: 'E-mail ou senha incorretos' });

    const token = gerarToken(usuario._id);
    res.json({ token, usuario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — retorna usuário logado
router.get('/me', auth, async (req, res) => {
  const usuario = await Usuario.findById(req.usuario._id).populate('escritorio');
  res.json({ usuario });
});

module.exports = router;
