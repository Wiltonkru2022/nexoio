# Operação do Sistema

## Cadastro de Loja

O visitante acessa o site, cria conta, aceita termos e cadastra os dados da loja.

Campos principais:

- Nome da loja
- CPF/CNPJ
- Telefone
- CEP
- Rua
- Número
- Bairro
- Cidade
- UF

O CEP usa consulta externa para preencher endereço quando disponível.

## PDV

O PDV permite:

- Selecionar cliente.
- Buscar produto.
- Buscar serviço.
- Adicionar vale/crédito.
- Usar múltiplos pagamentos.
- Bloquear finalização se faltar valor.
- Gerar troco ou crédito.
- Registrar Pix, dinheiro, cartão, boleto, transferência, vale/crédito e crediário.

Atalhos:

- Produto: `Ctrl + P`
- Serviço: `Ctrl + S`
- Cliente: `Ctrl + C`
- Vale: `Ctrl + V`

## Vendas

Vendas novas usam numeração:

```text
Venda #1
Venda #2
Venda #3
```

O modal de venda permite gerar 2ª via/PDF do comprovante.

## OS

OS novas usam numeração:

```text
OS #1
OS #2
OS #3
```

Ao salvar OS, o sistema imprime duas vias:

- Via do cliente
- Via do estabelecimento

As vias incluem:

- Logo da loja
- Endereço
- WhatsApp/telefone
- Termos
- Prazos
- Assinaturas

## Impressões

As impressões não usam print da tela inteira.

O sistema abre documentos próprios para:

- Comprovante de venda
- 2ª via de venda
- Comprovante de caixa
- Relatórios
- Financeiro
- OS em duas vias

No diálogo do navegador, o operador pode escolher impressora física ou salvar como PDF.

## Backup

O módulo Backup exporta dados operacionais em JSON.

Google Drive está previsto no módulo Integrações como configuração, mas a automação real deve ser feita via backend depois.
