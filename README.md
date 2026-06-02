# Nexo.io

Sistema web multi-loja para lojas de eletrônicos, com PDV, produtos, estoque, clientes, vendas, financeiro, assistência técnica, relatórios, impressões e assinatura via Pix Woovi/OpenPix.

## Visão Geral

O Nexo.io foi pensado para vender acesso como SaaS:

- `nexoio.com.br`: site comercial, plano, termos, privacidade, login e cadastro.
- `app.nexoio.com.br`: sistema do lojista, com login direto.
- Firebase Authentication para acesso.
- Firestore com isolamento por loja.
- Firebase Hosting para publicação.
- Cloud Functions para integrações sensíveis, como Woovi/OpenPix.
- Woovi/OpenPix para assinatura mensal do sistema.
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
- Woovi/OpenPix

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
npx firebase-tools functions:secrets:set WOOVI_API_KEY
npx firebase-tools deploy --only functions
```

Observação: Cloud Functions exige o plano Blaze no Firebase.

## Documentação

- [Deploy e domínio](docs/deploy.md)
- [Firebase e segurança](docs/firebase.md)
- [Assinatura Woovi/OpenPix](docs/woovi-assinatura.md)
- [Operação do sistema](docs/operacao.md)
- [Checklist para venda](docs/checklist-venda.md)

## Status Comercial

O frontend e as regras Firestore já foram publicados no Firebase Hosting:

```text
https://nexoio-4b7ae.web.app
```

As Functions de assinatura ficam pendentes até ativar o plano Blaze e configurar o segredo `WOOVI_API_KEY`.
