'use client'

import { useState, useEffect, useMemo } from 'react'
import styles from './financeiro.module.css'
import { DollarSignIcon, PlusIcon, ClockIcon, DownloadIcon, FilterIcon, XIcon, CheckIcon } from '@/components/icons'
import MetricCard from '@/components/MetricCard'

interface Fornecedor {
  id: string
  nome: string
  cnpj: string | null
}

interface ContaAPagar {
  id: string
  fornecedorId: string
  fornecedor: Fornecedor
  cnpj: string | null
  valor: number
  parcelas: number
  valorTotal: number
  dataPagamento: string
  tipoTransacao: string
  chavePix: string | null
  contaBancaria: string | null
  codigoBarras: string | null
  pdfUrl: string | null
  pdfNome: string | null
  createdAt: string
}

export default function ContasAPagarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingContas, setLoadingContas] = useState(true)
  const [contas, setContas] = useState<ContaAPagar[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filtros, setFiltros] = useState({
    fornecedorId: '',
    cnpj: '',
    dataPagamentoInicial: '',
    dataPagamentoFinal: '',
    tipoTransacao: '',
  })
  const [formData, setFormData] = useState({
    fornecedorId: '',
    cnpj: '',
    valor: '',
    parcelas: '1',
    valorTotal: '',
    dataPagamento: '',
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
    fetchFornecedores()
  }, [])

  const fetchContas = async () => {
    try {
      setLoadingContas(true)
      const response = await fetch('/api/financeiro/contas-a-pagar')
      if (response.ok) {
        const data = await response.json()
        setContas(data)
      }
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error)
    } finally {
      setLoadingContas(false)
    }
  }

  const fetchFornecedores = async () => {
    try {
      const response = await fetch('/api/cadastro/fornecedor')
      if (response.ok) {
        const data = await response.json()
        setFornecedores(data)
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
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

      // Preencher CNPJ quando fornecedor for selecionado
      if (field === 'fornecedorId') {
        const fornecedor = fornecedores.find((f) => f.id === value)
        if (fornecedor) {
          newData.cnpj = fornecedor.cnpj || ''
        }
      }

      return newData
    })
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
      uploadFormData.append('tipo', 'contas-a-pagar')

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
      const response = await fetch('/api/financeiro/contas-a-pagar', {
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
        setMessage({ type: 'success', text: 'Conta a pagar cadastrada com sucesso!' })
        setIsModalOpen(false)
        resetForm()
        fetchContas()
        setTimeout(() => setMessage(null), 5000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao cadastrar conta a pagar' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      setMessage({ type: 'error', text: 'Erro ao cadastrar conta a pagar' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      fornecedorId: '',
      cnpj: '',
      valor: '',
      parcelas: '1',
      valorTotal: '',
      dataPagamento: '',
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

  const handleDarBaixa = async (contaId: string) => {
    if (!confirm('Tem certeza que deseja dar baixa nesta conta? Ela será movida para o extrato de movimentação financeira.')) {
      return
    }

    try {
      const response = await fetch(`/api/financeiro/contas-a-pagar/${contaId}/baixar`, {
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
      alert('Não há contas a pagar para exportar')
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
      'Fornecedor',
      'CNPJ',
      'Valor',
      'Parcelas',
      'Valor Total',
      'Data de Pagamento',
      'Tipo de Transação',
      'Chave PIX',
      'Conta Bancária',
      'Código de Barras',
    ]

    // Criar linhas do CSV (usar contas filtradas)
    const rows = contasFiltradas.map((conta) => [
      conta.fornecedor.nome,
      conta.cnpj || conta.fornecedor.cnpj || '',
      conta.valor.toString(),
      conta.parcelas.toString(),
      conta.valorTotal.toString(),
      formatDate(conta.dataPagamento),
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
    link.setAttribute('download', `contas_a_pagar_${hoje}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link)
      }
      URL.revokeObjectURL(url)
    }, 100)
  }

  // Filtrar contas
  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => {
      // Filtro por fornecedor
      if (filtros.fornecedorId && conta.fornecedorId !== filtros.fornecedorId) {
        return false
      }

      // Filtro por CNPJ
      if (filtros.cnpj) {
        const cnpjConta = (conta.cnpj || conta.fornecedor.cnpj || '').replace(/\D/g, '')
        const cnpjFiltro = filtros.cnpj.replace(/\D/g, '')
        if (!cnpjConta.includes(cnpjFiltro)) {
          return false
        }
      }

      // Filtro por data de pagamento (range)
      if (filtros.dataPagamentoInicial || filtros.dataPagamentoFinal) {
        const dataConta = new Date(conta.dataPagamento)
        dataConta.setHours(0, 0, 0, 0)
        
        if (filtros.dataPagamentoInicial) {
          const dataInicial = new Date(filtros.dataPagamentoInicial)
          dataInicial.setHours(0, 0, 0, 0)
          if (dataConta < dataInicial) {
            return false
          }
        }
        
        if (filtros.dataPagamentoFinal) {
          const dataFinal = new Date(filtros.dataPagamentoFinal)
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

  // Calcular métricas baseadas nas contas filtradas
  const metricas = useMemo(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const totalContasAPagar = contasFiltradas.reduce((acc, conta) => acc + conta.valorTotal, 0)
    
    const contasAtrasadas = contasFiltradas.filter((conta) => {
      const dataPagamento = new Date(conta.dataPagamento)
      dataPagamento.setHours(0, 0, 0, 0)
      return dataPagamento < hoje
    })
    
    const totalContasAtrasadas = contasAtrasadas.reduce((acc, conta) => acc + conta.valorTotal, 0)
    
    const totalGeral = totalContasAPagar

    return {
      totalContasAPagar,
      totalContasAtrasadas,
      totalGeral,
      quantidadeAtrasadas: contasAtrasadas.length,
    }
  }, [contasFiltradas])

  const limparFiltros = () => {
    setFiltros({
      fornecedorId: '',
      cnpj: '',
      dataPagamentoInicial: '',
      dataPagamentoFinal: '',
      tipoTransacao: '',
    })
  }

  const temFiltrosAtivos = filtros.fornecedorId || filtros.cnpj || filtros.dataPagamentoInicial || filtros.dataPagamentoFinal || filtros.tipoTransacao

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contas a Pagar</h1>
          <p className={styles.subtitle}>Gerencie suas contas a pagar</p>
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
          title="Contas a Pagar"
          value={formatCurrency(metricas.totalContasAPagar)}
          icon={<DollarSignIcon size={24} />}
          iconColor="#dc2626"
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
          icon={<DollarSignIcon size={24} />}
          iconColor="#1f2937"
        />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <DollarSignIcon size={24} color="#dc2626" />
            <h2 className={styles.cardTitle}>Contas a Pagar</h2>
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
              <label className={styles.filterLabel}>Fornecedor</label>
              <select
                className={styles.filterInput}
                value={filtros.fornecedorId}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fornecedorId: e.target.value }))}
              >
                <option value="">Todos</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>CNPJ</label>
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Buscar por CNPJ"
                value={filtros.cnpj}
                onChange={(e) => setFiltros((prev) => ({ ...prev, cnpj: e.target.value }))}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data de Pagamento (Inicial)</label>
              <input
                type="date"
                className={styles.filterInput}
                value={filtros.dataPagamentoInicial}
                onChange={(e) => setFiltros((prev) => ({ ...prev, dataPagamentoInicial: e.target.value }))}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data de Pagamento (Final)</label>
              <input
                type="date"
                className={styles.filterInput}
                value={filtros.dataPagamentoFinal}
                onChange={(e) => setFiltros((prev) => ({ ...prev, dataPagamentoFinal: e.target.value }))}
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
          <div className={styles.loading}>Carregando contas a pagar...</div>
        ) : contasFiltradas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{contas.length === 0 ? 'Nenhuma conta a pagar cadastrada ainda.' : 'Nenhuma conta encontrada com os filtros aplicados.'}</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>CNPJ</th>
                  <th>Valor</th>
                  <th>Parcelas</th>
                  <th>Valor Total</th>
                  <th>Data de Pagamento</th>
                  <th>Tipo de Transação</th>
                  <th>Detalhes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {contasFiltradas.map((conta) => (
                  <tr key={conta.id}>
                    <td className={styles.nomeCell}>{conta.fornecedor.nome}</td>
                    <td className={styles.cnpjCell}>
                      {conta.cnpj || conta.fornecedor.cnpj || '-'}
                    </td>
                    <td className={styles.valorCell}>{formatCurrency(conta.valor)}</td>
                    <td className={styles.parcelasCell}>{conta.parcelas}</td>
                    <td className={styles.valorTotalCell}>{formatCurrency(conta.valorTotal)}</td>
                    <td className={styles.dataCell}>{formatDate(conta.dataPagamento)}</td>
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
              <h2 className={styles.modalTitle}>Nova Conta a Pagar</h2>
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
                  <label className={styles.label}>Fornecedor *</label>
                  <select
                    className={styles.input}
                    value={formData.fornecedorId}
                    onChange={(e) => handleChange('fornecedorId', e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>CNPJ</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => handleChange('cnpj', e.target.value)}
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
                  <label className={styles.label}>Data de Pagamento *</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.dataPagamento}
                    onChange={(e) => handleChange('dataPagamento', e.target.value)}
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
