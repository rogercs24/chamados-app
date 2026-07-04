const crypto = require('crypto');

// Armazena tokens de consulta ao FAQ em memória: token -> { usuarioId, criadoEm, usado, termo }
const consultas = new Map();

const VALIDADE_MS = 30 * 60 * 1000; // 30 minutos

function limparExpirados() {
  const agora = Date.now();
  for (const [token, dados] of consultas.entries()) {
    if (agora - dados.criadoEm > VALIDADE_MS) {
      consultas.delete(token);
    }
  }
}

const FaqConsultaService = {
  registrar(usuarioId, termo) {
    limparExpirados();
    const token = crypto.randomBytes(24).toString('hex');
    consultas.set(token, {
      usuarioId,
      termo,
      criadoEm: Date.now(),
      usado: false
    });
    return token;
  },

  validarEConsumir(token, usuarioId) {
    limparExpirados();
    const dados = consultas.get(token);

    if (!dados) return { valido: false, motivo: 'token não encontrado ou expirado' };
    if (dados.usado) return { valido: false, motivo: 'token já utilizado' };
    if (dados.usuarioId !== usuarioId) return { valido: false, motivo: 'token não pertence a este usuário' };

    dados.usado = true;
    return { valido: true };
  }
};

module.exports = FaqConsultaService;
