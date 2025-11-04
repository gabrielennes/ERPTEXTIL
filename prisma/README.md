# Seed do Banco de Dados

Este arquivo contém dados de exemplo para popular o banco de dados com produtos têxteis.

## Como usar

1. Certifique-se de que as migrações foram executadas:
   ```bash
   yarn prisma:generate
   yarn prisma:migrate
   ```

2. Execute o seed:
   ```bash
   yarn prisma:seed
   ```

   Ou usando o Prisma diretamente:
   ```bash
   npx prisma db seed
   ```

## Produtos incluídos no seed

- **Camiseta Básica Manga Curta** - 5 variações (tamanhos P, M, G e cores Branca/Preta)
- **Calça Jeans Slim** - 4 variações (tamanhos 38, 40, 42 e cores Azul/Preta)
- **Toalha de Banho Fofa** - 3 variações (cores Azul, Branca, Cinza)
- **Conjunto de Lençol 4 Peças** - 3 variações (tamanhos Solteiro, Casal, Queen)
- **Manta Térmica Acrílica** - 3 variações (cores Cinza, Bege, Azul)
- **Cobertor de Algodão** - 3 variações (tamanhos e cores variados)

Total: **6 produtos** com **21 variações** no total.

## Limpar e recriar

O seed automaticamente limpa os dados existentes antes de criar novos. Para limpar manualmente:

```bash
npx prisma migrate reset
```

Isso irá resetar o banco, aplicar todas as migrações e executar o seed automaticamente.

