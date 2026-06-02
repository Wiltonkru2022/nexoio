# Deploy e Domínio

## Estratégia de Domínio

Use:

- `nexoio.com.br` para o site comercial.
- `www.nexoio.com.br` como alias do site comercial.
- `app.nexoio.com.br` para o sistema.

No código, quando o host começa com `app.`, a tela pública abre direto no login. No domínio principal, abre a landing page.

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
