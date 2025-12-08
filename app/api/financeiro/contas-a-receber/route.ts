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
    // Verificar se o modelo ContasAReceber existe no Prisma Client
    if (!prisma.contasAReceber) {
      return NextResponse.json(
        { error: 'Modelo ContasAReceber não encontrado. Por favor, pare o servidor, execute "npx prisma generate" e reinicie o servidor.' },
        { status: 500 }
      )
    }

    const contas = await prisma.contasAReceber.findMany({
      where: {
        baixada: false, // Apenas contas não baixadas
      },
      include: {
        cliente: true,
      },
      orderBy: {
        dataVencimento: 'asc',
      },
    })

    return NextResponse.json(contas)
  } catch (error: any) {
    console.error('Erro ao buscar contas a receber:', error)
    
    // Verificar se é erro de modelo não encontrado
    if (error?.message?.includes('Cannot read properties of undefined') || 
        error?.message?.includes("Cannot read property 'findMany' of undefined")) {
      return NextResponse.json(
        { error: 'Prisma Client não atualizado. Pare o servidor, execute "npx prisma generate" e reinicie.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar contas a receber' },
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
    // Verificar se o modelo ContasAReceber existe no Prisma Client
    if (!prisma.contasAReceber) {
      return NextResponse.json(
        { error: 'Modelo ContasAReceber não encontrado. Por favor, pare o servidor, execute "npx prisma generate" e reinicie o servidor.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      clienteId,
      cnpjCpf,
      valor,
      parcelas,
      valorTotal,
      dataVencimento,
      dataRecebimento, // Mantido para compatibilidade
      categoriaFinanceira,
      tipoTransacao, // Mantido para compatibilidade
      chavePix,
      contaBancaria,
      codigoBarras,
      pdfUrl,
      pdfNome,
    } = body

    // Usar categoriaFinanceira se fornecido, senão usar tipoTransacao (compatibilidade)
    const categoria = categoriaFinanceira || tipoTransacao || ''
    
    // Usar dataVencimento se fornecido, senão usar dataRecebimento (compatibilidade)
    const dataVenc = dataVencimento || dataRecebimento

    // Validar dados obrigatórios
    if (!clienteId || !valor || !parcelas || !valorTotal || !dataVenc || !categoria) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Converter dataVencimento para Date
    const dataVencimentoDate = new Date(dataVenc)

    // Criar conta a receber
    // Mapear categoriaFinanceira para tipoTransacao no banco (mantém compatibilidade)
    const conta = await prisma.contasAReceber.create({
      data: {
        clienteId,
        cnpjCpf: cnpjCpf || null,
        valor: parseFloat(valor),
        parcelas: parseInt(parcelas),
        valorTotal: parseFloat(valorTotal),
        dataVencimento: dataVencimentoDate,
        tipoTransacao: categoria, // Armazena a categoria financeira no campo tipoTransacao
        chavePix: chavePix || null,
        contaBancaria: contaBancaria || null,
        codigoBarras: codigoBarras || null,
        pdfUrl: pdfUrl || null,
        pdfNome: pdfNome || null,
      },
      include: {
        cliente: true,
      },
    })

    return NextResponse.json({
      success: true,
      conta,
      message: 'Conta a receber cadastrada com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao cadastrar conta a receber:', error)
    
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
        { error: 'Tabela de contas a receber não encontrada. Execute: npx prisma db push' },
        { status: 500 }
      )
    }
    
    const errorMessage = error?.message || 'Erro ao cadastrar conta a receber'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

