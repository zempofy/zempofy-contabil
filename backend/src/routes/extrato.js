const router = require('express').Router();
const ExtratoRecebido = require('../models/ExtratoRecebido');
const ContaBancaria   = require('../models/ContaBancaria');
const Periodo         = require('../models/Periodo');
const Empresa         = require('../models/Empresa');
const auth            = require('../middleware/auth');

function eid(req) { return req.usuario.escritorio; }

// GET /api/extratos/:empresaId?mes=4&ano=2026
// Retorna todas as contas ativas da empresa com status de extrato no período
router.get('/:empresaId', auth, async (req, res) => {
  try {
    if (!eid(req)) return res.status(403).json({ error: 'Sem escritório' });
    const { mes, ano } = req.query;
    if (!mes || !ano) return res.status(400).json({ error: 'mes e ano obrigatórios' });

    // Busca contas ativas
    const contas = await ContaBancaria.find({
      empresa: req.params.empresaId,
      escritorio: eid(req),
      ativa: true,
    }).sort({ banco: 1 });

    // Busca extratos já registrados
    const extratos = await ExtratoRecebido.find({
      empresa: req.params.empresaId,
      mes: parseInt(mes),
      ano: parseInt(ano),
    });

    const mapaExtratos = {};
    extratos.forEach(e => { mapaExtratos[e.contaBancaria.toString()] = e; });

    const resultado = contas.map(c => ({
      contaId:   c._id,
      banco:     c.banco,
      agencia:   c.agencia,
      conta:     c.conta,
      descricao: c.descricao,
      recebido:  mapaExtratos[c._id.toString()]?.recebido || false,
      dataRecebimento: mapaExtratos[c._id.toString()]?.dataRecebimento || null,
    }));

    res.json({ extratos: resultado, total: contas.length, recebidos: resultado.filter(r => r.recebido).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/extratos/:empresaId/:contaId — marcar/desmarcar extrato (salvamento automático)
router.patch('/:empresaId/:contaId', auth, async (req, res) => {
  try {
    if (!eid(req)) return res.status(403).json({ error: 'Sem escritório' });
    const { mes, ano, recebido } = req.body;
    if (!mes || !ano) return res.status(400).json({ error: 'mes e ano obrigatórios' });

    const extrato = await ExtratoRecebido.findOneAndUpdate(
      { contaBancaria: req.params.contaId, empresa: req.params.empresaId, mes, ano },
      {
        $set: {
          contaBancaria: req.params.contaId,
          empresa: req.params.empresaId,
          escritorio: eid(req),
          mes, ano,
          recebido,
          dataRecebimento: recebido ? new Date() : null,
          atualizadoPor: req.usuario._id,
        }
      },
      { upsert: true, new: true }
    );

    // Verifica se TODOS os bancos ativos da empresa têm extrato recebido
    const totalContas = await ContaBancaria.countDocuments({
      empresa: req.params.empresaId,
      escritorio: eid(req),
      ativa: true,
    });

    const totalRecebidos = await ExtratoRecebido.countDocuments({
      empresa: req.params.empresaId,
      mes, ano,
      recebido: true,
    });

    const todosRecebidos = totalContas > 0 && totalRecebidos >= totalContas;

    // Atualiza o período geral (extratoRecebido = todos os bancos recebidos)
    await Periodo.findOneAndUpdate(
      { empresa: req.params.empresaId, mes, ano },
      {
        $set: {
          empresa: req.params.empresaId,
          escritorio: eid(req),
          mes, ano,
          extratoRecebido: todosRecebidos,
          // Se perdeu algum extrato, remove o fechamento contábil
          ...((!todosRecebidos) && { contabilFechado: false, contabilDataFechamento: null }),
          extratoDataRecebimento: todosRecebidos ? new Date() : null,
        }
      },
      { upsert: true, new: true }
    );

    res.json({ extrato, todosRecebidos, totalContas, totalRecebidos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
