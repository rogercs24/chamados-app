const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../database/users.json');

function garantirArquivo() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ usuarios: [], proximoId: 1 }, null, 2));
  }
}

function ler() {
  garantirArquivo();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function salvar(dados) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(dados, null, 2));
}

const UserModel = {
  listarTodos() {
    return ler().usuarios;
  },

  existeAdmin() {
    return ler().usuarios.some(u => u.papel === 'admin');
  },

  atualizar(id, { papel, area }) {
    const dados = ler();
    const usuario = dados.usuarios.find(u => u.id === Number(id));
    if (!usuario) return null;

    usuario.papel = papel;
    usuario.area = area || null;
    salvar(dados);

    return usuario;
  },

  buscarPorEmail(email) {
    const { usuarios } = ler();
    return usuarios.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  },

  buscarPorId(id) {
    const { usuarios } = ler();
    return usuarios.find(u => u.id === Number(id));
  },

  criar({ nome, email, senhaHash, papel, area }) {
    const dados = ler();
    const novoUsuario = {
      id: dados.proximoId,
      nome,
      email,
      senhaHash,
      papel,
      area: area || null,
      criado_em: new Date().toLocaleString('pt-BR')
    };

    dados.usuarios.push(novoUsuario);
    dados.proximoId += 1;
    salvar(dados);

    return novoUsuario;
  }
};

module.exports = UserModel;
