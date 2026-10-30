import { useState } from 'react'
import { Fechamento } from './admin/Fechamento'
import { Membros } from './admin/Membros'
import { Configuracoes } from './admin/Configuracoes'

type Aba = 'fechamento' | 'membros' | 'configuracoes'

export function Admin() {
  const [aba, setAba] = useState<Aba>('fechamento')

  const abas: { valor: Aba; label: string }[] = [
    { valor: 'fechamento', label: '💰 Fechamento' },
    { valor: 'membros', label: '👥 Membros' },
    { valor: 'configuracoes', label: '⚙️ Configurações' }
  ]

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4 pb-24 lg:pb-6">
      <h1 className="text-xl font-bold text-slate-800">⚙️ Administração</h1>

      <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
        {abas.map((a) => (
          <button
            key={a.valor}
            onClick={() => setAba(a.valor)}
            className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-colors ${
              aba === a.valor ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'fechamento' && <Fechamento />}
      {aba === 'membros' && <Membros />}
      {aba === 'configuracoes' && <Configuracoes />}
    </div>
  )
}
