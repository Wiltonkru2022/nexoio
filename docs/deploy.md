# Deploy e Domínio

## Estratégia de Domínio

Use:

- `https://nexoio.com.br` para a página inicial.
- `https://nexoio.com.br/login` para login.
- `https://nexoio.com.br/cadastro` para cadastro.
- `https://app.nexoio.com.br/painel` para o painel do sistema.

Rotas canônicas:

- `https://nexoio.com.br/painel` redireciona para `https://app.nexoio.com.br/painel`.
- `https://app.nexoio.com.br/login` redireciona para `https://nexoio.com.br/login`.
- `https://app.nexoio.com.br/cadastro` redireciona para `https://nexoio.com.br/cadastro`.
- Usuário autenticado no domínio público redireciona para `https://app.nexoio.com.br/painel`.

Os domínios padrão do Firebase não devem ser divulgados para clientes:

- `nexoio-4b7ae.web.app`
- `nexoio-4b7ae.firebaseapp.com`

Quando acessados pelo navegador, o app redireciona automaticamente para:

```text
https://nexoio.com.br/
```

Quando um usuário já autenticado acessa `nexoio.com.br` ou `www.nexoio.com.br`, o app direciona para:

```text
https://app.nexoio.com.br/painel
```

## Firebase Hosting

O Firebase Hosting está configurado em `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Publicar Frontend

```bash
npm run build
npx firebase-tools deploy --only hosting,firestore:rules
```

URL atual:

```text
https://nexoio-4b7ae.web.app
```

## Configurar DNS no Registro.br

1. Aguarde a transição dos servidores DNS no Registro.br.
2. No Firebase Console, abra Hosting.
3. Adicione:
   - `nexoio.com.br`
   - `www.nexoio.com.br`
   - `app.nexoio.com.br`
4. Copie exatamente os registros DNS que o Firebase informar.
5. No Registro.br, clique em Configurar zona DNS.
6. Cadastre os registros solicitados.

Normalmente o Firebase pedirá registros `A` para o domínio raiz e `CNAME` para subdomínios, mas a fonte final deve ser sempre a tela do Firebase.

## Publicar Functions

Cloud Functions exige o plano Blaze.

Depois de ativar Blaze:

```bash
npx firebase-tools functions:secrets:set MERCADO_PAGO_ACCESS_TOKEN
npx firebase-tools functions:secrets:set MERCADO_PAGO_WEBHOOK_SECRET
npx firebase-tools deploy --only functions
```

Webhook de assinatura para cadastrar no Mercado Pago:

```text
https://southamerica-east1-nexoio-4b7ae.cloudfunctions.net/nexoSubscriptionWebhook
```
