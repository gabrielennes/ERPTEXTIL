'use client'

import { MiniChartDownIcon } from '@/components/icons'

interface ProdutoEstoqueBaixo {
  id: string
  sku: string
  produtoNome: string
  estoque: number
  tamanho: string | null
  cor: string | null
}

interface LowStockListProps {
  produtos: ProdutoEstoqueBaixo[]
}

export default function LowStockList({ produtos }: LowStockListProps) {
  if (produtos.length === 0) {
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
          }}
        >
          <MiniChartDownIcon size={48} color="#ef4444" />
        </div>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>
          Nenhum produto com estoque baixo
        </div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Todos os produtos estão com estoque adequado
        </div>
      </div>
    )
  }

  const getEstoqueColor = (estoque: number) => {
    if (estoque === 0) return '#dc2626'
    if (estoque <= 2) return '#f59e0b'
    return '#ef4444'
  }

  const getEstoqueLabel = (estoque: number) => {
    if (estoque === 0) return 'Esgotado'
    if (estoque <= 2) return 'Crítico'
    return 'Baixo'
  }

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {produtos.map((produto) => (
          <div
            key={produto.id}
            style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: `1px solid ${getEstoqueColor(produto.estoque)}20`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '4px',
                }}
              >
                {produto.produtoNome}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                SKU: {produto.sku}
                {produto.tamanho && ` • Tamanho: ${produto.tamanho}`}
                {produto.cor && ` • Cor: ${produto.cor}`}
              </div>
            </div>
            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: getEstoqueColor(produto.estoque),
                  marginBottom: '4px',
                }}
              >
                {produto.estoque}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: getEstoqueColor(produto.estoque),
                  fontWeight: '500',
                  textTransform: 'uppercase',
                }}
              >
                {getEstoqueLabel(produto.estoque)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

