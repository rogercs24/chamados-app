const express = require('express');
const router = express.Router();
const ChamadoController = require('../controllers/chamadoController');
const { autenticar, apenasAdmin, apenasAtendenteOuAdmin } = require('../middleware/auth');

router.use(autenticar);

router.get('/', ChamadoController.listar);
router.get('/triagem', apenasAdmin, ChamadoController.listarTriagem);
router.get('/:id', ChamadoController.buscar);
router.post('/', ChamadoController.criar);
router.patch('/:id/triagem', apenasAdmin, ChamadoController.triar);
router.patch('/:id/status', apenasAtendenteOuAdmin, ChamadoController.atualizarStatus);
router.delete('/:id', apenasAdmin, ChamadoController.remover);

module.exports = router;
