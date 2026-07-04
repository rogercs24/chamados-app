const API_BASE = 'http://localhost:3000/api';

const Auth = {
  salvarSessao(token, usuario) {
    localStorage.setItem('chamados_token', token);
    localStorage.setItem('chamados_usuario', JSON.stringify(usuario));
  },

  getToken() {
    return localStorage.getItem('chamados_token');
  },

  getUsuario() {
    const raw = localStorage.getItem('chamados_usuario');
    return raw ? JSON.parse(raw) : null;
  },

  estaLogado() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('chamados_token');
    localStorage.removeItem('chamados_usuario');
    window.location.href = 'login.html';
  },

  // Redireciona para o login se não houver sessão. Chame no topo de páginas protegidas.
  exigirLogin() {
    if (!this.estaLogado()) {
      window.location.href = 'login.html';
    }
  },

  // Wrapper de fetch que injeta o token automaticamente e trata 401
  async fetchAutenticado(url, opcoes = {}) {
    const token = this.getToken();
    const headers = {
      ...(opcoes.headers || {}),
      Authorization: `Bearer ${token}`
    };

    const resposta = await fetch(url, { ...opcoes, headers });

    if (resposta.status === 401) {
      this.logout();
      throw new Error('Sessão expirada');
    }

    return resposta;
  }
};
