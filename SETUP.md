# Guia de Configuração

## Configuração do PostgreSQL

### 1. Criar o Banco de Dados

Conecte-se ao PostgreSQL e crie o banco de dados:

```sql
CREATE DATABASE erptextil;
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/erptextil?schema=public"
```

Substitua:
- `usuario` - seu usuário do PostgreSQL (geralmente `postgres`)
- `senha` - sua senha do PostgreSQL
- `localhost:5432` - host e porta do PostgreSQL (padrão: localhost:5432)
- `erptextil` - nome do banco de dados criado

### 3. Executar Migrações

Após configurar o `.env`, execute:

```bash
# Gerar o cliente Prisma
yarn prisma:generate

# Executar migrações
yarn prisma:migrate
```

Isso criará as tabelas no banco de dados conforme definido no schema do Prisma.

### 4. Verificar Conexão

Para verificar se tudo está funcionando, inicie o servidor:

```bash
yarn dev
```

E acesse:
- Frontend: http://localhost:3000
- API Health Check: http://localhost:3000/api/health

## Estrutura Inicial

O projeto já vem com:
- ✅ Next.js 14 configurado com App Router
- ✅ TypeScript configurado
- ✅ Prisma configurado com PostgreSQL
- ✅ Cliente Prisma singleton em `lib/prisma.ts`
- ✅ Rotas de API de exemplo
- ✅ Modelo básico de User no schema

## Próximos Passos

1. Expandir o schema do Prisma com modelos específicos para ERP têxtil
2. Criar rotas de API para CRUD
3. Desenvolver componentes de UI
4. Implementar autenticação (se necessário)

