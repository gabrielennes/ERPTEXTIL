'use client'

import { useState, useEffect } from 'react'
import styles from './cadastro.module.css'
import { TruckIcon, DownloadIcon } from '@/components/icons'

interface Fornecedor {
  id: string
  nome: string
  cnpj: string | null
  cep: string | null
  dataCadastro: string
  createdAt: string
}

export default function CadastroFornecedorPage() {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    cep: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingFornecedores, setLoadingFornecedores] = useState(true)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchFornecedores()
  }, [])

  const fetchFornecedores = async () => {
    try {
      setLoadingFornecedores(true)
      const response = await fetch('/api/cadastro/fornecedor')
      if (response.ok) {
        const data = await response.json()
        setFornecedores(data)
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
    } finally {
      setLoadingFornecedores(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length > 14) {
      return numbers.slice(0, 14)
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4')
      .replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
      .replace(/(\d{2})(\d{3})/, '$1.$2')
      .replace(/(\d{2})/, '$1')
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) {
      return numbers
    }
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const handleCnpjChange = (value: string) => {
    const formatted = formatCnpj(value)
    handleChange('cnpj', formatted)
  }

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value)
    handleChange('cep', formatted)
  }

  const handleExportCSV = () => {
    if (fornecedores.length === 0) {
      alert('Não há fornecedores para exportar')
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
      'Nome',
      'CNPJ',
      'CEP',
      'Data de Cadastro',
    ]

    // Criar linhas do CSV
    const rows = fornecedores.map((fornecedor) => [
      fornecedor.nome,
      fornecedor.cnpj || '',
      fornecedor.cep || '',
      new Date(fornecedor.dataCadastro).toLocaleDateString('pt-BR'),
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
    link.setAttribute('download', `fornecedores_${hoje}.csv`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/cadastro/fornecedor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Fornecedor cadastrado com sucesso!' })
        setFormData({
          nome: '',
          cnpj: '',
          cep: '',
        })
        // Recarregar lista de fornecedores
        fetchFornecedores()
        setTimeout(() => setMessage(null), 5000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao cadastrar fornecedor' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      setMessage({ type: 'error', text: 'Erro ao cadastrar fornecedor' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cadastro de Fornecedor</h1>
          <p className={styles.subtitle}>Cadastre novos fornecedores no sistema</p>
        </div>
      </div>

      {message && (
        <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <TruckIcon size={24} color="#059669" />
            <h2 className={styles.cardTitle}>Dados do Fornecedor</h2>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Digite o nome completo"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>CNPJ</label>
            <input
              type="text"
              className={styles.input}
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => handleCnpjChange(e.target.value)}
              maxLength={18}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>CEP</label>
            <input
              type="text"
              className={styles.input}
              placeholder="00000-000"
              value={formData.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              maxLength={9}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Data de Cadastro</label>
            <input
              type="text"
              className={styles.input}
              value={new Date().toLocaleDateString('pt-BR')}
              disabled
              style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Fornecedor'}
          </button>
        </div>
      </form>

      {/* Lista de Fornecedores Cadastrados */}
      <div className={styles.clientesCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <TruckIcon size={24} color="#059669" />
            <h2 className={styles.cardTitle}>Fornecedores Cadastrados</h2>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={fornecedores.length === 0}
            className={styles.exportButton}
          >
            <DownloadIcon size={18} color="currentColor" />
            Exportar CSV
          </button>
        </div>

        {loadingFornecedores ? (
          <div className={styles.loading}>Carregando fornecedores...</div>
        ) : fornecedores.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhum fornecedor cadastrado ainda.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>CEP</th>
                  <th>Data de Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((fornecedor) => (
                  <tr key={fornecedor.id}>
                    <td className={styles.nomeCell}>{fornecedor.nome}</td>
                    <td className={styles.cnpjCpfCell}>
                      {fornecedor.cnpj || '-'}
                    </td>
                    <td className={styles.cepCell}>
                      {fornecedor.cep || '-'}
                    </td>
                    <td className={styles.dataCell}>
                      {new Date(fornecedor.dataCadastro).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

