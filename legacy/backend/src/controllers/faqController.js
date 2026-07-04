const FaqConsultaService = require('../services/faqConsultaService');

const FaqController = {
  registrarConsulta(req, res) {
    const { termo } = req.body;

    if (!termo || termo.trim().length < 3) {
      return res.status(400).json({ erro: 'informe um termo de busca com pelo menos 3 caracteres' });
    }

    const token = FaqConsultaService.registrar(req.usuario.id, termo.trim());
    res.status(201).json({ faqToken: token });
  }
};

module.exports = FaqController;
