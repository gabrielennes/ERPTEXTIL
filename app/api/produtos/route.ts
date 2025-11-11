import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  // Verificar autenticação
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }
  try {
    const produtos = await prisma.produto.findMany({
      include: {
        variacoes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(produtos)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verificar autenticação
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
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

    if (!variacoes || variacoes.length === 0) {
      return NextResponse.json(
        { error: 'É necessário pelo menos uma variação' },
        { status: 400 }
      )
    }

    // Criar produto com variações
    const produto = await prisma.produto.create({
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
        variacoes: {
          create: variacoes.map((v: any) => ({
            sku: v.sku,
            codigoBarras: v.codigoBarras || null,
            rfid: v.rfid || null,
            tamanho: v.tamanho || null,
            cor: v.cor || null,
            estoque: v.estoque || 0,
            preco: v.preco ? parseFloat(v.preco) : null,
          })),
        },
      },
      include: {
        variacoes: true,
      },
    })

    return NextResponse.json(produto, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}

