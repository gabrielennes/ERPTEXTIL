'use client'

import { ShoppingCartIcon } from '@/components/icons'

interface Venda {
  id: string
  numero?: string | null
  total: number
  parcelas?: number
  data: string
  produtos: Array<{
    nome: string
    quantidade: number
    precoUnitario: number
  }>
}

interface RecentSalesTableProps {
  vendas: Venda[]
}

export default function RecentSalesTable({ vendas }: RecentSalesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (vendas.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#6b7280',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#059669',
          }}
        >
          <ShoppingCartIcon size={48} color="#059669" />
        </div>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>
          Nenhuma venda realizada ainda
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          As vendas aparecerão aqui quando forem realizadas
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th
              style={{
                padding: '12px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
              }}
            >
              N° Pedido
            </th>
            <th
              style={{
                padding: '12px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
              }}
            >
              Produto
            </th>
            <th
              style={{
                padding: '12px',
                textAlign: 'right',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
              }}
            >
              Valor
            </th>
            <th
              style={{
                padding: '12px',
                textAlign: 'right',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase',
              }}
            >
              Data
            </th>
          </tr>
        </thead>
        <tbody>
          {vendas.map((venda) => (
            <tr
              key={venda.id}
              style={{
                borderBottom: '1px solid #e5e7eb',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <td
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                }}
              >
                {venda.numero ? venda.numero.replace(/^PDV-?/i, '') : venda.id}
              </td>
              <td
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  color: '#374151',
                }}
              >
                {venda.produtos.length > 0 ? (
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {venda.produtos[0].nome}
                    </div>
                    {venda.produtos.length > 1 && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px',
                        }}
                      >
                        +{venda.produtos.length - 1} outro(s) produto(s)
                      </div>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#10b981',
                  textAlign: 'right',
                }}
              >
                {formatCurrency(venda.total)}
                {venda.parcelas && venda.parcelas > 1 && (
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {venda.parcelas}x no cartão
                  </div>
                )}
              </td>
              <td
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  color: '#6b7280',
                  textAlign: 'right',
                }}
              >
                {formatDate(venda.data)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

