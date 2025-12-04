import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { nome, cnpj, cep } = body

    // Validar dados obrigatórios
    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o modelo Fornecedor existe no Prisma Client
    if (!prisma.fornecedor) {
      return NextResponse.json(
        { error: 'Modelo Fornecedor não encontrado. Por favor, pare o servidor, execute "npx prisma generate" e reinicie o servidor.' },
        { status: 500 }
      )
    }

    // Criar fornecedor no banco de dados
    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome: nome.trim(),
        cnpj: cnpj?.trim() || null,
        cep: cep?.trim() || null,
        dataCadastro: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      fornecedor,
      message: 'Fornecedor cadastrado com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao cadastrar fornecedor:', error)
    
    // Verificar se é erro de modelo não encontrado
    if (error?.message?.includes('Cannot read properties of undefined') || 
        error?.message?.includes("Cannot read property 'create' of undefined")) {
      return NextResponse.json(
        { error: 'Prisma Client não atualizado. Pare o servidor, execute "npx prisma generate" e reinicie.' },
        { status: 500 }
      )
    }
    
    // Verificar se é erro de tabela não encontrada
    if (error?.code === 'P2001' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Tabela de fornecedores não encontrada. Execute: npx prisma db push' },
        { status: 500 }
      )
    }
    
    // Retornar mensagem de erro mais específica
    const errorMessage = error?.message || 'Erro ao cadastrar fornecedor'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const fornecedores = await prisma.fornecedor.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(fornecedores)
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar fornecedores' },
      { status: 500 }
    )
  }
}

