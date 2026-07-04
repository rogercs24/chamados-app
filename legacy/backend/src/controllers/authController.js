const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const AREAS = require('../constants/areas');

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-troque-isso';

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, papel: usuario.papel, area: usuario.area || null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizar(usuario) {
  const { senhaHash, ...resto } = usuario;
  return resto;
}

const AuthController = {
  async registrar(req, res) {
    const { nome, email, senha, papel, area } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'nome, email e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: 'a senha deve ter pelo menos 6 caracteres' });
    }

    const papeisValidos = ['solicitante', 'atendente', 'admin'];
    const papelFinal = papeisValidos.includes(papel) ? papel : 'solicitante';

    let areaFinal = null;

    if (papelFinal === 'atendente') {
      if (!area || !AREAS.includes(area)) {
        return res.status(400).json({ erro: `área inválida. Opções: ${AREAS.join(', ')}` });
      }
      areaFinal = area;
    }

    if (papelFinal === 'admin' && UserModel.existeAdmin()) {
      return res.status(403).json({
        erro: 'já existe um administrador cadastrado neste sistema. Peça para um admin te promover no painel de Usuários (depois de logado).'
      });
    }

    const existente = UserModel.buscarPorEmail(email);
    if (existente) {
      return res.status(409).json({ erro: 'já existe uma conta com esse e-mail' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = UserModel.criar({ nome, email, senhaHash, papel: papelFinal, area: areaFinal });
    const token = gerarToken(usuario);

    res.status(201).json({ token, usuario: sanitizar(usuario) });
  },

  async login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'email e senha são obrigatórios' });
    }

    const usuario = UserModel.buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ erro: 'e-mail ou senha inválidos' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'e-mail ou senha inválidos' });
    }

    const token = gerarToken(usuario);
    res.json({ token, usuario: sanitizar(usuario) });
  },

  eu(req, res) {
    const usuario = UserModel.buscarPorId(req.usuario.id);
    if (!usuario) return res.status(404).json({ erro: 'usuário não encontrado' });
    res.json(sanitizar(usuario));
  }
};

module.exports = AuthController;
