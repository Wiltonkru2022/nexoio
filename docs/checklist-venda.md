# Checklist Para Vender Acesso

## Pronto

- Frontend publicado no Firebase Hosting.
- Regras Firestore publicadas.
- Multi-loja por `tenant_id`.
- Cadastro de loja com aceite de termos.
- Tela pública, login e cadastro.
- Tela de bloqueio por assinatura.
- Estrutura de assinatura Mercado Pago no frontend.
- Functions de assinatura implementadas.
- Secret Manager preparado para `MERCADO_PAGO_ACCESS_TOKEN`.
- OS com numeração `OS #n`.
- Venda com numeração `Venda #n`.
- Impressões próprias, sem print da tela inteira.

## Pendente Antes De Vender Em Produção

- Configurar `MERCADO_PAGO_ACCESS_TOKEN`.
- Fazer deploy das Functions.
- Cadastrar webhook no Mercado Pago.
- Configurar DNS do domínio:
  - `nexoio.com.br`
  - `www.nexoio.com.br`
  - `app.nexoio.com.br`
- Testar cadastro de loja do zero.
- Testar pagamento real da assinatura.
- Testar impressão em impressora real.
- Revisar juridicamente termos e privacidade.

## Comandos Úteis

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Deploy frontend e regras:

```bash
npx firebase-tools deploy --only hosting,firestore:rules
```

Deploy Functions:

```bash
npx firebase-tools functions:secrets:set MERCADO_PAGO_ACCESS_TOKEN
npx firebase-tools deploy --only functions
```

## Observação Comercial

Enquanto Functions não estiverem no ar, o sistema pode ser demonstrado, mas a ativação automática por pagamento Pix ainda não funciona em produção.
