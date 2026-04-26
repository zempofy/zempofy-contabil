const mongoose = require('mongoose');

const EscritorioSchema = new mongoose.Schema({
  nome:      { type: String, required: true, trim: true },
  slug:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  dono:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  membros:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  plano:     { type: String, enum: ['free', 'pro'], default: 'free' },
}, { timestamps: true });

module.exports = mongoose.model('Escritorio', EscritorioSchema);
