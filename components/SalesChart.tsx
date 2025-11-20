'use client'

interface SalesChartProps {
  data: { [key: number]: number }
}

export default function SalesChart({ data }: SalesChartProps) {
  // Obter todos os dias do mês atual
  const hoje = new Date()
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  // Encontrar o valor máximo para normalizar as barras
  const valores = Object.values(data)
  const maxValor = Math.max(...valores, 1) // Mínimo 1 para evitar divisão por zero

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
        {/* Eixos */}
        <line
          x1="40"
          y1="260"
          x2="760"
          y2="260"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <line
          x1="40"
          y1="260"
          x2="40"
          y2="20"
          stroke="#e5e7eb"
          strokeWidth="2"
        />

        {/* Barras do gráfico */}
        {dias.map((dia, index) => {
          const valor = data[dia] || 0
          const altura = (valor / maxValor) * 220
          const x = 40 + (index * (720 / diasNoMes)) + (720 / diasNoMes / 2) - 8
          const y = 260 - altura

          return (
            <g key={dia}>
              <rect
                x={x}
                y={y}
                width="16"
                height={altura}
                fill="#10b981"
                rx="2"
                opacity={valor > 0 ? 0.8 : 0.2}
              />
              {/* Valor no topo da barra */}
              {valor > 0 && (
                <text
                  x={x + 8}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                  fontWeight="500"
                >
                  {formatCurrency(valor)}
                </text>
              )}
              {/* Label do dia */}
              <text
                x={x + 8}
                y="275"
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {dia}
              </text>
            </g>
          )
        })}

        {/* Linha de tendência */}
        {dias.length > 1 && (
          <polyline
            points={dias
              .map((dia, index) => {
                const valor = data[dia] || 0
                const altura = (valor / maxValor) * 220
                const x = 40 + (index * (720 / diasNoMes)) + (720 / diasNoMes / 2)
                const y = 260 - altura
                return `${x},${y}`
              })
              .join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.5"
          />
        )}
      </svg>
    </div>
  )
}

