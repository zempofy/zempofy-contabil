const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  nome:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  senha:      { type: String, required: true, minlength: 6 },
  escritorio: { type: mongoose.Schema.Types.ObjectId, ref: 'Escritorio', default: null },
  role:       { type: String, enum: ['admin', 'membro'], default: 'membro' },
}, { timestamps: true });

// Hash da senha antes de salvar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

UsuarioSchema.methods.compararSenha = function (senha) {
  return bcrypt.compare(senha, this.senha);
};

// Não retornar a senha no JSON
UsuarioSchema.set('toJSON', {
  transform: (_, obj) => { delete obj.senha; return obj; }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
