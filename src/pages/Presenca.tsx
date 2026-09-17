import { useEffect, useState } from 'react'
import {
  justificarAusencia,
  listarDiasDeVenda,
  listarPresencas,
  listarUsuarios,
  marcarPresenca,
  marcarTaxaPaga,
  obterConfiguracao
} from '../api/services'
import type { DiaDeVenda, Presenca as PresencaType, Usuario } from '../types'
import { Card } from '../components/Card'
import { useAuth } from '../context/AuthContext'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataCurta(iso: string) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function hojeISO() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

export function Presenca() {
  const { usuario, isAdmin } = useAuth()
  const [dias, setDias] = useState<DiaDeVenda[]>([])
  const [membros, setMembros] = useState<Usuario[]>([])
  const [taxaConfigurada, setTaxaConfigurada] = useState(0)
  const [carregando, setCarregando] = useState(true)

  const [aberto, setAberto] = useState<string | null>(null)
  const [presencasPorData, setPresencasPorData] = useState<Record<string, PresencaType[]>>({})
  const [carregandoPresenca, setCarregandoPresenca] = useState(false)

  const [minhaJustificativa, setMinhaJustificativa] = useState('')
  const [enviandoJustificativa, setEnviandoJustificativa] = useState(false)
  const [erroJustificativa, setErroJustificativa] = useState('')

  async function carregarBase() {
    setCarregando(true)

    const promessas: Promise<any>[] = [
      listarDiasDeVenda(),
      obterConfiguracao()
    ]

    if (isAdmin) {
      promessas.push(listarUsuarios())
    }

    const resultados = await Promise.all(promessas)

    const hoje = hojeISO()

    setDias(
      [...resultados[0]].sort((a: DiaDeVenda, b: DiaDeVenda) => {
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

    setTaxaConfigurada(resultados[1].valorTaxaAusencia)

    if (isAdmin) {
      setMembros(
        resultados[2].filter((u: Usuario) => u.perfil === 'MEMBRO')
      )
    }

    setCarregando(false)
  }

  useEffect(() => {
    carregarBase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregarPresencasDaData(data: string) {
    setCarregandoPresenca(true)
    const lista = await listarPresencas(data)
    setPresencasPorData((atual) => ({ ...atual, [data]: lista }))
    setCarregandoPresenca(false)
  }

  async function toggleAberto(data: string) {
    if (aberto === data) {
      setAberto(null)
      return
    }

    setAberto(data)
    setMinhaJustificativa('')
    setErroJustificativa('')

    if (!presencasPorData[data]) {
      await carregarPresencasDaData(data)
    }
  }

  function statusDe(data: string, usuarioId: number) {
    return (
      (presencasPorData[data] || []).find(
        (p) => p.usuarioId === usuarioId
      ) || null
    )
  }

  async function handleMarcar(
    data: string,
    usuarioId: number,
    presente: boolean
  ) {
    await marcarPresenca(usuarioId, data, presente)
    carregarPresencasDaData(data)
  }

  async function handleTaxaPaga(
    data: string,
    id: number,
    pagaAtual: boolean
  ) {
    await marcarTaxaPaga(id, !pagaAtual)
    carregarPresencasDaData(data)
  }

  async function handleJustificar(
    e: React.FormEvent,
    data: string
  ) {
    e.preventDefault()

    if (!minhaJustificativa.trim()) return

    setEnviandoJustificativa(true)
    setErroJustificativa('')

    try {
      await justificarAusencia(data, minhaJustificativa)
      setMinhaJustificativa('')
      carregarPresencasDaData(data)
    } catch (err: any) {
      setErroJustificativa(
        err?.response?.data?.mensagem ||
          'Não foi possível enviar a justificativa.'
      )
    } finally {
      setEnviandoJustificativa(false)
    }
  }

  const hoje = hojeISO()

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4 pb-24 lg:pb-6">
      <h1 className="text-xl font-bold text-slate-800">
        ✅ Presença
      </h1>

      {carregando ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : dias.length === 0 ? (
        <Card>
          <p className="text-slate-400 text-sm text-center py-6">
            Nenhuma data de venda marcada no calendário ainda.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {dias.map((d, index) => {
            const estaAberto = aberto === d.data
            const presencasDoDia = presencasPorData[d.data]

            const minhaPresenca = usuario
              ? presencasDoDia?.find(
                  (p) => p.usuarioId === usuario.id
                )
              : null

            const dataPassou = d.data < hoje
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
                      💧 Venda de água {formatarDataCurta(d.data)}
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

                  <span className="text-slate-400 text-sm">
                    {estaAberto ? '▲' : '▼'}
                  </span>
                </button>

                {estaAberto && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-4">
                    {carregandoPresenca && !presencasDoDia ? (
                      <p className="text-xs text-slate-400">
                        Carregando...
                      </p>
                    ) : isAdmin ? (
                      <div className="space-y-2">
                        {membros.length === 0 ? (
                          <p className="text-xs text-slate-400">
                            Nenhum membro cadastrado.
                          </p>
                        ) : (
                          membros.map((m) => {
                            const p = statusDe(d.data, m.id)

                            return (
                              <div
                                key={m.id}
                                className="bg-slate-50 rounded-lg px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-800 text-sm truncate">
                                      {m.nome}
                                    </p>

                                    {p?.justificativa && (
                                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                                        💬 "{p.justificativa}"
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex gap-1.5 shrink-0">
                                    <button
                                      onClick={() =>
                                        handleMarcar(
                                          d.data,
                                          m.id,
                                          true
                                        )
                                      }
                                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                        p?.presente === true
                                          ? 'bg-green-600 text-white'
                                          : 'bg-white text-slate-500 border border-slate-200'
                                      }`}
                                    >
                                      Presente
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleMarcar(
                                          d.data,
                                          m.id,
                                          false
                                        )
                                      }
                                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                        p?.presente === false
                                          ? 'bg-red-500 text-white'
                                          : 'bg-white text-slate-500 border border-slate-200'
                                      }`}
                                    >
                                      Ausente
                                    </button>
                                  </div>
                                </div>

                                {p?.presente === false &&
                                  p.taxaValor != null && (
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                      <span className="text-xs text-slate-500">
                                        Taxa:{' '}
                                        <span className="font-semibold text-slate-700">
                                          {formatarMoeda(
                                            p.taxaValor
                                          )}
                                        </span>
                                      </span>

                                      <button
                                        onClick={() =>
                                          handleTaxaPaga(
                                            d.data,
                                            p.id,
                                            p.taxaPaga
                                          )
                                        }
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                          p.taxaPaga
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'
                                        }`}
                                      >
                                        {p.taxaPaga
                                          ? '✓ Paga'
                                          : 'Marcar como paga'}
                                      </button>
                                    </div>
                                  )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {minhaPresenca && (
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-slate-700">
                              Seu status nessa data
                            </p>

                            <p className="text-sm text-slate-600 mt-0.5">
                              {minhaPresenca.presente === true &&
                                '✅ Marcado como presente'}

                              {minhaPresenca.presente === false &&
                                '❌ Marcado como ausente'}

                              {minhaPresenca.presente === null &&
                                'Ainda não marcado pelo admin'}
                            </p>

                            {minhaPresenca.justificativa && (
                              <p className="text-xs text-slate-500 mt-1">
                                💬 Sua justificativa: "
                                {minhaPresenca.justificativa}"
                              </p>
                            )}

                            {minhaPresenca.presente === false &&
                              minhaPresenca.taxaValor != null && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Taxa:{' '}
                                  {formatarMoeda(
                                    minhaPresenca.taxaValor
                                  )}{' '}
                                  —{' '}
                                  {minhaPresenca.taxaPaga
                                    ? 'já paga ✓'
                                    : 'pendente'}
                                </p>
                              )}
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">
                            Justificar ausência
                          </p>

                          {dataPassou ? (
                            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                              ⚠️ Essa data já passou — não é mais
                              possível justificar. Fale com o
                              administrador se precisar corrigir algo.
                            </p>
                          ) : (
                            <>
                              <p className="text-xs text-slate-500 mb-2">
                                Se você não vai poder ir, escreva o
                                motivo com antecedência.
                                {taxaConfigurada > 0 &&
                                  ` Faltas têm uma taxa de ${formatarMoeda(
                                    taxaConfigurada
                                  )}.`}
                              </p>

                              <form
                                onSubmit={(e) =>
                                  handleJustificar(e, d.data)
                                }
                                className="space-y-2"
                              >
                                <textarea
                                  required
                                  placeholder="Explique o motivo..."
                                  value={minhaJustificativa}
                                  onChange={(e) =>
                                    setMinhaJustificativa(
                                      e.target.value
                                    )
                                  }
                                  rows={2}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none"
                                />

                                {erroJustificativa && (
                                  <p className="text-xs text-red-500">
                                    {erroJustificativa}
                                  </p>
                                )}

                                <button
                                  type="submit"
                                  disabled={enviandoJustificativa}
                                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-sm"
                                >
                                  {enviandoJustificativa
                                    ? 'Enviando...'
                                    : 'Enviar justificativa'}
                                </button>
                              </form>
                            </>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">
                            Presenças marcadas até agora
                          </p>

                          {!presencasDoDia ||
                          presencasDoDia.length === 0 ? (
                            <p className="text-xs text-slate-400">
                              Ninguém marcado ainda nessa data.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {presencasDoDia.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-slate-700">
                                    {p.usuarioNome}
                                  </span>

                                  <span
                                    className={`text-xs font-semibold ${
                                      p.presente
                                        ? 'text-green-600'
                                        : 'text-red-500'
                                    }`}
                                  >
                                    {p.presente === true
                                      ? 'Presente'
                                      : p.presente === false
                                        ? 'Ausente'
                                        : '—'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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