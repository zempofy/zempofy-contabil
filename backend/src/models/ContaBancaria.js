const mongoose = require('mongoose');

const ContaBancariaSchema = new mongoose.Schema({
  empresa:      { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  escritorio:   { type: mongoose.Schema.Types.ObjectId, ref: 'Escritorio', required: true },
  banco:        { type: String, required: true, trim: true },      // Ex: "Bradesco"
  agencia:      { type: String, trim: true, default: '' },
  conta:        { type: String, trim: true, default: '' },
  descricao:    { type: String, trim: true, default: '' },         // Ex: "Conta corrente PJ"
  ativa:        { type: Boolean, default: true },
  dataAbertura: { type: Date, default: null },
  dataEncerramento: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('ContaBancaria', ContaBancariaSchema);
