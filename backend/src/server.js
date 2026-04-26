require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes    = require('./routes/auth');
const escritorioRoutes = require('./routes/escritorio');
const empresaRoutes = require('./routes/empresa');
const periodoRoutes = require('./routes/periodo');

const app = express();

// CORS
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

// Rotas
app.use('/api/auth',       authRoutes);
app.use('/api/escritorio', escritorioRoutes);
app.use('/api/empresas',   empresaRoutes);
app.use('/api/periodos',   periodoRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }));

// Erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

// MongoDB + start
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
