'use client'

import { useState, useEffect } from 'react'
import styles from './cadastro.module.css'
import { UserIcon, DownloadIcon } from '@/components/icons'

interface Cliente {
  id: string
  nome: string
  cnpjCpf: string | null
  cep: string | null
  dataCadastro: string
  createdAt: string
}

export default function CadastroClientePage() {
  const [formData, setFormData] = useState({
    nome: '',
    cnpjCpf: '',
    cep: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true)
      const response = await fetch('/api/cadastro/cliente')
      if (response.ok) {
        const data = await response.json()
        setClientes(data)
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    } finally {
      setLoadingClientes(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
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

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) {
      return numbers
    }
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const handleCnpjCpfChange = (value: string) => {
    const formatted = formatCnpjCpf(value)
    handleChange('cnpjCpf', formatted)
  }

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value)
    handleChange('cep', formatted)
  }

  const handleExportCSV = () => {
    if (clientes.length === 0) {
      alert('Não há clientes para exportar')
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
      'CNPJ/CPF',
      'CEP',
      'Data de Cadastro',
    ]

    // Criar linhas do CSV
    const rows = clientes.map((cliente) => [
      cliente.nome,
      cliente.cnpjCpf || '',
      cliente.cep || '',
      new Date(cliente.dataCadastro).toLocaleDateString('pt-BR'),
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
    link.setAttribute('download', `clientes_${hoje}.csv`)
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
      const response = await fetch('/api/cadastro/cliente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cliente cadastrado com sucesso!' })
        setFormData({
          nome: '',
          cnpjCpf: '',
          cep: '',
        })
        // Recarregar lista de clientes
        fetchClientes()
        setTimeout(() => setMessage(null), 5000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao cadastrar cliente' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      setMessage({ type: 'error', text: 'Erro ao cadastrar cliente' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cadastro de Cliente</h1>
          <p className={styles.subtitle}>Cadastre novos clientes no sistema</p>
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
            <UserIcon size={24} color="#3b82f6" />
            <h2 className={styles.cardTitle}>Dados do Cliente</h2>
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
            <label className={styles.label}>CNPJ ou CPF</label>
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
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
          </button>
        </div>
      </form>

      {/* Lista de Clientes Cadastrados */}
      <div className={styles.clientesCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <UserIcon size={24} color="#3b82f6" />
            <h2 className={styles.cardTitle}>Clientes Cadastrados</h2>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={clientes.length === 0}
            className={styles.exportButton}
          >
            <DownloadIcon size={18} color="currentColor" />
            Exportar CSV
          </button>
        </div>

        {loadingClientes ? (
          <div className={styles.loading}>Carregando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhum cliente cadastrado ainda.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ/CPF</th>
                  <th>CEP</th>
                  <th>Data de Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className={styles.nomeCell}>{cliente.nome}</td>
                    <td className={styles.cnpjCpfCell}>
                      {cliente.cnpjCpf || '-'}
                    </td>
                    <td className={styles.cepCell}>
                      {cliente.cep || '-'}
                    </td>
                    <td className={styles.dataCell}>
                      {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}
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

