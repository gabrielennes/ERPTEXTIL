import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar se os modelos existem no Prisma Client
    if (!prisma.contasAPagar || !prisma.contasAReceber || !prisma.venda) {
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

    // Buscar vendas aprovadas do PDV (apenas vendas com status 'approved')
    const vendasAprovadas = await prisma.venda.findMany({
      where: {
        statusPagamento: 'approved', // Apenas vendas aprovadas
      },
      orderBy: {
        dataVenda: 'desc', // Ordenar por data da venda
      },
    })

    // Transformar contas a pagar em movimentações (usar dataBaixa se disponível)
    const movimentacoesPagamento = contasAPagar.map((conta: any) => ({
      id: `pagamento-${conta.id}`,
      tipo: 'pagamento' as const,
      descricao: `Pagamento - ${conta.fornecedor.nome}`,
      valor: conta.valorTotal,
      data: conta.dataBaixa?.toISOString() || conta.dataPagamento.toISOString(),
      fornecedor: conta.fornecedor.nome,
      cliente: null,
      setor: 'Contas a Pagar',
      categoriaFinanceira: conta.tipoTransacao || 'Outros', // tipoTransacao armazena a categoria financeira
    }))

    // Transformar contas a receber em movimentações (usar dataBaixa se disponível)
    const movimentacoesRecebimento = contasAReceber.map((conta: any) => ({
      id: `recebimento-${conta.id}`,
      tipo: 'recebimento' as const,
      descricao: `Recebimento - ${conta.cliente.nome}`,
      valor: conta.valorTotal,
      data: conta.dataBaixa?.toISOString() || conta.dataVencimento.toISOString(),
      fornecedor: null,
      cliente: conta.cliente.nome,
      setor: 'Contas a Receber',
      categoriaFinanceira: conta.tipoTransacao || 'Outros', // tipoTransacao armazena a categoria financeira
    }))

    // Transformar vendas do PDV em movimentações de recebimento
    const movimentacoesVendasPDV = vendasAprovadas.map((venda) => {
      // Criar descrição com número da venda
      const numeroVenda = venda.numero || `#${venda.id.slice(-8).toUpperCase()}`
      const descricao = `Venda PDV - ${numeroVenda}`

      // Determinar categoria financeira baseada no método de pagamento
      // Por padrão, vendas do PDV são "Venda Varejo"
      let categoriaFinanceira = 'Venda Varejo'
      
      // Se houver alguma lógica futura para diferenciar categorias por método de pagamento,
      // pode ser adicionada aqui
      // Por exemplo: se método for 'atacado', categoriaFinanceira = 'Venda Atacado'

      return {
        id: `venda-pdv-${venda.id}`,
        tipo: 'recebimento' as const,
        descricao,
        valor: venda.total,
        data: venda.dataVenda.toISOString(),
        fornecedor: null,
        cliente: null,
        setor: 'PDV',
        categoriaFinanceira,
      }
    })

    // Combinar todas as movimentações
    const movimentacoes = [
      ...movimentacoesPagamento,
      ...movimentacoesRecebimento,
      ...movimentacoesVendasPDV,
    ]

    return NextResponse.json(movimentacoes)
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar movimentações' },
      { status: 500 }
    )
  }
}

