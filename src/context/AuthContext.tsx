import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { login as loginApi } from '../api/services'
import type { Perfil } from '../types'

interface UsuarioLogado {
  id: number
  nome: string
  email: string
  perfil: Perfil
}

interface AuthContextValue {
  usuario: UsuarioLogado | null
  isAdmin: boolean
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/** Lê o campo "exp" (data de expiração, em segundos) de dentro de um JWT, sem precisar de biblioteca. */
function obterExpiracaoDoToken(token: string): number | null {
  try {
    const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(payloadBase64))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null // exp vem em segundos, convertendo pra ms
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function limparSessao() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  /** Agenda o logout automático pro exato momento em que o token expira (enquanto o app estiver aberto). */
  function agendarLogoutAutomatico(token: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const expiraEm = obterExpiracaoDoToken(token)
    if (!expiraEm) return

    const restante = expiraEm - Date.now()
    if (restante <= 0) {
      limparSessao()
      return
    }

    // setTimeout tem um limite máximo (~24 dias); como a sessão dura poucas
    // horas, isso nunca chega perto do limite, mas o guard evita problemas.
    timeoutRef.current = setTimeout(() => {
      limparSessao()
    }, Math.min(restante, 2147000000))
  }

  useEffect(() => {
    const salvo = localStorage.getItem('usuario')
    const token = localStorage.getItem('token')

    if (salvo && token) {
      const expiraEm = obterExpiracaoDoToken(token)
      if (expiraEm && expiraEm <= Date.now()) {
        // Token já vencido (ex: o computador ficou fechado por mais tempo que a sessão dura).
        limparSessao()
      } else {
        setUsuario(JSON.parse(salvo))
        agendarLogoutAutomatico(token)
      }
    }

    setCarregando(false)

    // Em celular, o navegador pode "congelar" o setTimeout enquanto o app
    // fica em segundo plano por muito tempo. Pra cobrir esse caso, confere a
    // expiração de novo sempre que o app volta a ficar visível.
    function conferirAoVoltarVisivel() {
      if (document.visibilityState !== 'visible') return
      const tokenAtual = localStorage.getItem('token')
      if (!tokenAtual) return
      const expiraEm = obterExpiracaoDoToken(tokenAtual)
      if (expiraEm && expiraEm <= Date.now()) {
        limparSessao()
      }
    }

    document.addEventListener('visibilitychange', conferirAoVoltarVisivel)
    return () => document.removeEventListener('visibilitychange', conferirAoVoltarVisivel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(email: string, senha: string) {
    const resposta = await loginApi(email, senha)
    const usuarioLogado: UsuarioLogado = {
      id: resposta.id,
      nome: resposta.nome,
      email: resposta.email,
      perfil: resposta.perfil as Perfil
    }
    localStorage.setItem('token', resposta.token)
    localStorage.setItem('usuario', JSON.stringify(usuarioLogado))
    setUsuario(usuarioLogado)
    agendarLogoutAutomatico(resposta.token)
  }

  function logout() {
    limparSessao()
  }

  return (
    <AuthContext.Provider value={{ usuario, isAdmin: usuario?.perfil === 'ADMIN', carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
