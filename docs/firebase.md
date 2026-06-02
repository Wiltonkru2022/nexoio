# Firebase e Segurança

## Serviços Usados

- Firebase Authentication
- Firestore
- Firebase Hosting
- Cloud Functions
- Secret Manager para token Mercado Pago

## Multi-Loja

Cada loja é um documento em:

```text
tenants/{tenantId}
```

Dados operacionais ficam em subcoleções:

```text
tenants/{tenantId}/products
tenants/{tenantId}/services
tenants/{tenantId}/customers
tenants/{tenantId}/orders
tenants/{tenantId}/workOrders
tenants/{tenantId}/cashSessions
tenants/{tenantId}/cashMovements
tenants/{tenantId}/stockMovements
tenants/{tenantId}/coupons
tenants/{tenantId}/openPixCharges
tenants/{tenantId}/subscriptionCharges
tenants/{tenantId}/auditLogs
```

O vínculo do usuário com a loja fica em:

```text
userProfiles/{uid}
```

Com o campo:

```js
tenant_id: "..."
```

## Regras Firestore

Arquivo:

```text
firestore.rules
```

As regras garantem:

- Usuário só lê dados da própria loja.
- Escrita depende do cargo.
- Cobranças OpenPix e assinatura não são escritas pelo frontend.
- Logs de auditoria são lidos por gerente/admin.
- Exclusões destrutivas são bloqueadas por padrão.

Publicar regras:

```bash
npx firebase-tools deploy --only firestore:rules
```

## Cargos

- Dono/Admin
- Gerente
- Caixa/Atendente

As permissões ficam em `src/lib/validation.js`.

## Assinatura

Lojas novas nascem com:

```js
subscriptionStatus: "pending_payment",
subscriptionProvider: "mercado_pago",
subscriptionAmount: 1
```

Se a assinatura não estiver ativa, o app mostra a tela de regularização.

Lojas antigas sem `subscriptionStatus` são tratadas como ativas para não bloquear testes e migrações.
