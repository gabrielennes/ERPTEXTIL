import { cookies } from 'next/headers'
import type { SessionData } from './types'

/**
 * Valida e retorna os dados da sessão do cookie
 * @returns SessionData se válido, null caso contrário
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const sessionCookie = cookies().get('session')?.value

    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie, 'base64').toString()
    ) as SessionData

    // Validar estrutura básica
    if (!sessionData.email || !sessionData.role) {
      return null
    }

    return sessionData
  } catch (error) {
    console.error('Erro ao validar sessão:', error)
    return null
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

/**
 * Verifica se o usuário tem uma role específica
 */
export async function hasRole(role: string): Promise<boolean> {
  const session = await getSession()
  return session?.role === role
}

/**
 * Verifica se o usuário é admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}















