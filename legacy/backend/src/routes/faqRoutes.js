const express = require('express');
const router = express.Router();
const FaqController = require('../controllers/faqController');
const { autenticar } = require('../middleware/auth');

router.post('/consultar', autenticar, FaqController.registrarConsulta);

module.exports = router;
