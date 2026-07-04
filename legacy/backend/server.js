const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const chamadoRoutes = require('./src/routes/chamadoRoutes');
const authRoutes = require('./src/routes/authRoutes');
const faqRoutes = require('./src/routes/faqRoutes');
const respostaRoutes = require('./src/routes/respostaRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/chamados', chamadoRoutes);
app.use('/api/chamados', respostaRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
