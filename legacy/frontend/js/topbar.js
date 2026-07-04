function linksPorPapel(papel, paginaAtual) {
  const item = (href, label, chave) =>
    `<a href="${href}" class="${paginaAtual === chave ? 'ativo' : ''}">${label}</a>`;

  if (papel === 'admin') {
    return [
      item('triagem.html', 'Triagem', 'triagem'),
      item('atendimento.html', 'Chamados', 'atendimento'),
      item('usuarios.html', 'Usuários', 'usuarios'),
      item('faq.html', 'FAQ', 'faq')
    ].join('');
  }

  if (papel === 'atendente') {
    return [
      item('atendimento.html', 'Meus Chamados', 'atendimento'),
      item('faq.html', 'FAQ', 'faq')
    ].join('');
  }

  // solicitante
  return [
    item('index.html', 'Início', 'inicio'),
    item('faq.html', 'FAQ', 'faq')
  ].join('');
}

function renderizarTopbar(paginaAtual) {
  const usuario = Auth.getUsuario();

  const container = document.getElementById('topbar-container');
  if (!container) return;

  const links = usuario ? linksPorPapel(usuario.papel, paginaAtual) : '';

  const nomesPapel = { admin: 'Administrador', atendente: 'Atendente', solicitante: 'Solicitante' };

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-brand">
        <img id="logo-empresa" src="assets/logo.png" alt="Logo da empresa"
             onerror="this.style.display='none'; document.getElementById('logo-fallback').style.display='inline';">
        <span id="logo-fallback" class="logo-texto" style="display:none;">Sinka</span>
        <h1>Central de Chamados</h1>
      </div>
      <nav class="topbar-nav">
        ${links}
        ${usuario ? `<span class="usuario-info">${usuario.nome} (${nomesPapel[usuario.papel] || usuario.papel}${usuario.area ? ' · ' + usuario.area : ''})</span>
        <button onclick="Auth.logout()">Sair</button>` : ''}
      </nav>
    </div>
  `;
}
