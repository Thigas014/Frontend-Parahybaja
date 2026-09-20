import { useEffect, useMemo, useState } from 'react'
import { listarDiasDeVenda, listarPresencas, listarVendas } from '../api/services'
import type { DiaDeVenda, Presenca, Venda } from '../types'
import { Card } from '../components/Card'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function hojeISO() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

const nomesMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

type Visao = 'semana' | 'mes'

function rotuloPresenca(p: Presenca) {
  if (p.presente === true) return { texto: 'Presente', cor: 'text-green-600' }
  if (p.presente === false && p.justificativa) return { texto: 'Justificou ausência', cor: 'text-amber-600' }
  if (p.presente === false) return { texto: 'Faltou (sem justificativa)', cor: 'text-red-500' }
  return { texto: 'Pendente', cor: 'text-slate-400' }
}

export function Historico() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [dias, setDias] = useState<DiaDeVenda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [visao, setVisao] = useState<Visao>('semana')

  const [aberto, setAberto] = useState<string | null>(null)
  const [presencasPorData, setPresencasPorData] = useState<Record<string, Presenca[]>>({})
  const [carregandoPresenca, setCarregandoPresenca] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro('')

    try {
      const [listaVendas, listaDias] = await Promise.all([
        listarVendas(),
        listarDiasDeVenda()
      ])

      setVendas(listaVendas)

      const hoje = hojeISO()

      setDias(
        [...listaDias].sort((a, b) => {
          const aFutura = a.data >= hoje
          const bFutura = b.data >= hoje

          if (aFutura && !bFutura) return -1
          if (!aFutura && bFutura) return 1

          if (aFutura && bFutura) {
            return a.data.localeCompare(b.data)
          }

          return b.data.localeCompare(a.data)
        })
      )
    } catch (err: any) {
      setErro(
        err?.response?.data?.mensagem ||
          'Não foi possível carregar o histórico.'
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function toggleAberto(data: string) {
    if (aberto === data) {
      setAberto(null)
      return
    }

    setAberto(data)

    if (!presencasPorData[data]) {
      setCarregandoPresenca(true)

      const lista = await listarPresencas(data)

      setPresencasPorData((atual) => ({
        ...atual,
        [data]: lista
      }))

      setCarregandoPresenca(false)
    }
  }

  function vendaDaData(data: string) {
    return vendas.find((v) => v.data === data) || null
  }

  const porMes = useMemo(() => {
    const grupos = new Map<
      string,
      { label: string; total: number; qtd: number }
    >()

    for (const v of vendas) {
      const [ano, mes] = v.data.split('-')
      const chave = `${ano}-${mes}`
      const label = `${nomesMeses[Number(mes) - 1]} de ${ano}`

      const atual = grupos.get(chave) || {
        label,
        total: 0,
        qtd: 0
      }

      atual.total += v.valorTotal
      atual.qtd += 1

      grupos.set(chave, atual)
    }

    return Array.from(grupos.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([chave, dados]) => ({
        chave,
        ...dados
      }))
  }, [vendas])

  const hoje = hojeISO()

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4 pb-24 lg:pb-6">
      <h1 className="text-xl font-bold text-slate-800">
        📜 Histórico
      </h1>

      <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setVisao('semana')}
          className={`text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors ${
            visao === 'semana'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          Por semana
        </button>

        <button
          onClick={() => setVisao('mes')}
          className={`text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors ${
            visao === 'mes'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          Por mês
        </button>
      </div>

      {carregando ? (
        <p className="text-slate-400 text-sm">
          Carregando...
        </p>
      ) : erro ? (
        <Card className="bg-red-50 border-red-200">
          <p className="text-sm text-red-600 font-medium">
            ⚠️ {erro}
          </p>

          <button
            onClick={carregar}
            className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2"
          >
            Tentar de novo
          </button>
        </Card>
      ) : visao === 'mes' ? (
        <div className="space-y-2">
          {porMes.length === 0 ? (
            <Card>
              <p className="text-slate-400 text-sm text-center py-6">
                Nenhum fechamento registrado ainda.
              </p>
            </Card>
          ) : (
            porMes.map((m) => (
              <Card
                key={m.chave}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {m.label}
                  </p>

                  <p className="text-xs text-slate-500">
                    {m.qtd}{' '}
                    {m.qtd === 1
                      ? 'fechamento'
                      : 'fechamentos'}
                  </p>
                </div>

                <span className="font-bold text-primary-600">
                  {formatarMoeda(m.total)}
                </span>
              </Card>
            ))
          )}
        </div>
      ) : dias.length === 0 ? (
        <Card>
          <p className="text-slate-400 text-sm text-center py-6">
            Nenhuma data de venda marcada no calendário ainda.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {dias.map((d, index) => {
            const venda = vendaDaData(d.data)
            const estaAberto = aberto === d.data
            const presencasDoDia = presencasPorData[d.data]

            const ehHoje = d.data === hoje
            const ehProxima = index === 0 && !ehHoje

            return (
              <Card
                key={d.id}
                className="overflow-hidden !p-0"
              >
                <button
                  onClick={() => toggleAberto(d.data)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {formatarData(d.data)}
                    </span>

                    {ehHoje && (
                      <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-semibold">
                        Hoje
                      </span>
                    )}

                    {ehProxima && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                        Próxima
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        venda
                          ? 'text-primary-600'
                          : 'text-slate-300'
                      }`}
                    >
                      {venda
                        ? formatarMoeda(venda.valorTotal)
                        : 'sem fechamento'}
                    </span>

                    <span className="text-slate-400 text-sm">
                      {estaAberto ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {estaAberto && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-4">
                    {/* Histórico do caixa */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Fechamento de caixa
                      </p>

                      {venda ? (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Notas
                            </span>

                            <span className="font-medium text-slate-700">
                              {formatarMoeda(venda.valorNotas)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Moedas
                            </span>

                            <span className="font-medium text-slate-700">
                              {formatarMoeda(venda.valorMoedas)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Pix
                            </span>

                            <span className="font-medium text-slate-700">
                              {formatarMoeda(venda.valorPix)}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500">
                              Gastos
                            </span>

                            <span className="font-medium text-slate-700">
                              {/* Programar para colocar gastos aqui */}
                            </span>
                          </div>

                          <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold">
                            <span className="text-slate-700">
                              Total
                            </span>

                            <span className="text-primary-600">
                              {formatarMoeda(venda.valorTotal)}
                            </span>
                          </div>

                                {/* Total Líquido */}
                          <div>
                            <span className="text-slate-700">
                              Total Líquido
                            </span>

                            <span className="font-medium text-slate-600">
                              {/* Programar para colocar total líquido aqui */}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Nenhum fechamento registrado para essa data ainda.
                        </p>
                      )}
                    </div>

                    {/* Lista de presença */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                        Lista de presença
                      </p>

                      {carregandoPresenca &&
                      !presencasDoDia ? (
                        <p className="text-xs text-slate-400">
                          Carregando...
                        </p>
                      ) : !presencasDoDia ||
                        presencasDoDia.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          Ninguém marcado ainda nessa data.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {presencasDoDia.map((p) => {
                            const rotulo = rotuloPresenca(p)

                            return (
                              <div
                                key={p.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-slate-700">
                                  {p.usuarioNome}
                                </span>

                                <span
                                  className={`text-xs font-semibold ${rotulo.cor}`}
                                >
                                  {rotulo.texto}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}