"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompanyLogo } from '@/components/Logo'
import styles from './login.module.css'

interface Empresa {
  id: string
  nome: string
}

export default function LoginPage() {
  const [isCadastro, setIsCadastro] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isCadastro) {
      fetchEmpresas()
    }
  }, [isCadastro])

  const fetchEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas')
      if (response.ok) {
        const data = await response.json()
        setEmpresas(data)
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isCadastro) {
        // Cadastro
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            empresaId: empresaId || undefined 
          })
        })

        const data = await res.json()

        if (res.ok) {
          setError('')
          alert('Cadastro realizado com sucesso! Faça login para continuar.')
          setIsCadastro(false)
          setEmail('')
          setPassword('')
          setEmpresaId('')
        } else {
          setError(data.error || 'Erro ao realizar cadastro')
        }
      } else {
        // Login
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        const data = await res.json()

        if (res.ok) {
          router.push('/')
          router.refresh()
        } else {
          setError(data.error || 'Usuário ou senha inválidos')
        }
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <div className={styles.logo}>
          <CompanyLogo size={94} className={styles.logoIcon} />
          <h2 className={styles.title}>Enterprise Dev Solutions</h2>
          <p className={styles.subtitle}>
            {isCadastro ? 'Crie sua conta' : 'Faça login para continuar'}
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {isCadastro && (
          <div className={styles.field}>
            <label htmlFor="empresa">Empresa</label>
            <select
              id="empresa"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              required={isCadastro}
              disabled={loading}
              className={styles.select}
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="email">Usuário</label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading && <span className={styles.loading}></span>}
          {loading 
            ? (isCadastro ? 'Cadastrando...' : 'Entrando...') 
            : (isCadastro ? 'Cadastrar' : 'Entrar')
          }
        </button>

        <button
          type="button"
          className={styles.cadastroButton}
          onClick={() => {
            setIsCadastro(!isCadastro)
            setError('')
            setEmail('')
            setPassword('')
            setEmpresaId('')
          }}
          disabled={loading}
        >
          {isCadastro ? 'Voltar para Login' : 'Cadastro'}
        </button>
      </form>
    </div>
  )
}
