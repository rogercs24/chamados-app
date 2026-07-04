const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const { autenticar, apenasAdmin } = require('../middleware/auth');

router.use(autenticar, apenasAdmin);

router.get('/', UsuarioController.listar);
router.post('/', UsuarioController.criar);
router.patch('/:id', UsuarioController.atualizar);

module.exports = router;
