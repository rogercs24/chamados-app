const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const pastaChamado = path.join(UPLOADS_DIR, `chamado_${req.params.id}`);
    fs.mkdirSync(pastaChamado, { recursive: true });
    cb(null, pastaChamado);
  },
  filename(req, file, cb) {
    const timestamp = Date.now();
    const nomeSeguro = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${nomeSeguro}`);
  }
});

const TIPOS_PERMITIDOS = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip'
];

function filtroArquivo(req, file, cb) {
  if (TIPOS_PERMITIDOS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('tipo de arquivo não permitido'));
  }
}

const upload = multer({
  storage,
  fileFilter: filtroArquivo,
  limits: { fileSize: 15 * 1024 * 1024, files: 5 } // 15MB por arquivo, até 5 arquivos
});

module.exports = { upload, UPLOADS_DIR };
