const express = require('express');
const router = express.Router();
const RespostaController = require('../controllers/respostaController');
const { autenticar, apenasAtendenteOuAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(autenticar);

router.get('/:id/respostas', RespostaController.listar);
router.post('/:id/respostas', apenasAtendenteOuAdmin, upload.array('arquivos', 5), RespostaController.criar);

module.exports = router;
