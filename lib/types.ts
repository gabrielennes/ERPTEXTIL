// Tipos para autenticação e sessão

export interface SessionData {
  email: string
  role: string
  name: string | null
}

export interface User {
  email: string
  name: string | null
  role: string
}


