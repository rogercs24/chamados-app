const fs = require('fs');
const path = require('path');

const RESPOSTAS_FILE = path.join(__dirname, '../database/respostas.json');

function garantirArquivo() {
  if (!fs.existsSync(RESPOSTAS_FILE)) {
    fs.writeFileSync(RESPOSTAS_FILE, JSON.stringify({ respostas: [], proximoId: 1 }, null, 2));
  }
}

function ler() {
  garantirArquivo();
  return JSON.parse(fs.readFileSync(RESPOSTAS_FILE, 'utf-8'));
}

function salvar(dados) {
  fs.writeFileSync(RESPOSTAS_FILE, JSON.stringify(dados, null, 2));
}

const RespostaModel = {
  listarPorChamado(chamadoId) {
    const { respostas } = ler();
    return respostas
      .filter(r => r.chamadoId === Number(chamadoId))
      .sort((a, b) => a.id - b.id);
  },

  criar({ chamadoId, autorId, autorNome, autorPapel, texto, anexos }) {
    const dados = ler();
    const nova = {
      id: dados.proximoId,
      chamadoId: Number(chamadoId),
      autorId,
      autorNome,
      autorPapel,
      texto: texto || '',
      anexos: anexos || [],
      criado_em: new Date().toLocaleString('pt-BR')
    };

    dados.respostas.push(nova);
    dados.proximoId += 1;
    salvar(dados);

    return nova;
  }
};

module.exports = RespostaModel;
