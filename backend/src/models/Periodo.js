const mongoose = require('mongoose');

// Um documento por empresa/mês/ano
// Isso facilita consultas por período e histórico
const PeriodoSchema = new mongoose.Schema({
  empresa:    { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true },
  escritorio: { type: mongoose.Schema.Types.ObjectId, ref: 'Escritorio', required: true },
  mes:        { type: Number, required: true, min: 1, max: 12 },
  ano:        { type: Number, required: true },
  extratoRecebido:  { type: Boolean, default: false },
  contabilFechado:  { type: Boolean, default: false },
  extratoDataRecebimento: { type: Date, default: null },
  contabilDataFechamento: { type: Date, default: null },
  atualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
}, { timestamps: true });

// Índice único: uma empresa só pode ter um documento por mês/ano
PeriodoSchema.index({ empresa: 1, mes: 1, ano: 1 }, { unique: true });
// Índice para buscar todos os períodos de um escritório em um mês/ano
PeriodoSchema.index({ escritorio: 1, mes: 1, ano: 1 });

module.exports = mongoose.model('Periodo', PeriodoSchema);
