# ADR-0003 — Processamento assíncrono

- **Status:** Aceito
- **Data:** 2026-07-03

## Contexto

O edital exige ao menos uma funcionalidade assíncrona (ex.: importação de
planilhas, geração de relatórios). Importar um CSV/XLSX grande ou gerar um
relatório não pode bloquear a requisição HTTP nem estourar timeout.

## Decisão

**BullMQ** (filas sobre Redis), com um **worker NestJS em processo separado**.

## Justificativa

- **Redis já é obrigatório** no projeto — BullMQ reaproveita a mesma infra.
- **Confiável:** retries, backoff, jobs atrasados, concorrência controlada e
  persistência do estado do job.
- **Progresso observável:** o job atualiza `ImportJob` no banco e emite eventos
  via Socket.IO (ADR-0002) — o usuário acompanha o progresso em tempo real.
- Alternativas (cron caseiro, `setImmediate`, fila em tabela) não dão retries,
  visibilidade nem isolamento de processo com a mesma robustez.

## Fluxo (importação de planilha)

1. `POST /api/.../import` recebe o arquivo, cria um `ImportJob` (status=PENDENTE)
   e enfileira → responde **202 Accepted** com o id do job.
2. O **worker** consome a fila, faz parse e validação linha a linha, grava
   resultados e atualiza progresso/erros.
3. Eventos de progresso e conclusão vão ao frontend via Socket.IO.

## Consequências

- ➕ Requisições rápidas; trabalho pesado isolado; resiliente a falhas.
- ➖ Mais uma peça para operar (worker) — mitigado por rodar no mesmo compose.
