import { useEffect, useMemo, useState } from 'react'
import { listarDespesas, listarDiasDeVenda, listarPresencas, listarVendas } from '../api/services'
import type { DiaDeVenda, Despesa, Presenca, Venda } from '../types'
import { Card } from '../components/Card'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataCurta(iso: string) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

/** Extrai a parte de data (yyyy-MM-dd) de um dataHora ISO (ex: "2026-09-19T12:00:00"). */
function dataDeDataHora(dataHora: string) {
  return dataHora.split('T')[0]
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
  if (p.status === 'PRESENTE') return { texto: 'Presente', cor: 'text-green-600' }
  if (p.status === 'JUSTIFICADO') return { texto: 'Justificado', cor: 'text-amber-600' }
  if (p.status === 'AUSENTE') return { texto: 'Ausente (sem justificativa)', cor: 'text-red-500' }
  return { texto: 'Pendente', cor: 'text-slate-400' }
}

function ordenarDatas(a: string, b: string, hoje: string) {
  const aFutura = a >= hoje
  const bFutura = b >= hoje
  if (aFutura && !bFutura) return -1
  if (!aFutura && bFutura) return 1
  if (aFutura && bFutura) return a.localeCompare(b)
  return b.localeCompare(a)
}

export function Historico() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [dias, setDias] = useState<DiaDeVenda[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
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
      const [listaVendas, listaDias, listaDespesas] = await Promise.all([
        listarVendas(),
        listarDiasDeVenda(),
        listarDespesas()
      ])
      setVendas(listaVendas)
      setDias(listaDias)
      setDespesas(listaDespesas)
    } catch (err: any) {
      setErro(err?.response?.data?.mensagem || 'Não foi possível carregar o histórico.')
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
      setPresencasPorData((atual) => ({ ...atual, [data]: lista }))
      setCarregandoPresenca(false)
    }
  }

  function vendaDaData(data: string) {
    return vendas.find((v) => v.data === data) || null
  }

  function despesasDaData(data: string) {
    return despesas.filter((d) => dataDeDataHora(d.dataHora) === data)
  }

  // Junta as datas marcadas no calendário, as datas com fechamento e as datas
  // com gasto de reposição lançado — mesmo que essas listas não coincidam
  // totalmente, assim nada fica de fora do histórico.
  const datasCombinadas = useMemo(() => {
    const hoje = hojeISO()
    const conjunto = new Set<string>([
      ...dias.map((d) => d.data),
      ...vendas.map((v) => v.data),
      ...despesas.map((d) => dataDeDataHora(d.dataHora))
    ])
    return Array.from(conjunto).sort((a, b) => ordenarDatas(a, b, hoje))
  }, [dias, vendas, despesas])

  const porMes = useMemo(() => {
    const grupos = new Map<string, { label: string; total: number; datas: string[] }>()

    for (const v of vendas) {
      const [ano, mes] = v.data.split('-')
      const chave = `${ano}-${mes}`
      const label = `${nomesMeses[Number(mes) - 1]} de ${ano}`
      const atual = grupos.get(chave) || { label, total: 0, datas: [] }
      atual.total += v.valorTotal
      atual.datas.push(v.data)
      grupos.set(chave, atual)
    }

    return Array.from(grupos.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([chave, dados]) => ({
        chave,
        ...dados,
        datas: dados.datas.sort((a, b) => b.localeCompare(a))
      }))
  }, [vendas])

  const hoje = hojeISO()

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4 pb-24 lg:pb-6">
      <h1 className="text-xl font-bold text-slate-800">📜 Histórico</h1>

      <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setVisao('semana')}
          className={`text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors ${
            visao === 'semana' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Por semana
        </button>
        <button
          onClick={() => setVisao('mes')}
          className={`text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors ${
            visao === 'mes' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Por mês
        </button>
      </div>

      {carregando ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : erro ? (
        <Card className="bg-red-50 border-red-200">
          <p className="text-sm text-red-600 font-medium">⚠️ {erro}</p>
          <button onClick={carregar} className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-4 py-2">
            Tentar de novo
          </button>
        </Card>
      ) : visao === 'mes' ? (
        <div className="space-y-2">
          {porMes.length === 0 ? (
            <Card><p className="text-slate-400 text-sm text-center py-6">Nenhum fechamento registrado ainda.</p></Card>
          ) : (
            porMes.map((m) => (
              <Card key={m.chave}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{m.label}</p>
                  <span className="font-bold text-primary-600">{formatarMoeda(m.total)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.datas.map((data) => (
                    <span key={data} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {formatarDataCurta(data)}
                    </span>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : datasCombinadas.length === 0 ? (
        <Card><p className="text-slate-400 text-sm text-center py-6">Nenhum fechamento ou data marcada ainda.</p></Card>
      ) : (
        <div className="space-y-2">
          {datasCombinadas.map((data, index) => {
            const venda = vendaDaData(data)
            const gastosDoDia = despesasDaData(data)
            const totalGastosDoDia = gastosDoDia.reduce((soma, d) => soma + d.valor, 0)
            const estaNoCalendario = dias.some((d) => d.data === data)
            const estaAberto = aberto === data
            const presencasDoDia = presencasPorData[data]

            const ehHoje = data === hoje
            const ehProxima = index === 0 && !ehHoje && data >= hoje

            return (
              <Card key={data} className="overflow-hidden !p-0">
                <button
                  onClick={() => toggleAberto(data)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{formatarData(data)}</span>
                    {ehHoje && (
                      <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-semibold">Hoje</span>
                    )}
                    {ehProxima && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Próxima</span>
                    )}
                    {!estaNoCalendario && (
                      <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">
                        Fora do calendário
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${venda ? 'text-primary-600' : 'text-slate-300'}`}>
                      {venda ? formatarMoeda(venda.valorTotal) : 'sem fechamento'}
                    </span>
                    <span className="text-slate-400 text-sm">{estaAberto ? '▲' : '▼'}</span>
                  </div>
                </button>

                {estaAberto && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-4">
                    {/* Histórico do caixa */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Fechamento de caixa</p>
                      {venda ? (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-slate-500">Notas</span><span className="font-medium text-slate-700">{formatarMoeda(venda.valorNotas)}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Moedas</span><span className="font-medium text-slate-700">{formatarMoeda(venda.valorMoedas)}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Pix</span><span className="font-medium text-slate-700">{formatarMoeda(venda.valorPix)}</span></div>
                          <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold"><span className="text-slate-700">Total</span><span className="text-primary-600">{formatarMoeda(venda.valorTotal)}</span></div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Nenhum fechamento registrado para essa data ainda.</p>
                      )}
                    </div>

                    {/* Gastos de reposição */}
                    {gastosDoDia.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase">Gastos de reposição</p>
                          <span className="text-xs font-semibold text-red-500">− {formatarMoeda(totalGastosDoDia)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2 space-y-1.5">
                          {gastosDoDia.map((d) => (
                            <div key={d.id} className="flex justify-between text-sm">
                              <span className="text-slate-600">{d.descricao}</span>
                              <span className="font-medium text-red-500">− {formatarMoeda(d.valor)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lista de presença */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Lista de presença</p>
                      {carregandoPresenca && !presencasDoDia ? (
                        <p className="text-xs text-slate-400">Carregando...</p>
                      ) : !presencasDoDia || presencasDoDia.length === 0 ? (
                        <p className="text-xs text-slate-400">Ninguém marcado ainda nessa data.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {presencasDoDia.map((p) => {
                            const rotulo = rotuloPresenca(p)
                            return (
                              <div key={p.id} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">{p.usuarioNome}</span>
                                <span className={`text-xs font-semibold ${rotulo.cor}`}>{rotulo.texto}</span>
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
