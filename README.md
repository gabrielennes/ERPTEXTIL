# ERP Têxtil

Sistema de Gestão Empresarial para Indústria Têxtil desenvolvido com Next.js, TypeScript e Prisma.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional

## 📋 Pré-requisitos

- Node.js 18+ 
- Yarn
- PostgreSQL instalado e rodando

## 🛠️ Instalação

1. Clone o repositório (ou certifique-se de estar no diretório do projeto)

2. Instale as dependências:
```bash
yarn install
```

3. Configure o banco de dados:
   - Crie um banco de dados PostgreSQL chamado `erptextil`
   - Copie o arquivo `.env.example` para `.env` (se não existir)
   - Configure a `DATABASE_URL` no arquivo `.env`:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/erptextil?schema=public"
   ```

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

## 🔧 Próximos Passos

- [ ] Configurar autenticação
- [ ] Criar modelos de dados para ERP têxtil
- [ ] Implementar módulos principais (Produtos, Pedidos, Estoque, etc.)
- [ ] Criar interface de usuário

## 📄 Licença

Este projeto é privado.

