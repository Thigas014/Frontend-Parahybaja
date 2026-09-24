import { useEffect, useState } from 'react'
import { obterDashboard } from '../api/services'
import type { Dashboard as DashboardType } from '../types'
import { Card } from '../components/Card'
import { ProgressBar } from '../components/ProgressBar'
import { useAuth } from '../context/AuthContext'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string | null) {
  if (!iso) return 'Nenhuma venda ainda'
  // iso vem como yyyy-MM-dd (LocalDate do backend)
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataCurta(iso: string) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function hojeISO() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function Dashboard() {
  const { usuario } = useAuth()
  const [dados, setDados] = useState<DashboardType | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [visualizacao, setVisualizacao] = useState<'BRUTO' | 'LIQUIDO'>('BRUTO')

  async function carregar() {
    setCarregando(true)
    setErro('')

    try {
      const data = await obterDashboard()
      setDados(data)
    } catch (err: any) {
      const texto = err?.response?.data?.mensagem || 'Não foi possível carregar o painel. Verifique se o backend está no ar.'
      setErro(texto)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const hoje = hojeISO()
  const vendaHoje = dados?.proximaVendaMarcada === hoje

  const total = dados ? (visualizacao === 'BRUTO' ? dados.totalBruto : dados.totalLiquido) : 0
  const percentual = dados ? (visualizacao === 'BRUTO' ? dados.percentualBruto : dados.percentualLiquido) : 0

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Olá, {usuario?.nome?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500">
          {vendaHoje
            ? 'Hoje é dia de venda marcado — bora! 🎉'
            : dados?.proximaVendaMarcada
              ? `Próxima venda marcada: ${formatarData(dados.proximaVendaMarcada)}`
              : 'Nenhuma data de venda marcada no calendário ainda.'}
        </p>
      </div>

      {carregando ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : erro ? (
        <Card className="bg-red-50 border-red-200">
          <p className="text-sm text-red-600 font-medium">⚠️ {erro}</p>
          <button
            onClick={carregar}
            className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2"
          >
            Tentar de novo
          </button>
        </Card>
      ) : !dados ? null : (
        <>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-600">Meta da semana</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setVisualizacao('BRUTO')}
                  className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                    visualizacao === 'BRUTO' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Bruto
                </button>
                <button
                  onClick={() => setVisualizacao('LIQUIDO')}
                  className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                    visualizacao === 'LIQUIDO' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Líquido
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-2">
              Semana de {formatarDataCurta(dados.inicioSemana)} a {formatarDataCurta(dados.fimSemana)}
            </p>

            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl font-bold text-slate-800">{formatarMoeda(total)}</span>
              <span className="text-sm font-bold text-primary-600">{percentual.toFixed(1)}%</span>
            </div>
            <ProgressBar percentual={percentual} />
            <p className="text-xs text-slate-500 mt-2">Meta: {formatarMoeda(dados.metaSemanal)}</p>

            {visualizacao === 'LIQUIDO' && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>💧 Vendas + 🎁 Aportes/taxas</span>
                  <span className="font-medium text-slate-700">{formatarMoeda(dados.totalBruto)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>📦 Gastos de reposição</span>
                  <span className="font-medium">− {formatarMoeda(dados.totalDespesasSemana)}</span>
                </div>
              </div>
            )}

            {percentual >= 100 && (
              <div className="mt-3 bg-green-50 text-green-700 text-sm font-semibold rounded-xl px-3 py-2 text-center">
                🎉 Meta da semana batida! Parabéns à equipe!
              </div>
            )}
          </Card>

          <Card className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-violet-100 text-violet-600">
              🕒
            </div>
            <div>
              <p className="text-xs text-slate-500">Última venda registrada</p>
              <p className="text-lg font-bold text-slate-800">{formatarData(dados.dataUltimaVenda)}</p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
