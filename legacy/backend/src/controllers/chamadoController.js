const ChamadoModel = require('../models/chamadoModel');
const FaqConsultaService = require('../services/faqConsultaService');
const AREAS = require('../constants/areas');

function podeVer(chamado, usuario) {
  if (usuario.papel === 'admin') return true;
  if (usuario.papel === 'atendente') return chamado.area === usuario.area;
  return chamado.solicitanteId === usuario.id;
}

const ChamadoController = {
  listar(req, res) {
    const todos = ChamadoModel.listarTodos();
    const usuario = req.usuario;

    let chamados;
    if (usuario.papel === 'admin') {
      chamados = todos;
    } else if (usuario.papel === 'atendente') {
      chamados = todos.filter(c => c.area === usuario.area && c.status !== 'triagem');
    } else {
      chamados = todos.filter(c => c.solicitanteId === usuario.id);
    }

    res.json(chamados);
  },

  // Fila de triagem: só chamados aguardando triagem, só para o admin
  listarTriagem(req, res) {
    const todos = ChamadoModel.listarTodos();
    res.json(todos.filter(c => c.status === 'triagem'));
  },

  buscar(req, res) {
    const chamado = ChamadoModel.buscarPorId(req.params.id);
    if (!chamado) return res.status(404).json({ erro: 'Chamado não encontrado' });

    if (!podeVer(chamado, req.usuario)) {
      return res.status(403).json({ erro: 'você não tem acesso a este chamado' });
    }

    res.json(chamado);
  },

  criar(req, res) {
    const { titulo, descricao, faqToken } = req.body;

    if (!titulo || !descricao) {
      return res.status(400).json({ erro: 'titulo e descricao são obrigatórios' });
    }

    if (!faqToken) {
      return res.status(400).json({ erro: 'é necessário consultar o FAQ antes de abrir o chamado' });
    }

    const validacao = FaqConsultaService.validarEConsumir(faqToken, req.usuario.id);
    if (!validacao.valido) {
      return res.status(400).json({ erro: `consulta ao FAQ inválida ou expirada (${validacao.motivo}). Digite novamente o problema para gerar uma nova consulta.` });
    }

    const novoChamado = ChamadoModel.criar({
      titulo,
      descricao,
      solicitanteId: req.usuario.id,
      solicitante: req.usuario.nome
    });

    res.status(201).json(novoChamado);
  },

  // Admin define prioridade e área e encaminha o chamado (sai de 'triagem' -> 'aberto')
  triar(req, res) {
    const { prioridade, area } = req.body;
    const prioridadesValidas = ['baixa', 'media', 'alta', 'urgente'];

    if (!prioridadesValidas.includes(prioridade)) {
      return res.status(400).json({ erro: `prioridade deve ser uma de: ${prioridadesValidas.join(', ')}` });
    }
    if (!AREAS.includes(area)) {
      return res.status(400).json({ erro: `área deve ser uma de: ${AREAS.join(', ')}` });
    }

    const chamado = ChamadoModel.buscarPorId(req.params.id);
    if (!chamado) return res.status(404).json({ erro: 'Chamado não encontrado' });
    if (chamado.status !== 'triagem') {
      return res.status(400).json({ erro: 'este chamado já passou pela triagem' });
    }

    const atualizado = ChamadoModel.triar(req.params.id, { prioridade, area });
    res.json(atualizado);
  },

  atualizarStatus(req, res) {
    const { status } = req.body;
    const statusValidos = ['aberto', 'em_andamento', 'resolvido', 'fechado'];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: `status deve ser um dos: ${statusValidos.join(', ')}` });
    }

    const chamado = ChamadoModel.buscarPorId(req.params.id);
    if (!chamado) return res.status(404).json({ erro: 'Chamado não encontrado' });

    if (req.usuario.papel === 'atendente' && chamado.area !== req.usuario.area) {
      return res.status(403).json({ erro: 'este chamado não é da sua área' });
    }

    const atualizado = ChamadoModel.atualizarStatus(req.params.id, status);
    res.json(atualizado);
  },

  remover(req, res) {
    const chamado = ChamadoModel.buscarPorId(req.params.id);
    if (!chamado) return res.status(404).json({ erro: 'Chamado não encontrado' });

    ChamadoModel.remover(req.params.id);
    res.status(204).send();
  }
};

module.exports = ChamadoController;
