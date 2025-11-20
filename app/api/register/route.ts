import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, empresaId } = body

    // Validações
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { email },
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Verificar se a empresa existe (se fornecida)
    if (empresaId) {
      const empresa = await prisma.empresa.findUnique({
        where: { id: empresaId },
      })

      if (!empresa) {
        return NextResponse.json(
          { error: 'Empresa não encontrada' },
          { status: 400 }
        )
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário
    const usuario = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        empresaId: empresaId || null,
        role: 'user',
      },
    })

    return NextResponse.json(
      { message: 'Usuário cadastrado com sucesso', id: usuario.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao cadastrar usuário' },
      { status: 500 }
    )
  }
}





