const router = require('express').Router();
const Periodo = require('../models/Periodo');
const Empresa = require('../models/Empresa');
const auth = require('../middleware/auth');

function escritorioId(req) { return req.usuario.escritorio; }

// GET /api/periodos?mes=4&ano=2026
// Retorna todos os períodos do escritório naquele mês/ano
// Empresas sem registro ainda vêm com valores padrão (false)
router.get('/', auth, async (req, res) => {
  try {
    if (!escritorioId(req)) return res.status(403).json({ error: 'Sem escritório' });

    const mes = parseInt(req.query.mes);
    const ano = parseInt(req.query.ano);
    if (!mes || !ano) return res.status(400).json({ error: 'mes e ano são obrigatórios' });

    // Busca todas as empresas ativas do escritório
    const empresas = await Empresa.find({ escritorio: escritorioId(req), ativa: true }).sort({ nome: 1 });

    // Busca os períodos já registrados
    const periodos = await Periodo.find({
      escritorio: escritorioId(req), mes, ano
    });

    // Mapeia: empresa → período (ou padrão)
    const mapa = {};
    periodos.forEach(p => { mapa[p.empresa.toString()] = p; });

    const resultado = empresas.map(e => {
      const p = mapa[e._id.toString()];
      return {
        empresaId: e._id,
        nome: e.nome,
        cnpj: e.cnpj,
        frequencia: e.frequencia,
        observacoes: e.observacoes,
        periodoId: p?._id || null,
        extratoRecebido: p?.extratoRecebido || false,
        contabilFechado: p?.contabilFechado || false,
        extratoDataRecebimento: p?.extratoDataRecebimento || null,
        contabilDataFechamento: p?.contabilDataFechamento || null,
      };
    });

    res.json({ periodos: resultado, mes, ano });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/periodos/:empresaId — atualiza ou cria o período de uma empresa
router.patch('/:empresaId', auth, async (req, res) => {
  try {
    if (!escritorioId(req)) return res.status(403).json({ error: 'Sem escritório' });

    const { mes, ano, extratoRecebido, contabilFechado } = req.body;
    if (!mes || !ano) return res.status(400).json({ error: 'mes e ano são obrigatórios' });

    // Verifica se a empresa pertence ao escritório
    const empresa = await Empresa.findOne({
      _id: req.params.empresaId,
      escritorio: escritorioId(req),
    });
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    const update = { atualizadoPor: req.usuario._id };

    if (typeof extratoRecebido === 'boolean') {
      update.extratoRecebido = extratoRecebido;
      update.extratoDataRecebimento = extratoRecebido ? new Date() : null;
      // Se tirar o extrato, remove o contábil também
      if (!extratoRecebido) {
        update.contabilFechado = false;
        update.contabilDataFechamento = null;
      }
    }

    if (typeof contabilFechado === 'boolean') {
      update.contabilFechado = contabilFechado;
      update.contabilDataFechamento = contabilFechado ? new Date() : null;
    }

    const periodo = await Periodo.findOneAndUpdate(
      { empresa: req.params.empresaId, mes, ano },
      { $set: { ...update, empresa: req.params.empresaId, escritorio: escritorioId(req), mes, ano } },
      { upsert: true, new: true }
    );

    res.json({ periodo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
