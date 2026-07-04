const ChamadoModel = require('../models/chamadoModel');
const RespostaModel = require('../models/respostaModel');

function podeVer(chamado, usuario) {
  if (usuario.papel === 'admin') return true;
  if (usuario.papel === 'atendente') return chamado.area === usuario.area;
  return chamado.solicitanteId === usuario.id;
}

const RespostaController = {
  listar(req, res) {
    const chamado = ChamadoModel.buscarPorId(req.params.id);
    if (!chamado) return res.status(404).json({ erro: 'Chamado não encontrado' });

    if (!podeVer(chamado, req.usuario)) {
      return res.status(403).json({ erro: 'você não tem acesso a este chamado' });
    }

    res.json(RespostaModel.listarPorChamado(req.params.id));
  },

  criar(req, res) {
    const chamado = ChamadoModel.buscarPorId(req.params.id);
    if (!chamado) return res.status(404).json({ erro: 'Chamado não encontrado' });

    if (req.usuario.papel === 'atendente' && chamado.area !== req.usuario.area) {
      return res.status(403).json({ erro: 'este chamado não é da sua área' });
    }

    const { texto } = req.body;
    const arquivos = req.files || [];

    if (!texto && arquivos.length === 0) {
      return res.status(400).json({ erro: 'informe um texto ou anexe ao menos um arquivo' });
    }

    const anexos = arquivos.map(f => ({
      nomeOriginal: f.originalname,
      caminho: `/uploads/chamado_${req.params.id}/${f.filename}`,
      tipo: f.mimetype
    }));

    const resposta = RespostaModel.criar({
      chamadoId: req.params.id,
      autorId: req.usuario.id,
      autorNome: req.usuario.nome,
      autorPapel: req.usuario.papel,
      texto,
      anexos
    });

    res.status(201).json(resposta);
  }
};

module.exports = RespostaController;
