import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar se os modelos existem no Prisma Client
    if (!prisma.contasAPagar || !prisma.contasAReceber) {
      return NextResponse.json(
        {
          error:
            'Prisma Client não está atualizado. Execute "npx prisma generate" e reinicie o servidor.',
        },
        { status: 500 }
      )
    }

    // Buscar contas a pagar (apenas as que foram dadas baixa)
    const contasAPagar = await prisma.contasAPagar.findMany({
      where: {
        baixada: true, // Apenas contas baixadas
      },
      include: {
        fornecedor: true,
      },
      orderBy: {
        dataBaixa: 'desc', // Ordenar por data de baixa
      },
    })

    // Buscar contas a receber (apenas as que foram dadas baixa)
    const contasAReceber = await prisma.contasAReceber.findMany({
      where: {
        baixada: true, // Apenas contas baixadas
      },
      include: {
        cliente: true,
      },
      orderBy: {
        dataBaixa: 'desc', // Ordenar por data de baixa
      },
    })

    // Transformar contas a pagar em movimentações (usar dataBaixa se disponível)
    const movimentacoesPagamento = contasAPagar.map((conta) => ({
      id: `pagamento-${conta.id}`,
      tipo: 'pagamento' as const,
      descricao: `Pagamento - ${conta.fornecedor.nome}`,
      valor: conta.valorTotal,
      data: conta.dataBaixa?.toISOString() || conta.dataPagamento.toISOString(),
      fornecedor: conta.fornecedor.nome,
      tipoTransacao: conta.tipoTransacao,
    }))

    // Transformar contas a receber em movimentações (usar dataBaixa se disponível)
    const movimentacoesRecebimento = contasAReceber.map((conta) => ({
      id: `recebimento-${conta.id}`,
      tipo: 'recebimento' as const,
      descricao: `Recebimento - ${conta.cliente.nome}`,
      valor: conta.valorTotal,
      data: conta.dataBaixa?.toISOString() || conta.dataRecebimento.toISOString(),
      cliente: conta.cliente.nome,
      tipoTransacao: conta.tipoTransacao,
    }))

    // Combinar todas as movimentações
    const movimentacoes = [...movimentacoesPagamento, ...movimentacoesRecebimento]

    return NextResponse.json(movimentacoes)
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar movimentações' },
      { status: 500 }
    )
  }
}

