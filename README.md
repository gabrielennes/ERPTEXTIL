# ERP Têxtil

Sistema de Gestão Empresarial para Indústria Têxtil desenvolvido com Next.js, TypeScript e Prisma.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional

## 📋 Pré-requisitos

- Node.js 18+ 
- Yarn ou npm
- PostgreSQL instalado e rodando
- Conta no Mercado Pago (para integração de pagamentos)

## 🛠️ Instalação

1. Clone o repositório (ou certifique-se de estar no diretório do projeto)

2. Instale as dependências:
```bash
yarn install
```

3. Configure o banco de dados:
   - Crie um banco de dados PostgreSQL chamado `erptextil`
   - Crie um arquivo `.env` na raiz do projeto
   - Configure as variáveis de ambiente no arquivo `.env`:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/erptextil?schema=public"
   MERCADOPAGO_ACCESS_TOKEN="seu_access_token_do_mercado_pago"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```
   
   **Nota sobre Mercado Pago:**
   - Para obter o Access Token, acesse: https://www.mercadopago.com.br/developers/panel
   - Use o token de teste para desenvolvimento
   - Configure a URL base para produção quando fizer deploy

4. Execute as migrações do Prisma:
```bash
yarn prisma:generate
yarn prisma:migrate
```

5. Inicie o servidor de desenvolvimento:
```bash
yarn dev
```

O projeto estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
erptextil/
├── app/                 # App Router do Next.js
│   ├── api/            # API Routes
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página inicial
├── components/         # Componentes React
├── lib/               # Utilitários e configurações
│   └── prisma.ts      # Cliente Prisma
├── prisma/            # Schema e migrações do Prisma
│   └── schema.prisma  # Schema do banco de dados
└── public/            # Arquivos estáticos
```

## 📝 Scripts Disponíveis

- `yarn dev` - Inicia o servidor de desenvolvimento
- `yarn build` - Cria build de produção
- `yarn start` - Inicia o servidor de produção
- `yarn lint` - Executa o linter
- `yarn prisma:generate` - Gera o cliente Prisma
- `yarn prisma:migrate` - Executa migrações do banco
- `yarn prisma:studio` - Abre o Prisma Studio

## 💳 Integração com Mercado Pago

O sistema está integrado com o Mercado Pago para processamento de pagamentos no PDV. 

### Funcionalidades:
- ✅ Pagamento em dinheiro (cria venda diretamente)
- ✅ Pagamento via Cartão (Mercado Pago)
- ✅ Pagamento via PIX (Mercado Pago)
- ✅ Checkout completo do Mercado Pago
- ✅ Webhook para atualização automática de status
- ✅ Controle de estoque automático após venda

### Como testar:
1. Configure o `MERCADOPAGO_ACCESS_TOKEN` no `.env`
2. Acesse o PDV e adicione produtos ao carrinho
3. Selecione o método de pagamento (Dinheiro, Cartão, PIX ou Mercado Pago)
4. Clique em "Finalizar Venda"
5. Para pagamentos online, você será redirecionado ao checkout do Mercado Pago

### Webhook:
O webhook está configurado em `/api/pagamentos/webhook` e processa notificações do Mercado Pago automaticamente.

## 🔧 Próximos Passos

- [x] Configurar autenticação
- [x] Criar modelos de dados para ERP têxtil
- [x] Implementar módulos principais (Produtos, Pedidos, Estoque, etc.)
- [x] Integração com Mercado Pago
- [ ] Melhorar interface de usuário
- [ ] Adicionar relatórios de vendas

## 📄 Licença

Este projeto é privado.

