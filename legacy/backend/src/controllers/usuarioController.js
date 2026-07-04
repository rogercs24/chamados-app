const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const AREAS = require('../constants/areas');

function sanitizar(usuario) {
  const { senhaHash, ...resto } = usuario;
  return resto;
}

const UsuarioController = {
  listar(req, res) {
    res.json(UserModel.listarTodos().map(sanitizar));
  },

  async criar(req, res) {
    const { nome, email, senha, papel, area } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'nome, email e senha são obrigatórios' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'a senha deve ter pelo menos 6 caracteres' });
    }

    const papeisValidos = ['solicitante', 'atendente', 'admin'];
    if (!papeisValidos.includes(papel)) {
      return res.status(400).json({ erro: `papel deve ser um de: ${papeisValidos.join(', ')}` });
    }

    let areaFinal = null;
    if (papel === 'atendente') {
      if (!area || !AREAS.includes(area)) {
        return res.status(400).json({ erro: `área inválida. Opções: ${AREAS.join(', ')}` });
      }
      areaFinal = area;
    }

    if (UserModel.buscarPorEmail(email)) {
      return res.status(409).json({ erro: 'já existe uma conta com esse e-mail' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = UserModel.criar({ nome, email, senhaHash, papel, area: areaFinal });
    res.status(201).json(sanitizar(usuario));
  },

  // Admin altera o papel (e área) de uma conta já existente
  atualizar(req, res) {
    const { papel, area } = req.body;
    const papeisValidos = ['solicitante', 'atendente', 'admin'];

    if (!papeisValidos.includes(papel)) {
      return res.status(400).json({ erro: `papel deve ser um de: ${papeisValidos.join(', ')}` });
    }

    let areaFinal = null;
    if (papel === 'atendente') {
      if (!area || !AREAS.includes(area)) {
        return res.status(400).json({ erro: `área inválida. Opções: ${AREAS.join(', ')}` });
      }
      areaFinal = area;
    }

    const alvo = UserModel.buscarPorId(req.params.id);
    if (!alvo) return res.status(404).json({ erro: 'usuário não encontrado' });

    // Evita remover o último administrador do sistema
    if (alvo.papel === 'admin' && papel !== 'admin') {
      const totalAdmins = UserModel.listarTodos().filter(u => u.papel === 'admin').length;
      if (totalAdmins <= 1) {
        return res.status(400).json({ erro: 'não é possível remover o único administrador do sistema' });
      }
    }

    const atualizado = UserModel.atualizar(req.params.id, { papel, area: areaFinal });
    res.json(sanitizar(atualizado));
  }
};

module.exports = UsuarioController;
