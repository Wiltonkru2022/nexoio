# Assinatura via Woovi/OpenPix

## Objetivo

Cobrar a mensalidade do Nexo.io por Pix usando Woovi/OpenPix, sem expor token no frontend.

## Fluxo

1. Cliente cria a conta da loja.
2. Loja nasce com `subscriptionStatus: "pending_payment"`.
3. App mostra a tela de assinatura.
4. Usuário gera Pix.
5. Cloud Function cria cobrança na Woovi.
6. Cliente paga.
7. Webhook da Woovi confirma pagamento.
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

O token da Woovi deve ser configurado como Secret Manager:

```bash
npx firebase-tools functions:secrets:set WOOVI_API_KEY
```

Nunca salve token em arquivo `.env` versionado nem no frontend.

## Webhook

Depois do deploy das Functions, cadastrar na Woovi:

```text
https://southamerica-east1-nexoio-4b7ae.cloudfunctions.net/nexoSubscriptionWebhook
```

## Diferença Importante

Existem dois usos de OpenPix/Woovi:

- Assinatura Nexo.io: cobra a mensalidade do sistema e usa token secreto do Nexo.io no backend.
- Pix do PDV: integração opcional do lojista para receber Pix na conta dele.

Esses fluxos não devem misturar credenciais.

## Status de Assinatura

Campos no tenant:

```js
plan: "starter",
subscriptionStatus: "active",
subscriptionProvider: "woovi",
subscriptionAmount: 99.9,
subscriptionDueDate: "2026-07-02",
lastPaymentAt: "..."
```

Status previstos:

- `trial`
- `pending_payment`
- `active`
- `overdue`
- `canceled`
- `blocked`
