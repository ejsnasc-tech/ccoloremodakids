# CColore Moda Kids 👶

Loja online de roupas infantis com painel administrativo.

## Estrutura

```
index.html        → Loja (vitrine para os clientes)
admin.html        → Painel administrativo (gerenciar produtos e estoque)
css/style.css     → Estilos do site
js/data.js        → Módulo de dados (localStorage)
js/app.js         → JavaScript da loja
js/admin.js       → JavaScript do painel admin
```

## Como usar

1. Abra `index.html` no navegador para ver a loja
2. Abra `admin.html` para acessar o painel admin
3. **Senha do admin:** `ccolore2024`

## Funcionalidades

### Loja
- Catálogo de produtos com filtro por categoria
- Busca por nome/descrição
- Visualização de tamanhos e estoque disponível
- Carrinho de compras
- Envio do pedido via WhatsApp

### Admin
- Dashboard com estatísticas e alertas de estoque baixo
- Cadastro, edição e exclusão de produtos
- Gerenciamento de tamanhos e estoque real
- Proteção por senha

## Configuração

Para configurar o número do WhatsApp, edite o arquivo `js/app.js` e altere a variável `phoneNumber` na função de checkout.