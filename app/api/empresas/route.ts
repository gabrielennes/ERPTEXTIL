import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: {
        nome: 'asc',
      },
    })

    return NextResponse.json(empresas)
  } catch (error) {
    console.error('Erro ao buscar empresas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar empresas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome } = body

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a empresa já existe
    const empresaExistente = await prisma.empresa.findUnique({
      where: { nome },
    })

    if (empresaExistente) {
      return NextResponse.json(
        { error: 'Empresa já cadastrada' },
        { status: 400 }
      )
    }

    const empresa = await prisma.empresa.create({
      data: { nome },
    })

    return NextResponse.json(empresa, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao criar empresa' },
      { status: 500 }
    )
  }
}

