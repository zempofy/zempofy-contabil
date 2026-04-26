const mongoose = require('mongoose');

const EmpresaSchema = new mongoose.Schema({
  escritorio: { type: mongoose.Schema.Types.ObjectId, ref: 'Escritorio', required: true, index: true },
  nome:       { type: String, required: true, trim: true },
  cnpj:       { type: String, trim: true, default: '' },
  frequencia: { type: String, enum: ['mensal', 'trimestral'], default: 'mensal' },
  observacoes:{ type: String, default: '' },
  ativa:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Empresa', EmpresaSchema);
