import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    // Buscar configurações de integração do banco de dados
    // Por enquanto, retornar valores vazios como padrão
    // Você pode criar uma tabela de configurações no Prisma depois
    
    return NextResponse.json({
      ecommerce: {
        url: '',
        key: '',
      },
      bling: {
        url: '',
        key: '',
      },
      tiny: {
        url: '',
        key: '',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar configuração de integração:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuração' },
      { status: 500 }
    )
  }
}

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
    const { ecommerce, bling, tiny } = body

    // Validar dados
    if (!ecommerce || !bling || !tiny) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Aqui você pode salvar no banco de dados
    // Por enquanto, apenas retornar sucesso
    // Você pode criar uma tabela de configurações no Prisma depois
    
    // Exemplo de como salvar (quando tiver a tabela):
    // await prisma.integracaoConfig.upsert({
    //   where: { userId: session.userId },
    //   update: { ecommerce, bling, tiny },
    //   create: { userId: session.userId, ecommerce, bling, tiny },
    // })

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
    })
  } catch (error) {
    console.error('Erro ao salvar configuração de integração:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuração' },
      { status: 500 }
    )
  }
}

