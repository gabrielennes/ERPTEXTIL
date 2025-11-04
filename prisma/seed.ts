import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Limpar dados existentes
  await prisma.variacao.deleteMany()
  await prisma.produto.deleteMany()

  // Produto 1: Camiseta Básica
  const camiseta = await prisma.produto.create({
    data: {
      nome: 'Camiseta Básica Manga Curta',
      marca: 'Textil Premium',
      peso: 0.15,
      precoCusto: 12.50,
      descricao: 'Camiseta básica de algodão 100%, ideal para uso diário. Confortável e durável.',
      categoria: 'Vestuário',
      ncm: '6109.10.00',
      dimensoes: '30×25×3',
      precoVenda: 29.90,
      variacoes: {
        create: [
          {
            sku: 'CAM-BAS-P-BRANCA',
            codigoBarras: '7891234567890',
            tamanho: 'P',
            cor: 'Branca',
            estoque: 50,
            preco: null,
          },
          {
            sku: 'CAM-BAS-M-BRANCA',
            codigoBarras: '7891234567891',
            tamanho: 'M',
            cor: 'Branca',
            estoque: 75,
            preco: null,
          },
          {
            sku: 'CAM-BAS-G-BRANCA',
            codigoBarras: '7891234567892',
            tamanho: 'G',
            cor: 'Branca',
            estoque: 60,
            preco: null,
          },
          {
            sku: 'CAM-BAS-P-PRETA',
            codigoBarras: '7891234567893',
            tamanho: 'P',
            cor: 'Preta',
            estoque: 45,
            preco: null,
          },
          {
            sku: 'CAM-BAS-M-PRETA',
            codigoBarras: '7891234567894',
            tamanho: 'M',
            cor: 'Preta',
            estoque: 80,
            preco: null,
          },
        ],
      },
    },
  })

  // Produto 2: Calça Jeans
  const calca = await prisma.produto.create({
    data: {
      nome: 'Calça Jeans Slim',
      marca: 'Denim Style',
      peso: 0.65,
      precoCusto: 45.00,
      descricao: 'Calça jeans slim fit, corte moderno e confortável. Feita com denim de alta qualidade.',
      categoria: 'Vestuário',
      ncm: '6203.42.10',
      dimensoes: '35×32×5',
      precoVenda: 89.90,
      variacoes: {
        create: [
          {
            sku: 'CAL-JEANS-38-AZUL',
            codigoBarras: '7891234567895',
            tamanho: '38',
            cor: 'Azul Claro',
            estoque: 30,
            preco: null,
          },
          {
            sku: 'CAL-JEANS-40-AZUL',
            codigoBarras: '7891234567896',
            tamanho: '40',
            cor: 'Azul Claro',
            estoque: 35,
            preco: null,
          },
          {
            sku: 'CAL-JEANS-42-AZUL',
            codigoBarras: '7891234567897',
            tamanho: '42',
            cor: 'Azul Claro',
            estoque: 25,
            preco: null,
          },
          {
            sku: 'CAL-JEANS-38-PRETA',
            codigoBarras: '7891234567898',
            tamanho: '38',
            cor: 'Preta',
            estoque: 20,
            preco: null,
          },
        ],
      },
    },
  })

  // Produto 3: Toalha de Banho
  const toalha = await prisma.produto.create({
    data: {
      nome: 'Toalha de Banho Fofa',
      marca: 'Casa Conforto',
      peso: 0.35,
      precoCusto: 18.00,
      descricao: 'Toalha de banho extra fofa, alta absorção. Ideal para uso diário.',
      categoria: 'Casa e Banho',
      ncm: '6302.91.00',
      dimensoes: '70×140×2',
      precoVenda: 39.90,
      variacoes: {
        create: [
          {
            sku: 'TOA-BANHO-AZUL',
            codigoBarras: '7891234567899',
            rfid: 'RFID-TOA-001',
            cor: 'Azul',
            estoque: 100,
            preco: null,
          },
          {
            sku: 'TOA-BANHO-BRANCA',
            codigoBarras: '7891234567900',
            rfid: 'RFID-TOA-002',
            cor: 'Branca',
            estoque: 120,
            preco: null,
          },
          {
            sku: 'TOA-BANHO-CINZA',
            codigoBarras: '7891234567901',
            rfid: 'RFID-TOA-003',
            cor: 'Cinza',
            estoque: 80,
            preco: null,
          },
        ],
      },
    },
  })

  // Produto 4: Conjunto de Lençol
  const lencol = await prisma.produto.create({
    data: {
      nome: 'Conjunto de Lençol 4 Peças',
      marca: 'Casa Conforto',
      peso: 0.85,
      precoCusto: 35.00,
      descricao: 'Conjunto completo com lençol de elástico, lençol de cima, fronha e 2 fronhas para travesseiro.',
      categoria: 'Casa e Banho',
      ncm: '6302.31.00',
      dimensoes: '40×40×8',
      precoVenda: 79.90,
      variacoes: {
        create: [
          {
            sku: 'LEN-4PCS-SOLTEIRO-ROSA',
            codigoBarras: '7891234567902',
            tamanho: 'Solteiro',
            cor: 'Rosa',
            estoque: 25,
            preco: null,
          },
          {
            sku: 'LEN-4PCS-CASAL-BRANCO',
            codigoBarras: '7891234567903',
            tamanho: 'Casal',
            cor: 'Branco',
            estoque: 30,
            preco: null,
          },
          {
            sku: 'LEN-4PCS-QUEEN-AZUL',
            codigoBarras: '7891234567904',
            tamanho: 'Queen',
            cor: 'Azul',
            estoque: 20,
            preco: null,
          },
        ],
      },
    },
  })

  // Produto 5: Manta Térmica
  const manta = await prisma.produto.create({
    data: {
      nome: 'Manta Térmica Acrílica',
      marca: 'Conforto Plus',
      peso: 0.95,
      precoCusto: 42.00,
      descricao: 'Manta térmica acrílica, super quentinha e macia. Perfeita para o inverno.',
      categoria: 'Casa e Banho',
      ncm: '6301.30.00',
      dimensoes: '50×60×3',
      precoVenda: 99.90,
      variacoes: {
        create: [
          {
            sku: 'MAN-TERM-CINZA',
            codigoBarras: '7891234567905',
            cor: 'Cinza',
            estoque: 40,
            preco: 89.90, // Preço especial para esta variação
          },
          {
            sku: 'MAN-TERM-BEGE',
            codigoBarras: '7891234567906',
            cor: 'Bege',
            estoque: 35,
            preco: null,
          },
          {
            sku: 'MAN-TERM-AZUL',
            codigoBarras: '7891234567907',
            cor: 'Azul',
            estoque: 30,
            preco: null,
          },
        ],
      },
    },
  })

  // Produto 6: Cobertor
  const cobertor = await prisma.produto.create({
    data: {
      nome: 'Cobertor de Algodão',
      marca: 'Casa Conforto',
      peso: 1.2,
      precoCusto: 55.00,
      descricao: 'Cobertor de algodão 100%, macio e confortável. Ideal para todas as estações.',
      categoria: 'Casa e Banho',
      ncm: '6301.20.00',
      dimensoes: '60×80×4',
      precoVenda: 129.90,
      variacoes: {
        create: [
          {
            sku: 'COB-ALG-CASAL-BRANCO',
            codigoBarras: '7891234567908',
            tamanho: 'Casal',
            cor: 'Branco',
            estoque: 15,
            preco: null,
          },
          {
            sku: 'COB-ALG-CASAL-CINZA',
            codigoBarras: '7891234567909',
            tamanho: 'Casal',
            cor: 'Cinza',
            estoque: 18,
            preco: null,
          },
          {
            sku: 'COB-ALG-QUEEN-AZUL',
            codigoBarras: '7891234567910',
            tamanho: 'Queen',
            cor: 'Azul',
            estoque: 12,
            preco: null,
          },
        ],
      },
    },
  })

  console.log('✅ Seed concluído com sucesso!')
  console.log(`📦 Produtos criados: 6`)
  console.log(`📋 Total de variações: ${await prisma.variacao.count()}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

