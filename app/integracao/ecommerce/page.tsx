'use client'

import { useState, useEffect } from 'react'
import styles from './integracao.module.css'
import { ShoppingBagIcon } from '@/components/icons'

interface IntegracaoConfig {
  ecommerce: {
    url: string
    key: string
  }
  bling: {
    url: string
    key: string
  }
  tiny: {
    url: string
    key: string
  }
}

export default function IntegracaoEcommercePage() {
  const [config, setConfig] = useState<IntegracaoConfig>({
    ecommerce: { url: '', key: '' },
    bling: { url: '', key: '' },
    tiny: { url: '', key: '' },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/integracao/ecommerce')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/integracao/ecommerce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao salvar configurações' })
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleChange = (service: 'ecommerce' | 'bling' | 'tiny', field: 'url' | 'key', value: string) => {
    setConfig((prev) => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Integração Ecommerce</h1>
          <p className={styles.subtitle}>Configure as integrações com plataformas externas</p>
        </div>
      </div>

      {message && (
        <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
          {message.text}
        </div>
      )}

      {/* Ecommerce */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <ShoppingBagIcon size={24} color="#3b82f6" />
            <h2 className={styles.cardTitle}>Ecommerce</h2>
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>URL da Plataforma</label>
            <input
              type="text"
              className={styles.input}
              placeholder="https://api.ecommerce.com.br"
              value={config.ecommerce.url}
              onChange={(e) => handleChange('ecommerce', 'url', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>API Key</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Digite a chave da API"
              value={config.ecommerce.key}
              onChange={(e) => handleChange('ecommerce', 'key', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bling */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <ShoppingBagIcon size={24} color="#059669" />
            <h2 className={styles.cardTitle}>Bling</h2>
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>URL da API</label>
            <input
              type="text"
              className={styles.input}
              placeholder="https://www.bling.com.br/Api/v3"
              value={config.bling.url}
              onChange={(e) => handleChange('bling', 'url', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>API Key</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Digite a chave da API"
              value={config.bling.key}
              onChange={(e) => handleChange('bling', 'key', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tiny */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleWrapper}>
            <ShoppingBagIcon size={24} color="#8b5cf6" />
            <h2 className={styles.cardTitle}>Tiny</h2>
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>URL da API</label>
            <input
              type="text"
              className={styles.input}
              placeholder="https://api.tiny.com.br"
              value={config.tiny.url}
              onChange={(e) => handleChange('tiny', 'url', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>API Key</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Digite a chave da API"
              value={config.tiny.key}
              onChange={(e) => handleChange('tiny', 'key', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

