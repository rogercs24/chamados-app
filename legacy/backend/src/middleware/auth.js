const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-troque-isso';

function autenticar(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'token não fornecido' });
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'token inválido ou expirado' });
  }
}

function apenasAtendente(req, res, next) {
  if (req.usuario.papel !== 'atendente') {
    return res.status(403).json({ erro: 'ação restrita a atendentes' });
  }
  next();
}

function apenasAdmin(req, res, next) {
  if (req.usuario.papel !== 'admin') {
    return res.status(403).json({ erro: 'ação restrita ao administrador' });
  }
  next();
}

function apenasAtendenteOuAdmin(req, res, next) {
  if (req.usuario.papel !== 'atendente' && req.usuario.papel !== 'admin') {
    return res.status(403).json({ erro: 'ação restrita a quem atende chamados' });
  }
  next();
}

module.exports = { autenticar, apenasAtendente, apenasAdmin, apenasAtendenteOuAdmin };
