import { useEffect, useState } from 'react'
import { obterDashboard } from '../../api/services'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/ProgressBar'
import type { Dashboard as DashboardType } from '../../types'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function Meta() {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')

    try {
      const dados = await obterDashboard()
      setDashboard(dados)
    } catch (error) {
      console.error('Erro ao carregar a meta:', error)
      setErro('Não foi possível carregar o progresso da meta.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const totalBruto = dashboard?.totalBruto ?? 0
  const percentual = dashboard?.percentualBruto ?? 0
  const metaSemanal = dashboard?.metaSemanal ?? 0

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          Acompanhamento da meta
        </h1>
        <p className="text-sm text-slate-500">
          Veja quanto já foi arrecadado nesta semana.
        </p>
      </div>

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : erro ? (
        <Card className="bg-red-50 border-red-200">
          <p className="text-sm text-red-600">{erro}</p>
          <button
            type="button"
            onClick={carregar}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
        </Card>
      ) : dashboard ? (
        <Card>
          <div className="space-y-5">
            <div>
              <p className="text-sm text-slate-500">
                Arrecadado na semana
              </p>
              <p className="text-3xl font-bold text-slate-800">
                {formatarMoeda(totalBruto)}
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                  Progresso da meta
                </span>
                <span className="text-sm font-bold text-primary-600">
                  {percentual.toFixed(1)}%
                </span>
              </div>

              <ProgressBar percentual={percentual} />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">
                Meta semanal
              </span>
              <span className="font-bold text-slate-800">
                {formatarMoeda(metaSemanal)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Falta para alcançar a meta
              </span>
              <span className="font-semibold text-slate-800">
                {formatarMoeda(
                  Math.max(metaSemanal - totalBruto, 0),
                )}
              </span>
            </div>

            {percentual >= 100 && (
              <div className="rounded-xl bg-green-50 px-3 py-3 text-center text-sm font-semibold text-green-700">
                Meta semanal alcançada! Parabéns à equipe!
              </div>
            )}

            <button
              type="button"
              onClick={carregar}
              className="w-full rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Atualizar progresso
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}