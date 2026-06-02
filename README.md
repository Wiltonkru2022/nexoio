# Nexo.io

Sistema web multi-loja para lojas de eletrônicos, com PDV, produtos, estoque, clientes, vendas, financeiro, assistência técnica, relatórios, impressões e assinatura via Pix Mercado Pago.

## Visão Geral

O Nexo.io foi pensado para vender acesso como SaaS:

- `nexoio.com.br`: site comercial, plano, termos, privacidade, login e cadastro.
- `app.nexoio.com.br`: sistema do lojista, com login direto.
- Firebase Authentication para acesso.
- Firestore com isolamento por loja.
- Firebase Hosting para publicação.
- Cloud Functions para integrações sensíveis, como Mercado Pago e OpenPix.
- Mercado Pago Pix para assinatura mensal do sistema.
- OpenPix opcional no PDV para o lojista receber Pix na própria conta.

## Módulos

- PDV Caixa
- Produtos
- Serviços e OS
- Clientes
- Vendas
- Estoque e fornecedores
- Financeiro
- Relatórios
- Usuários e permissões
- Configurações
- Backup
- Integrações
- Impressões
- Cupons
- Metas

## Tecnologias

- React
- Vite
- Tailwind CSS
- Firebase Auth
- Firestore
- Firebase Hosting
- Cloud Functions
- Mercado Pago

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Firebase

Projeto padrão configurado em `.firebaserc`:

```text
nexoio-4b7ae
```

Deploy do frontend e regras:

```bash
npm run build
npx firebase-tools deploy --only hosting,firestore:rules
```

Deploy das Functions:

```bash
npx firebase-tools functions:secrets:set MERCADO_PAGO_ACCESS_TOKEN
npx firebase-tools functions:secrets:set MERCADO_PAGO_WEBHOOK_SECRET
npx firebase-tools deploy --only functions
```

Observação: Cloud Functions exige o plano Blaze no Firebase.

## Documentação

- [Deploy e domínio](docs/deploy.md)
- [Firebase e segurança](docs/firebase.md)
- [Assinatura Mercado Pago Pix](docs/mercado-pago-assinatura.md)
- [Operação do sistema](docs/operacao.md)
- [Checklist para venda](docs/checklist-venda.md)

## Status Comercial

O frontend e as regras Firestore já foram publicados no Firebase Hosting:

```text
https://nexoio-4b7ae.web.app
```

As Functions de assinatura exigem o plano Blaze e os segredos `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET`.
