'use client'

import { useState, useEffect, useMemo } from 'react'
import styles from './financeiro.module.css'
import { TrendingUpIcon, PlusIcon, ClockIcon, DownloadIcon, FilterIcon, XIcon, CheckIcon } from '@/components/icons'
import MetricCard from '@/components/MetricCard'

interface Cliente {
  id: string
  nome: string
  cnpjCpf: string | null
}

interface ContaAReceber {
  id: string
  clienteId: string
  cliente: Cliente
  cnpjCpf: string | null
  valor: number
  parcelas: number
  valorTotal: number
  dataRecebimento: string
  tipoTransacao: string
  chavePix: string | null
  contaBancaria: string | null
  codigoBarras: string | null
  pdfUrl: string | null
  pdfNome: string | null
  createdAt: string
}

export default function ContasAReceberPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingContas, setLoadingContas] = useState(true)
  const [contas, setContas] = useState<ContaAReceber[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filtros, setFiltros] = useState({
    clienteId: '',
    cnpjCpf: '',
    dataRecebimentoInicial: '',
    dataRecebimentoFinal: '',
    tipoTransacao: '',
  })
  const [formData, setFormData] = useState({
    clienteId: '',
    cnpjCpf: '',
    valor: '',
    parcelas: '1',
    valorTotal: '',
    dataRecebimento: '',
    tipoTransacao: '',
    chavePix: '',
    contaBancaria: '',
    codigoBarras: '',
    pdfFile: null as File | null,
    pdfUrl: '',
    pdfNome: '',
  })

  useEffect(() => {
    fetchContas()
    fetchClientes()
  }, [])

  const fetchContas = async () => {
    try {
      setLoadingContas(true)
      const response = await fetch('/api/financeiro/contas-a-receber')
      if (response.ok) {
        const data = await response.json()
        setContas(data)
      }
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error)
    } finally {
      setLoadingContas(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/cadastro/cliente')
      if (response.ok) {
        const data = await response.json()
        setClientes(data)
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  const formatCnpjCpf = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Se tiver 11 ou menos dígitos, formata como CPF
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
        .replace(/(\d{3})(\d{3})/, '$1.$2')
        .replace(/(\d{3})/, '$1')
    } else {
      // Formata como CNPJ
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4')
        .replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
        .replace(/(\d{2})(\d{3})/, '$1.$2')
        .replace(/(\d{2})/, '$1')
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      
      // Calcular valor total quando valor ou parcelas mudarem
      if (field === 'valor' || field === 'parcelas') {
        const valor = parseFloat(newData.valor) || 0
        const parcelas = parseInt(newData.parcelas) || 1
        newData.valorTotal = (valor * parcelas).toFixed(2)
      }

      // Limpar campos condicionais quando tipo de transação mudar
      if (field === 'tipoTransacao') {
        newData.chavePix = ''
        newData.contaBancaria = ''
        newData.codigoBarras = ''
      }

      // Preencher CNPJ/CPF quando cliente for selecionado
      if (field === 'clienteId') {
        const cliente = clientes.find((c) => c.id === value)
        if (cliente) {
          newData.cnpjCpf = cliente.cnpjCpf || ''
        }
      }

      return newData
    })
  }

  const handleCnpjCpfChange = (value: string) => {
    const formatted = formatCnpjCpf(value)
    handleChange('cnpjCpf', formatted)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Apenas arquivos PDF são permitidos' })
      setTimeout(() => setMessage(null), 5000)
      return
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Arquivo muito grande. Tamanho máximo: 10MB' })
      setTimeout(() => setMessage(null), 5000)
      return
    }

    setFormData((prev) => ({ ...prev, pdfFile: file, pdfNome: file.name }))

    // Fazer upload do arquivo
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('tipo', 'contas-a-receber')

      const uploadResponse = await fetch('/api/financeiro/upload-pdf', {
        method: 'POST',
        body: uploadFormData,
      })

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json()
        setFormData((prev) => ({
          ...prev,
          pdfUrl: uploadData.url,
          pdfNome: uploadData.nome,
        }))
      } else {
        const error = await uploadResponse.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao fazer upload do PDF' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      setMessage({ type: 'error', text: 'Erro ao fazer upload do PDF' })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/financeiro/contas-a-receber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pdfFile: undefined, // Não enviar o arquivo, apenas a URL
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Conta a receber cadastrada com sucesso!' })
        setIsModalOpen(false)
        resetForm()
        fetchContas()
        setTimeout(() => setMessage(null), 5000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao cadastrar conta a receber' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      setMessage({ type: 'error', text: 'Erro ao cadastrar conta a receber' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      clienteId: '',
      cnpjCpf: '',
      valor: '',
      parcelas: '1',
      valorTotal: '',
      dataRecebimento: '',
      tipoTransacao: '',
      chavePix: '',
      contaBancaria: '',
      codigoBarras: '',
      pdfFile: null,
      pdfUrl: '',
      pdfNome: '',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Filtrar contas
  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => {
      // Filtro por cliente
      if (filtros.clienteId && conta.clienteId !== filtros.clienteId) {
        return false
      }

      // Filtro por CNPJ/CPF
      if (filtros.cnpjCpf) {
        const cnpjCpfConta = (conta.cnpjCpf || conta.cliente.cnpjCpf || '').replace(/\D/g, '')
        const cnpjCpfFiltro = filtros.cnpjCpf.replace(/\D/g, '')
        if (!cnpjCpfConta.includes(cnpjCpfFiltro)) {
          return false
        }
      }

      // Filtro por data de recebimento (range)
      if (filtros.dataRecebimentoInicial || filtros.dataRecebimentoFinal) {
        const dataConta = new Date(conta.dataRecebimento)
        dataConta.setHours(0, 0, 0, 0)
        
        if (filtros.dataRecebimentoInicial) {
          const dataInicial = new Date(filtros.dataRecebimentoInicial)
          dataInicial.setHours(0, 0, 0, 0)
          if (dataConta < dataInicial) {
            return false
          }
        }
        
        if (filtros.dataRecebimentoFinal) {
          const dataFinal = new Date(filtros.dataRecebimentoFinal)
          dataFinal.setHours(23, 59, 59, 999)
          if (dataConta > dataFinal) {
            return false
          }
        }
      }

      // Filtro por tipo de transação
      if (filtros.tipoTransacao && conta.tipoTransacao !== filtros.tipoTransacao) {
        return false
      }

      return true
    })
  }, [contas, filtros])

  const handleDarBaixa = async (contaId: string) => {
    if (!confirm('Tem certeza que deseja dar baixa nesta conta? Ela será movida para o extrato de movimentação financeira.')) {
      return
    }

    try {
      const response = await fetch(`/api/financeiro/contas-a-receber/${contaId}/baixar`, {
        method: 'PATCH',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Conta dada baixa com sucesso!' })
        fetchContas()
        setTimeout(() => setMessage(null), 5000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao dar baixa na conta' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao dar baixa:', error)
      setMessage({ type: 'error', text: 'Erro ao dar baixa na conta' })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleExportCSV = () => {
    if (contasFiltradas.length === 0) {
      alert('Não há contas a receber para exportar')
      return
    }

    const escapeCSV = (value: string | number | null): string => {
      if (value === null || value === undefined) return '""'
      const str = String(value)
      const escaped = str.replace(/"/g, '""')
      return `"${escaped}"`
    }

    const separator = ';'
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')

    // Cabeçalhos do CSV
    const headers = [
      'Cliente',
      'CNPJ/CPF',
      'Valor',
      'Parcelas',
      'Valor Total',
      'Data de Recebimento',
      'Tipo de Transação',
      'Chave PIX',
      'Conta Bancária',
      'Código de Barras',
    ]

    // Criar linhas do CSV (usar contas filtradas)
    const rows = contasFiltradas.map((conta) => [
      conta.cliente.nome,
      conta.cnpjCpf || conta.cliente.cnpjCpf || '',
      conta.valor.toString(),
      conta.parcelas.toString(),
      conta.valorTotal.toString(),
      formatDate(conta.dataRecebimento),
      conta.tipoTransacao,
      conta.chavePix || '',
      conta.contaBancaria || '',
      conta.codigoBarras || '',
    ])

    // Converter para formato CSV
    const csvContent = [
      headers.map(escapeCSV).join(separator),
      ...rows.map((row) => row.map(escapeCSV).join(separator)),
    ].join('\n')

    // Adicionar BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

    // Criar link de download
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `contas_a_receber_${hoje}.csv`)
    link.style.visibility = 'hidden'
    link.style.position = 'absolute'
    link.style.top = '-9999px'
    
    if (document.body) {
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        try {
          if (link.parentNode && document.body.contains(link)) {
            document.body.removeChild(link)
          }
        } catch (e) {
          // Ignorar erro se o elemento já foi removido
        }
        try {
          URL.revokeObjectURL(url)
        } catch (e) {
          // Ignorar erro se a URL já foi revogada
        }
      }, 100)
    }
  }

  // Calcular métricas baseadas nas contas filtradas
  const metricas = useMemo(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const totalContasAReceber = contasFiltradas.reduce((acc, conta) => acc + conta.valorTotal, 0)
    
    const contasAtrasadas = contasFiltradas.filter((conta) => {
      const dataRecebimento = new Date(conta.dataRecebimento)
      dataRecebimento.setHours(0, 0, 0, 0)
      return dataRecebimento < hoje
    })
    
    const totalContasAtrasadas = contasAtrasadas.reduce((acc, conta) => acc + conta.valorTotal, 0)
    
    const totalGeral = totalContasAReceber

    return {
      totalContasAReceber,
      totalContasAtrasadas,
      totalGeral,
      quantidadeAtrasadas: contasAtrasadas.length,
    }
  }, [contasFiltradas])

  const limparFiltros = () => {
    setFiltros({
      clienteId: '',
      cnpjCpf: '',
      dataRecebimentoInicial: '',
      dataRecebimentoFinal: '',
      tipoTransacao: '',
    })
  }

  const temFiltrosAtivos = filtros.clienteId || filtros.cnpjCpf || filtros.dataRecebimentoInicial || filtros.dataRecebimentoFinal || filtros.tipoTransacao

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contas a Receber</h1>
          <p className={styles.subtitle}>Gerencie suas contas a receber</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.addButton}
        >
          <PlusIcon size={18} color="currentColor" />
          Adicionar
        </button>
      </div>

      {message && (
        <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
          {message.text}
        </div>
      )}

      {/* Cards de Métricas */}
      <div className={styles.metricsGrid}>
        <MetricCard
          title="Contas a Receber"
          value={formatCurrency(metricas.totalContasAReceber)}
          icon={<TrendingUpIcon size={24} />}
          iconColor="#059669"
        />
        <MetricCard
          title="Contas Atrasadas"
          value={formatCurrency(metricas.totalContasAtrasadas)}
          icon={<ClockIcon size={24} />}
          iconColor="#ef4444"
        />
        <MetricCard
          title="Total"
          value={formatCurrency(metricas.totalGeral)}
          icon={<TrendingUpIcon size={24} />}
          iconColor="#1f2937"
        />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <TrendingUpIcon size={24} color="#059669" />
            <h2 className={styles.cardTitle}>Contas a Receber</h2>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={contasFiltradas.length === 0}
            className={styles.exportButton}
          >
            <DownloadIcon size={18} color="currentColor" />
            Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersHeader}>
            <div className={styles.filtersTitle}>
              <FilterIcon size={18} color="#6b7280" />
              <span>Filtros</span>
            </div>
            {temFiltrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className={styles.clearFiltersButton}
              >
                <XIcon size={14} color="currentColor" />
                Limpar Filtros
              </button>
            )}
          </div>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Cliente</label>
              <select
                className={styles.filterInput}
                value={filtros.clienteId}
                onChange={(e) => setFiltros((prev) => ({ ...prev, clienteId: e.target.value }))}
              >
                <option value="">Todos</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>CNPJ/CPF</label>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Buscar por CNPJ/CPF"
                value={filtros.cnpjCpf}
                onChange={(e) => setFiltros((prev) => ({ ...prev, cnpjCpf: e.target.value }))}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data de Recebimento (Inicial)</label>
              <input
                type="date"
                className={styles.filterInput}
                value={filtros.dataRecebimentoInicial}
                onChange={(e) => setFiltros((prev) => ({ ...prev, dataRecebimentoInicial: e.target.value }))}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data de Recebimento (Final)</label>
              <input
                type="date"
                className={styles.filterInput}
                value={filtros.dataRecebimentoFinal}
                onChange={(e) => setFiltros((prev) => ({ ...prev, dataRecebimentoFinal: e.target.value }))}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Tipo de Transação</label>
              <select
                className={styles.filterInput}
                value={filtros.tipoTransacao}
                onChange={(e) => setFiltros((prev) => ({ ...prev, tipoTransacao: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="PIX">PIX</option>
                <option value="TED">TED</option>
                <option value="DOC">DOC</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
          </div>
        </div>

        {loadingContas ? (
          <div className={styles.loading}>Carregando contas a receber...</div>
        ) : contasFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{contas.length === 0 ? 'Nenhuma conta a receber cadastrada ainda.' : 'Nenhuma conta encontrada com os filtros aplicados.'}</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>CNPJ/CPF</th>
                  <th>Valor</th>
                  <th>Parcelas</th>
                  <th>Valor Total</th>
                  <th>Data de Recebimento</th>
                  <th>Tipo de Transação</th>
                  <th>Detalhes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {contasFiltradas.map((conta) => (
                  <tr key={conta.id}>
                    <td className={styles.nomeCell}>{conta.cliente.nome}</td>
                    <td className={styles.cnpjCell}>
                      {conta.cnpjCpf || conta.cliente.cnpjCpf || '-'}
                    </td>
                    <td className={styles.valorCell}>{formatCurrency(conta.valor)}</td>
                    <td className={styles.parcelasCell}>{conta.parcelas}</td>
                    <td className={styles.valorTotalCell}>{formatCurrency(conta.valorTotal)}</td>
                    <td className={styles.dataCell}>{formatDate(conta.dataRecebimento)}</td>
                    <td className={styles.tipoCell}>{conta.tipoTransacao}</td>
                    <td className={styles.detalhesCell}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {conta.tipoTransacao === 'PIX' && conta.chavePix && (
                          <span>PIX: {conta.chavePix}</span>
                        )}
                        {(conta.tipoTransacao === 'TED' || conta.tipoTransacao === 'DOC') && conta.contaBancaria && (
                          <span>Conta: {conta.contaBancaria}</span>
                        )}
                        {conta.tipoTransacao === 'Cartão de Crédito' && (
                          <span>CC</span>
                        )}
                        {conta.tipoTransacao === 'Boleto' && conta.codigoBarras && (
                          <span>Código: {conta.codigoBarras}</span>
                        )}
                        {conta.pdfUrl && (
                          <a
                            href={conta.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pdfLink}
                          >
                            📄 {conta.pdfNome || 'Ver PDF'}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className={styles.acoesCell}>
                      <button
                        type="button"
                        onClick={() => handleDarBaixa(conta.id)}
                        className={styles.baixarButton}
                        title="Dar baixa na conta"
                      >
                        <CheckIcon size={16} color="currentColor" />
                        Dar Baixa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nova Conta a Receber</h2>
              <button
                className={styles.modalCloseButton}
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cliente *</label>
                  <select
                    className={styles.input}
                    value={formData.clienteId}
                    onChange={(e) => handleChange('clienteId', e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>CNPJ/CPF</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="00.000.000/0000-00 ou 000.000.000-00"
                    value={formData.cnpjCpf}
                    onChange={(e) => handleCnpjCpfChange(e.target.value)}
                    maxLength={18}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.input}
                    placeholder="0.00"
                    value={formData.valor}
                    onChange={(e) => handleChange('valor', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Parcelas *</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    placeholder="1"
                    value={formData.parcelas}
                    onChange={(e) => handleChange('parcelas', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Valor Total</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.valorTotal ? formatCurrency(parseFloat(formData.valorTotal)) : ''}
                    disabled
                    style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Data de Recebimento *</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.dataRecebimento}
                    onChange={(e) => handleChange('dataRecebimento', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de Transação *</label>
                  <select
                    className={styles.input}
                    value={formData.tipoTransacao}
                    onChange={(e) => handleChange('tipoTransacao', e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="PIX">PIX</option>
                    <option value="TED">TED</option>
                    <option value="DOC">DOC</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>

                {/* Campos condicionais */}
                {formData.tipoTransacao === 'PIX' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Chave PIX *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Digite a chave PIX"
                      value={formData.chavePix}
                      onChange={(e) => handleChange('chavePix', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                {(formData.tipoTransacao === 'TED' || formData.tipoTransacao === 'DOC') && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Conta Bancária *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Digite a conta bancária"
                      value={formData.contaBancaria}
                      onChange={(e) => handleChange('contaBancaria', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                {formData.tipoTransacao === 'Boleto' && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Código de Barras *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Digite o código de barras"
                      value={formData.codigoBarras}
                      onChange={(e) => handleChange('codigoBarras', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Campo de Upload de PDF */}
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Anexar PDF (Opcional)</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  {formData.pdfNome && (
                    <div className={styles.pdfInfo}>
                      <span className={styles.pdfName}>📄 {formData.pdfNome}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            pdfFile: null,
                            pdfUrl: '',
                            pdfNome: '',
                          }))
                        }}
                        className={styles.removePdfButton}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
