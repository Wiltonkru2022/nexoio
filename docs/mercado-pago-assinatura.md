# Assinatura via Mercado Pago Pix

## Objetivo

Cobrar a mensalidade do Nexo.io por Pix usando Mercado Pago, mantendo a tela de pagamento dentro do próprio Nexo.io.

## Fluxo

1. Cliente cria a conta da loja.
2. Loja nasce com `subscriptionStatus: "pending_payment"`.
3. App mostra a tela de assinatura.
4. Usuário gera Pix.
5. Cloud Function cria pagamento Pix no Mercado Pago.
6. Cliente paga pelo QR Code ou copia e cola.
7. Webhook do Mercado Pago confirma pagamento.
8. Cloud Function atualiza a loja para `subscriptionStatus: "active"`.
9. Sistema libera os módulos.

## Functions

Arquivo:

```text
functions/index.js
```

Funções:

- `createNexoSubscriptionCharge`
- `checkNexoSubscriptionCharge`
- `nexoSubscriptionWebhook`

## Secret

O Access Token do Mercado Pago deve ser configurado como Secret Manager:

```bash
npx firebase-tools functions:secrets:set MERCADO_PAGO_ACCESS_TOKEN
```

Nunca salve Access Token em arquivo versionado nem no frontend.

## Webhook

Depois do deploy das Functions, cadastrar no painel do Mercado Pago:

```text
https://southamerica-east1-nexoio-4b7ae.cloudfunctions.net/nexoSubscriptionWebhook
```

Eventos recomendados:

- `payment`

## Tela Própria

O cliente não precisa sair para uma tela do Mercado Pago. O sistema recebe da API:

- QR Code Pix em base64.
- Código Pix copia e cola.
- Link de pagamento como alternativa.
- Status do pagamento.

## Status de Assinatura

Campos no tenant:

```js
plan: "starter",
subscriptionStatus: "active",
subscriptionProvider: "mercado_pago",
subscriptionAmount: 99.9,
subscriptionDueDate: "2026-07-02",
subscriptionPaymentId: "...",
lastPaymentAt: "..."
```

Status previstos:

- `trial`
- `pending_payment`
- `active`
- `overdue`
- `canceled`
- `blocked`
