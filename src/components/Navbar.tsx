import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkBase =
  'flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium py-2 flex-1 transition-colors'

const desktopLinkBase =
  'text-sm font-medium px-3 py-1.5 rounded-lg transition-colors'

export function Navbar() {
  const { isAdmin, usuario, logout } = useAuth()

  return (
    <>
      {/* Barra superior (mobile) — leve, só com título e botão de sair */}
      <header className="flex lg:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Equipe Parahy Baja 4x4" className="h-8 w-auto" />
          <span className="font-bold text-slate-800 text-sm">Parahybaja</span>
        </div>
        <button
          onClick={logout}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Sair
        </button>
      </header>

      {/* Topo (desktop) */}
      <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Equipe Parahy Baja 4x4" className="h-10 w-auto" />
          <span className="font-bold text-slate-800">Parahybaja</span>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${desktopLinkBase} ${isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            🏠 Início
          </NavLink>
          <NavLink to="/presenca" className={({ isActive }) => `${desktopLinkBase} ${isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            ✅ Presença
          </NavLink>
          <NavLink to="/calendario" className={({ isActive }) => `${desktopLinkBase} ${isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            📅 Calendário
          </NavLink>
          <NavLink to="/historico" className={({ isActive }) => `${desktopLinkBase} ${isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            📜 Histórico
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `${desktopLinkBase} ${isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              ⚙️ Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden xl:inline text-sm text-slate-500">
            {usuario?.nome} · <span className="text-primary-600">{usuario?.perfil === 'ADMIN' ? 'Administrador' : 'Membro'}</span>
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Navegação inferior (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex lg:hidden z-20 pb-safe">
        <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
          <span className="text-lg">🏠</span>Início
        </NavLink>
        <NavLink to="/presenca" className={({ isActive }) => `${linkBase} ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
          <span className="text-lg">✅</span>Presença
        </NavLink>
        <NavLink to="/calendario" className={({ isActive }) => `${linkBase} ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
          <span className="text-lg">📅</span>Calendário
        </NavLink>
        <NavLink to="/historico" className={({ isActive }) => `${linkBase} ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
          <span className="text-lg">📜</span>Histórico
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `${linkBase} ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
            <span className="text-lg">⚙️</span>Admin
          </NavLink>
        )}
      </nav>
    </>
  )
}
