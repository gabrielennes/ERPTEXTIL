import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const produto = await prisma.produto.findUnique({
      where: {
        id,
      },
      include: {
        variacoes: true,
      },
    })

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(produto)
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      nome,
      marca,
      peso,
      precoCusto,
      descricao,
      categoria,
      ncm,
      dimensoes,
      precoVenda,
      variacoes,
    } = body

    // Validações básicas
    if (!nome || !precoVenda) {
      return NextResponse.json(
        { error: 'Nome e preço de venda são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o produto existe
    const produtoExistente = await prisma.produto.findUnique({
      where: { id },
    })

    if (!produtoExistente) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar produto usando transação para garantir consistência
    const produto = await prisma.$transaction(async (tx) => {
      // Atualizar dados do produto
      const produtoAtualizado = await tx.produto.update({
        where: { id },
        data: {
          nome,
          marca: marca || null,
          peso: peso || null,
          precoCusto: precoCusto || null,
          descricao: descricao || null,
          categoria: categoria || null,
          ncm: ncm || null,
          dimensoes: dimensoes || null,
          precoVenda: parseFloat(precoVenda),
        },
      })

      // Deletar variações antigas
      await tx.variacao.deleteMany({
        where: { produtoId: id },
      })

      // Criar novas variações
      if (variacoes && variacoes.length > 0) {
        await tx.variacao.createMany({
          data: variacoes.map((v: any) => ({
            produtoId: id,
            sku: v.sku,
            codigoBarras: v.codigoBarras || null,
            rfid: v.rfid || null,
            tamanho: v.tamanho || null,
            cor: v.cor || null,
            estoque: v.estoque || 0,
            preco: v.preco ? parseFloat(v.preco) : null,
          })),
        })
      }

      // Buscar produto atualizado com variações
      return await tx.produto.findUnique({
        where: { id },
        include: { variacoes: true },
      })
    })

    return NextResponse.json(produto)
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}

