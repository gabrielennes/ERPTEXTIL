'use client'

interface TicketMedioChartProps {
  ticketMedio: number
  totalVendas: number
  quantidadeVendas: number
}

export default function TicketMedioChart({
  ticketMedio,
  totalVendas,
  quantidadeVendas,
}: TicketMedioChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Criar um gráfico visual simples mostrando o ticket médio
  const maxValor = Math.max(ticketMedio * 1.5, 100) // Para visualização
  const porcentagem = (ticketMedio / maxValor) * 100

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div
          style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#8b5cf6',
            marginBottom: '8px',
          }}
        >
          {formatCurrency(ticketMedio)}
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Ticket Médio
        </div>
      </div>

      {/* Barra de progresso visual */}
      <div
        style={{
          width: '100%',
          height: '40px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            width: `${porcentagem}%`,
            height: '100%',
            backgroundColor: '#8b5cf6',
            transition: 'width 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '12px',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          {porcentagem > 15 && formatCurrency(ticketMedio)}
        </div>
      </div>

      {/* Estatísticas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '24px',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            {quantidadeVendas}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Total de Vendas
          </div>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            {formatCurrency(totalVendas)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Valor Total
          </div>
        </div>
      </div>
    </div>
  )
}

