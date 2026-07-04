const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'chamados.json');

function garantirArquivo() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ chamados: [], proximoId: 1 }, null, 2));
  }
}

function ler() {
  garantirArquivo();
  const conteudo = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(conteudo);
}

function salvar(dados) {
  fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2));
}

module.exports = { ler, salvar };
