require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes       = require('./routes/auth');
const escritorioRoutes = require('./routes/escritorio');
const empresaRoutes    = require('./routes/empresa');
const periodoRoutes    = require('./routes/periodo');
const contaRoutes      = require('./routes/conta');
const extratoRoutes    = require('./routes/extrato');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/escritorio', escritorioRoutes);
app.use('/api/empresas',   empresaRoutes);
app.use('/api/periodos',   periodoRoutes);
app.use('/api/contas',     contaRoutes);
app.use('/api/extratos',   extratoRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  });
