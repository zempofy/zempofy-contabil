const mongoose = require('mongoose');

// Controla o recebimento de extrato por conta bancária + mês/ano
// Salva automaticamente ao marcar/desmarcar
const ExtratoRecebidoSchema = new mongoose.Schema({
  empresa:       { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true },
  escritorio:    { type: mongoose.Schema.Types.ObjectId, ref: 'Escritorio', required: true },
  contaBancaria: { type: mongoose.Schema.Types.ObjectId, ref: 'ContaBancaria', required: true },
  mes:           { type: Number, required: true, min: 1, max: 12 },
  ano:           { type: Number, required: true },
  recebido:      { type: Boolean, default: false },
  dataRecebimento: { type: Date, default: null },
  atualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
}, { timestamps: true });

ExtratoRecebidoSchema.index({ contaBancaria: 1, mes: 1, ano: 1 }, { unique: true });
ExtratoRecebidoSchema.index({ empresa: 1, mes: 1, ano: 1 });
ExtratoRecebidoSchema.index({ escritorio: 1, mes: 1, ano: 1 });

module.exports = mongoose.model('ExtratoRecebido', ExtratoRecebidoSchema);
