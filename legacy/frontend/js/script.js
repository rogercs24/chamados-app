const API_URL = `${API_BASE}/chamados`;
const FAQ_URL = `${API_BASE}/faq/consultar`;

const form = document.getElementById('form-chamado');
const listaEl = document.getElementById('lista-chamados');
const btnAtualizar = document.getElementById('btn-atualizar');
const tituloEl = document.getElementById('titulo');
const descricaoEl = document.getElementById('descricao');
const confirmarFaqEl = document.getElementById('confirmar-faq');
const btnAbrirChamado = document.getElementById('btn-abrir-chamado');
const sugestoesFaqEl = document.getElementById('sugestoes-faq');
const sugestoesFaqListaEl = document.getElementById('sugestoes-faq-lista');
const statusFaqEl = document.getElementById('status-consulta-faq');

let faqToken = null;
let debounceTimer = null;

const LABELS_STATUS = {
  triagem: 'Aguardando triagem',
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
  fechado: 'Fechado'
};

function atualizarSugestoesFaq() {
  const termo = `${tituloEl.value} ${descricaoEl.value}`;
  const resultados = buscarFaq(termo);

  if (!resultados.length) {
    sugestoesFaqEl.style.display = 'none';
    sugestoesFaqListaEl.innerHTML = '';
    return;
  }

  sugestoesFaqEl.style.display = 'block';
  sugestoesFaqListaEl.innerHTML = resultados.map(item => `
    <details class="faq-item">
      <summary>${escapeHtml(item.pergunta)}</summary>
      <p>${escapeHtml(item.resposta)}</p>
    </details>
  `).join('');
}

async function registrarConsultaFaq() {
  const termo = `${tituloEl.value} ${descricaoEl.value}`.trim();

  if (termo.length < 5) {
    faqToken = null;
    statusFaqEl.textContent = '';
    atualizarBotaoEnvio();
    return;
  }

  try {
    const res = await Auth.fetchAutenticado(FAQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termo })
    });

    if (!res.ok) throw new Error('falha ao registrar consulta');

    const dados = await res.json();
    faqToken = dados.faqToken;
    statusFaqEl.textContent = '✓ Consulta ao FAQ registrada';
    statusFaqEl.classList.add('status-ok');
  } catch (err) {
    faqToken = null;
    statusFaqEl.textContent = '';
  }

  atualizarBotaoEnvio();
}

function agendarConsultaFaq() {
  faqToken = null;
  statusFaqEl.textContent = '';
  statusFaqEl.classList.remove('status-ok');
  atualizarBotaoEnvio();

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(registrarConsultaFaq, 700);
}

function atualizarBotaoEnvio() {
  btnAbrirChamado.disabled = !(confirmarFaqEl.checked && faqToken);
}

tituloEl.addEventListener('input', () => {
  atualizarSugestoesFaq();
  agendarConsultaFaq();
});
descricaoEl.addEventListener('input', () => {
  atualizarSugestoesFaq();
  agendarConsultaFaq();
});
confirmarFaqEl.addEventListener('change', atualizarBotaoEnvio);

async function carregarChamados() {
  listaEl.innerHTML = '<p class="vazio">Carregando chamados...</p>';
  try {
    const res = await Auth.fetchAutenticado(API_URL);
    const chamados = await res.json();
    renderizarChamados(chamados);
  } catch (err) {
    listaEl.innerHTML = '<p class="vazio">Erro ao carregar chamados. O servidor está rodando?</p>';
  }
}

function renderizarChamados(chamados) {
  if (!chamados.length) {
    listaEl.innerHTML = '<p class="vazio">Você ainda não abriu nenhum chamado.</p>';
    return;
  }

  listaEl.innerHTML = chamados.map(chamado => `
    <a class="chamado" href="chamado.html?id=${chamado.id}">
      <div class="chamado-info">
        <h3>${escapeHtml(chamado.titulo)}</h3>
        <p>${escapeHtml(chamado.descricao)}</p>
        <p><strong>Aberto em:</strong> ${chamado.criado_em}</p>
        <div class="tags">
          ${chamado.prioridade ? `<span class="tag prioridade-${chamado.prioridade}">${chamado.prioridade}</span>` : ''}
          ${chamado.area ? `<span class="tag area">${escapeHtml(chamado.area)}</span>` : ''}
          <span class="tag status-${chamado.status}">${LABELS_STATUS[chamado.status] || chamado.status}</span>
        </div>
      </div>
    </a>
  `).join('');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!confirmarFaqEl.checked) {
    alert('Confirme que você já consultou o FAQ antes de abrir o chamado.');
    return;
  }

  if (!faqToken) {
    alert('Não identificamos uma consulta recente ao FAQ. Digite novamente o título/descrição e aguarde a confirmação antes de enviar.');
    return;
  }

  const dados = {
    titulo: document.getElementById('titulo').value,
    descricao: document.getElementById('descricao').value,
    faqToken
  };

  try {
    const res = await Auth.fetchAutenticado(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      alert(erro.erro || 'Falha ao criar chamado');
      return;
    }

    form.reset();
    faqToken = null;
    statusFaqEl.textContent = '';
    statusFaqEl.classList.remove('status-ok');
    atualizarBotaoEnvio();
    sugestoesFaqEl.style.display = 'none';
    carregarChamados();
  } catch (err) {
    alert('Erro ao abrir chamado. Verifique se o servidor está rodando.');
  }
});

btnAtualizar.addEventListener('click', carregarChamados);

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

carregarChamados();
