import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Inicializar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'abc',
  },
})

const preference = new Preference(client)

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
    const { items, total, metadata } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Itens são obrigatórios' },
        { status: 400 }
      )
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: 'Total inválido' },
        { status: 400 }
      )
    }

    // Criar preferência de pagamento
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Garantir que a URL não termine com barra
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    
    // Construir URLs de retorno
    const successUrl = `${cleanBaseUrl}/pdv?status=success`
    const failureUrl = `${cleanBaseUrl}/pdv?status=failure`
    const pendingUrl = `${cleanBaseUrl}/pdv?status=pending`
    
    const preferenceData: any = {
      items: items.map((item: any) => ({
        id: item.id || item.produtoId,
        title: item.nome || item.title,
        quantity: item.quantidade,
        unit_price: item.precoUnitario || item.preco,
        currency_id: 'BRL',
      })),
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      // Configurações de pagamento
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
      // Permitir todos os métodos de pagamento
      binary_mode: false, // false = permite pagamentos pendentes
      statement_descriptor: 'ERPTEXTIL',
    }

    // Adicionar metadata se existir (importante para rastrear a venda)
    if (metadata && Object.keys(metadata).length > 0) {
      preferenceData.metadata = metadata
    }

    // O Mercado Pago não aceita auto_return com localhost
    // Mas vamos tentar adicionar mesmo assim (pode funcionar em alguns casos)
    // Se der erro, será removido automaticamente
    try {
      if (!cleanBaseUrl.includes('localhost') && !cleanBaseUrl.includes('127.0.0.1')) {
        preferenceData.auto_return = 'approved'
      }
    } catch (e) {
      // Ignorar erro
    }

    // Adicionar notification_url (mesmo com localhost, pode funcionar com ngrok ou similar)
    // O webhook é importante para atualizar o status automaticamente
    preferenceData.notification_url = `${cleanBaseUrl}/api/pagamentos/webhook`
    
    // Log para debug (remover em produção)
    console.log('Preferência criada:', JSON.stringify(preferenceData, null, 2))

    const response = await preference.create({ body: preferenceData })

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    })
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}


