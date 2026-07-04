const { ler, salvar } = require('../database/db');

function agora() {
  return new Date().toLocaleString('pt-BR');
}

const ChamadoModel = {
  listarTodos() {
    const { chamados } = ler();
    return chamados.sort((a, b) => b.id - a.id);
  },

  buscarPorId(id) {
    const { chamados } = ler();
    return chamados.find(c => c.id === Number(id));
  },

  criar({ titulo, descricao, solicitante, solicitanteId }) {
    const dados = ler();
    const novoChamado = {
      id: dados.proximoId,
      titulo,
      descricao,
      solicitante,
      solicitanteId,
      prioridade: null,
      area: null,
      status: 'triagem',
      criado_em: agora(),
      atualizado_em: agora()
    };

    dados.chamados.push(novoChamado);
    dados.proximoId += 1;
    salvar(dados);

    return novoChamado;
  },

  // Ação de triagem: admin define prioridade e área, e o chamado passa a 'aberto'
  triar(id, { prioridade, area }) {
    const dados = ler();
    const chamado = dados.chamados.find(c => c.id === Number(id));
    if (!chamado) return null;

    chamado.prioridade = prioridade;
    chamado.area = area;
    chamado.status = 'aberto';
    chamado.atualizado_em = agora();
    salvar(dados);

    return chamado;
  },

  atualizarStatus(id, status) {
    const dados = ler();
    const chamado = dados.chamados.find(c => c.id === Number(id));
    if (!chamado) return null;

    chamado.status = status;
    chamado.atualizado_em = agora();
    salvar(dados);

    return chamado;
  },

  remover(id) {
    const dados = ler();
    const tamanhoAntes = dados.chamados.length;
    dados.chamados = dados.chamados.filter(c => c.id !== Number(id));
    salvar(dados);

    return { removido: dados.chamados.length < tamanhoAntes };
  }
};

module.exports = ChamadoModel;
