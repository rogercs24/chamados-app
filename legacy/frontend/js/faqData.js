const FAQ_DATA = [
  {
    categoria: 'Acesso ao sistema',
    pergunta: 'Como acesso o sistema Sinka como transportador?',
    resposta: 'Acesse app.sinkalogistica.com.br, informe o login e a senha de primeiro acesso (fornecidos pela Sinka após o treinamento) e clique em Entrar.'
  },
  {
    categoria: 'Acesso ao sistema',
    pergunta: 'Como acesso o sistema Sinka como Trade?',
    resposta: 'Acesse app.sinkalogistica.com.br/trade/auth/login, informe login e senha (fornecidos pela Sinka após o treinamento) e clique em Login.'
  },
  {
    categoria: 'Acesso ao sistema',
    pergunta: 'Recebi um login e senha de primeiro acesso. O que faço?',
    resposta: 'Use-os para entrar no sistema pelo link do seu perfil (transportador ou Trade). Ao logar pela primeira vez, confira e valide seus dados cadastrais antes de iniciar os processos.'
  },
  {
    categoria: 'Acesso ao sistema',
    pergunta: 'Onde encontro as funcionalidades do sistema?',
    resposta: 'No MENU, no canto superior/lateral esquerdo da tela. Por ele você acessa Embarques, Planejamento de Carregamentos, Leilões de Frete, Faturamento de Notas, Acompanhamento de Trânsito e Pagamento de Fretes.'
  },
  {
    categoria: 'Embarcador / Trade — Embarques',
    pergunta: 'Como crio um embarque?',
    resposta: 'No MENU, clique em Embarques e em Adicionar. Preencha todos os campos até o final da página, clique em Gerar Programação de Carregamento, confira as informações e clique em Confirmar (botão verde no canto direito).'
  },
  {
    categoria: 'Embarcador / Trade — Embarques',
    pergunta: 'Como edito ou visualizo um embarque já criado?',
    resposta: 'Na lista de embarques, clique nos três pontinhos no lado direito do embarque e escolha Visualizar ou Editar.'
  },
  {
    categoria: 'Embarcador / Trade — Leilão de Frete',
    pergunta: 'Como crio um leilão de frete?',
    resposta: 'Com o embarque criado, acesse MENU > Leilões de Frete e clique em Adicionar. Preencha todas as informações, escolha a modalidade do leilão, defina a quantidade de lances e as datas de início e fim, e clique em Confirmar.'
  },
  {
    categoria: 'Embarcador / Trade — Leilão de Frete',
    pergunta: 'Quais são as modalidades de leilão disponíveis?',
    resposta: 'São três: Busca Frete de Mercado, Frete Estabelecido e Leilão Decrescente. Escolha a modalidade ao criar o leilão.'
  },
  {
    categoria: 'Embarcador / Trade — Leilão de Frete',
    pergunta: 'Como os transportadores são avisados do leilão?',
    resposta: 'O convite para participar do leilão é enviado automaticamente por e-mail aos transportadores.'
  },
  {
    categoria: 'Embarcador / Trade — Leilão de Frete',
    pergunta: 'Como aceito uma oferta (BID) de um transportador?',
    resposta: 'Acesse MENU > Leilões de Frete, clique nos três pontinhos do leilão e em Visualizar. Na aba BIDS, clique em Aceitar BID, preencha as informações solicitadas e clique em Confirmar. Em seguida, se necessário, você pode baixar o credenciamento.'
  },
  {
    categoria: 'Transportador — Leilão e Lance (BID)',
    pergunta: 'Como participo de um leilão de frete?',
    resposta: 'Você recebe por e-mail (o e-mail informado no cadastro) o convite com as informações do leilão. Abra a mensagem e clique em Participar do Leilão.'
  },
  {
    categoria: 'Transportador — Leilão e Lance (BID)',
    pergunta: 'Como dou um lance no leilão (criar BID)?',
    resposta: 'Dentro do leilão, clique em Criar BID, informe o valor de frete proposto e a cadência indicada na mensagem, clique em Confirmar e confirme novamente na tela seguinte.'
  },
  {
    categoria: 'Transportador — Leilão e Lance (BID)',
    pergunta: 'Quantos lances posso dar em cada leilão?',
    resposta: '1 lance ou mais, depende do que o cliente inseriu no Sinka. Por isso, confira bem o valor antes de confirmar.'
  },
  {
    categoria: 'Transportador — Leilão e Lance (BID)',
    pergunta: 'Onde vejo os valores de frete do leilão?',
    resposta: 'As informações de valores de frete e a cadência ficam descritas na mensagem/e-mail do convite do leilão e na aba Leilões de Frete dentro do seu acesso Sinka.'
  },
  {
    categoria: 'Transportador — Credenciamento',
    pergunta: 'Ganhei o leilão. Como faço o credenciamento?',
    resposta: '1) Ao vencer, você recebe o credenciamento por e-mail. No final da mensagem, clique em Realizar o Credenciamento e depois em Aceitar (ou Recusar, se for o caso). 2) Você também pode aceitar pelo seu acesso Sinka, na aba Credenciamento de Fretes.'
  },
  {
    categoria: 'Transportador — Credenciamento',
    pergunta: 'Onde vejo meu contrato após o credenciamento?',
    resposta: 'Após aceitar o credenciamento, o contrato fica disponível para visualização logo abaixo da confirmação de credenciamento.'
  },
  {
    categoria: 'Transportador — Credenciamento',
    pergunta: 'Concluí o credenciamento. Qual é o próximo passo?',
    resposta: 'Agendar seu veículo na aba Planejamento de Carregamentos.'
  },
  {
    categoria: 'Operação — Agendamento e Ordem de Carregamento',
    pergunta: 'Como agendo um carregamento (caminhão)?',
    resposta: 'Na aba Planejamento de Carregamentos, abra no calendário a data desejada, clique nos três pontos (canto inferior direito) e em Visualizar. Depois clique em Agendar Carregamento, preencha os campos obrigatórios (marcados em vermelho) e clique em Confirmar.'
  },
  {
    categoria: 'Operação — Agendamento e Ordem de Carregamento',
    pergunta: 'Como faço upload de uma Ordem de Carregamento do Sinka (OC)?',
    resposta: 'Na aba Faturamento de Notas, clique em Ordem de Carregamento, no canto superior direito da tela.'
  },
  {
    categoria: 'Operação — Agendamento e Ordem de Carregamento',
    pergunta: 'Quais documentos anexo após o veículo carregar?',
    resposta: 'Adicione a NF-e de origem em PDF e XML, o laudo e o ticket. Esses documentos são necessários para seguir com a troca de notas.'
  },
  {
    categoria: 'Operação — Troca de Notas e Documentos',
    pergunta: 'Como anexo os documentos de carregamento?',
    resposta: "Na aba Faturamento de Notas, clique nos três pontos e em Visualizar. Clique na seta no lado direito e anexe o documento. Ao concluir, aparece a mensagem 'Documento enviado com sucesso'."
  },
  {
    categoria: 'Operação — Troca de Notas e Documentos',
    pergunta: 'Como solicito a troca de notas?',
    resposta: 'Na aba Faturamento de Notas, após anexar todos os documentos pertinentes (NF-e de origem em PDF e XML, laudo e ticket), o sistema atualiza o status para aguardando troca de notas. Depois de trocada, a nota fica pronta para upload na aba Acompanhamento de Trânsito.'
  },
  {
    categoria: 'Operação — Troca de Notas e Documentos',
    pergunta: 'Onde acompanho a troca de notas e o trânsito?',
    resposta: 'Na aba Acompanhamento de Trânsito.'
  },
  {
    categoria: 'Faturamento de Notas (Trade)',
    pergunta: 'Como faço o faturamento de notas?',
    resposta: 'Acesse app.sinkalogistica.com.br com seu usuário e senha, vá em MENU > Faturamento de Notas e clique na placa que deseja faturar. Faça o upload dos documentos pertinentes (seta para cima), clique no botão verde Realizar Faturamento de Notas e, na tela de confirmação, clique em Confirmar.'
  },
  {
    categoria: 'CT-e, comprovante de descarga e pagamento',
    pergunta: 'Como anexo o CT-e?',
    resposta: 'Na aba Acompanhamento de Trânsito, adicione o CT-e em PDF e em XML.'
  },
  {
    categoria: 'CT-e, comprovante de descarga e pagamento',
    pergunta: 'Como anexo o comprovante de descarga?',
    resposta: 'Na aba Acompanhamento de Trânsito, informe a quantidade descarregada em toneladas usando vírgula (exemplo: 37,00), informe a data de descarga e anexe o comprovante de descarga.'
  },
  {
    categoria: 'CT-e, comprovante de descarga e pagamento',
    pergunta: 'Como solicito o pagamento do frete?',
    resposta: 'Na aba Acompanhamento de Trânsito, clique em Solicitar Pagamento de Carregamento, confira os campos (frete, valor a ser solicitado, etc.) e clique em Confirmar.'
  },
  {
    categoria: 'CT-e, comprovante de descarga e pagamento',
    pergunta: 'O que preciso ter anexado para solicitar o pagamento?',
    resposta: 'Todos os anexos pertinentes à transportadora precisam estar anexados, incluindo o CT-e (PDF e XML) e o comprovante de descarga. Sem eles, o pagamento não pode ser solicitado.'
  },
  {
    categoria: 'CT-e, comprovante de descarga e pagamento',
    pergunta: 'Como acompanho o status do pagamento?',
    resposta: 'Na aba Pagamento de Fretes, confira o status e a data de pagamento.'
  }
];

// Busca simples por palavras-chave no título/pergunta e na resposta
function buscarFaq(termo) {
  if (!termo || termo.trim().length < 3) return [];

  const palavras = termo.toLowerCase().trim().split(/\s+/).filter(p => p.length > 2);
  if (!palavras.length) return [];

  return FAQ_DATA
    .map(item => {
      const textoBusca = (item.pergunta + ' ' + item.resposta).toLowerCase();
      const pontos = palavras.reduce((soma, p) => soma + (textoBusca.includes(p) ? 1 : 0), 0);
      return { ...item, pontos };
    })
    .filter(item => item.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 3);
}
