# ADR-0002 — Comunicação em tempo real

- **Status:** Aceito
- **Data:** 2026-07-03

## Contexto

O edital exige ao menos um fluxo de atualização em tempo real entre backend e
frontend. Casos de uso: novo chamado aparecendo na fila de triagem, nova resposta
em um chamado aberto, progresso de importação de planilha e contadores do dashboard.

Opções: **WebSocket puro**, **Server-Sent Events (SSE)** ou **Socket.IO**.

## Decisão

**Socket.IO** via **NestJS WebSocket Gateway**, com **`@socket.io/redis-adapter`**.

## Justificativa

- **Bidirecional e com rooms:** dá para segmentar por `tenant:{id}` e `ticket:{id}`,
  entregando eventos só a quem deve recebê-los (reforça o isolamento multi-tenant).
- **Autenticação no handshake:** valida o JWT antes de entrar nas rooms.
- **Reconexão e fallback automáticos:** resiliência de rede sem código extra.
- **Escala horizontal:** o Redis adapter propaga eventos entre instâncias — e o
  Redis já é infraestrutura obrigatória do projeto, então não adiciona dependência.
- SSE seria mais simples, mas é unidirecional e sem rooms nativas; WebSocket puro
  exigiria reimplementar handshake auth, rooms e reconexão manualmente.

## Consequências

- ➕ Um único mecanismo cobre todos os fluxos em tempo real do produto.
- ➖ Overhead de protocolo maior que SSE — irrelevante na escala deste produto.
