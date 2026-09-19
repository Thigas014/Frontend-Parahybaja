import { useEffect, useState } from 'react'
import {
  atualizarMeta,
  atualizarTaxas,
  criarAporte,
  criarDespesa,
  excluirAporte,
  excluirDespesa,
  listarAportes,
  listarDespesas,
  obterConfiguracao,
  obterDashboard
} from '../../api/services'
import { Card } from '../../components/Card'
import { ProgressBar } from '../../components/ProgressBar'
import type { Aporte, Dashboard, Despesa } from '../../types'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function Meta() {
  const [meta, setMeta] = useState('')
  const [taxaJustificado, setTaxaJustificado] = useState('')
  const [taxaSemJustificativa, setTaxaSemJustificativa] = useState('')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [aportes, setAportes] = useState<Aporte[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [salvando, setSalvando] = useState(false)
  const [salvandoTaxa, setSalvandoTaxa] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [mensagemTaxa, setMensagemTaxa] = useState('')

  const [descricaoAporte, setDescricaoAporte] = useState('')
  const [valorAporte, setValorAporte] = useState('')
  const [enviandoAporte, setEnviandoAporte] = useState(false)

  const [descricaoDespesa, setDescricaoDespesa] = useState('')
  const [valorDespesa, setValorDespesa] = useState('')
  const [enviandoDespesa, setEnviandoDespesa] = useState(false)

  async function carregar() {
    const [config, dash, listaAportes, listaDespesas] = await Promise.all([
      obterConfiguracao(),
      obterDashboard(),
      listarAportes(),
      listarDespesas()
    ])
    setMeta(String(config.metaFinanceira))
    setTaxaJustificado(String(config.valorTaxaJustificado))
    setTaxaSemJustificativa(String(config.valorTaxaSemJustificativa))
    setDashboard(dash)
    setAportes(listaAportes)
    setDespesas(listaDespesas)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMensagem('')
    await atualizarMeta(Number(meta))
    setMensagem('Meta atualizada com sucesso!')
    setSalvando(false)
    carregar()
  }

  async function salvarTaxa(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoTaxa(true)
    setMensagemTaxa('')
    await atualizarTaxas(Number(taxaJustificado), Number(taxaSemJustificativa))
    setMensagemTaxa('Taxas atualizadas com sucesso!')
    setSalvandoTaxa(false)
    carregar()
  }

  async function handleCriarAporte(e: React.FormEvent) {
    e.preventDefault()
    if (!descricaoAporte || !valorAporte) return
    setEnviandoAporte(true)
    await criarAporte(descricaoAporte, Number(valorAporte))
    setDescricaoAporte('')
    setValorAporte('')
    setEnviandoAporte(false)
    carregar()
  }

  async function handleExcluirAporte(id: number) {
    if (!confirm('Excluir este aporte? Ele deixará de contar na meta.')) return
    await excluirAporte(id)
    carregar()
  }

  async function handleCriarDespesa(e: React.FormEvent) {
    e.preventDefault()
    if (!descricaoDespesa || !valorDespesa) return
    setEnviandoDespesa(true)
    await criarDespesa(descricaoDespesa, Number(valorDespesa))
    setDescricaoDespesa('')
    setValorDespesa('')
    setEnviandoDespesa(false)
    carregar()
  }

  async function handleExcluirDespesa(id: number) {
    if (!confirm('Excluir este gasto? Ele deixará de ser descontado no modo Líquido.')) return
    await excluirDespesa(id)
    carregar()
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-slate-800">Meta e finanças</h2>

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          {dashboard && (
            <Card>
              <p className="text-sm font-semibold text-slate-700 mb-0.5">Semana atual</p>
              <p className="text-xs text-slate-400 mb-2">
                {(() => {
                  const hoje = new Date()
                  const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
                  const [, mes, dia] = dashboard.fimSemana.split('-')
                  const vendaHoje = dashboard.proximaVendaMarcada === hojeISO
                  if (vendaHoje) return `Venda de hoje, ${dia}/${mes}`
                  if (dashboard.fimSemana > hojeISO) return `Meta em andamento — venda marcada pra ${dia}/${mes}`
                  return `Última semana fechada, ${dia}/${mes}`
                })()}
              </p>
              <div className="flex justify-between mb-1 text-xs text-slate-500">
                <span>Bruto</span>
                <span className="font-medium text-slate-700">{formatarMoeda(dashboard.totalBruto)} ({dashboard.percentualBruto.toFixed(1)}%)</span>
              </div>
              <ProgressBar percentual={dashboard.percentualBruto} />
              <div className="flex justify-between mt-3 mb-1 text-xs text-slate-500">
                <span>Líquido</span>
                <span className="font-medium text-slate-700">{formatarMoeda(dashboard.totalLiquido)} ({dashboard.percentualLiquido.toFixed(1)}%)</span>
              </div>
              <ProgressBar percentual={dashboard.percentualLiquido} />
              <p className="text-xs text-slate-400 mt-2">Meta semanal: {formatarMoeda(dashboard.metaSemanal)}</p>
            </Card>
          )}

          <Card>
            <form onSubmit={salvar} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Meta semanal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <p className="text-xs text-slate-400 mt-1">Mesmo valor toda semana, resetando a cada sábado.</p>
              </div>
              {mensagem && <p className="text-sm text-green-600">{mensagem}</p>}
              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5"
              >
                {salvando ? 'Salvando...' : 'Salvar meta'}
              </button>
            </form>
          </Card>

          <Card>
            <form onSubmit={salvarTaxa} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Taxa — falta justificada (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={taxaJustificado}
                  onChange={(e) => setTaxaJustificado(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <p className="text-xs text-slate-400 mt-1">Quando o admin aceita a justificativa do membro.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Taxa — falta sem justificativa (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={taxaSemJustificativa}
                  onChange={(e) => setTaxaSemJustificativa(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <p className="text-xs text-slate-400 mt-1">Quando o admin marca ausente sem aceitar justificativa.</p>
              </div>
              {mensagemTaxa && <p className="text-sm text-green-600">{mensagemTaxa}</p>}
              <button
                type="submit"
                disabled={salvandoTaxa}
                className="w-full bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5"
              >
                {salvandoTaxa ? 'Salvando...' : 'Salvar taxas'}
              </button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="text-sm font-semibold text-slate-700 mb-3">🎁 Lançar aporte / doação</p>
            <form onSubmit={handleCriarAporte} className="space-y-3">
              <input
                required
                placeholder="Descrição (ex: Doação da Padaria Central)"
                value={descricaoAporte}
                onChange={(e) => setDescricaoAporte(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                step="0.01"
                min={0.01}
                placeholder="Valor (R$)"
                value={valorAporte}
                onChange={(e) => setValorAporte(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={enviandoAporte}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-sm"
              >
                {enviandoAporte ? 'Lançando...' : 'Lançar aporte'}
              </button>
            </form>
          </Card>

          {aportes.length > 0 && (
            <div className="space-y-2">
              {aportes.map((a) => (
                <Card key={a.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{a.descricao}</p>
                    <p className="text-xs text-slate-500">
                      {formatarData(a.dataHora)} · lançado por {a.registradoPorNome}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-primary-600">{formatarMoeda(a.valor)}</span>
                    <button onClick={() => handleExcluirAporte(a.id)} className="text-xs text-red-500 font-semibold">
                      Excluir
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <p className="text-sm font-semibold text-slate-700 mb-3">📦 Lançar gasto de reposição</p>
            <form onSubmit={handleCriarDespesa} className="space-y-3">
              <input
                required
                placeholder="Descrição (ex: Água, Gelo, Copos...)"
                value={descricaoDespesa}
                onChange={(e) => setDescricaoDespesa(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                step="0.01"
                min={0.01}
                placeholder="Valor (R$)"
                value={valorDespesa}
                onChange={(e) => setValorDespesa(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={enviandoDespesa}
                className="w-full bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-sm"
              >
                {enviandoDespesa ? 'Lançando...' : 'Lançar gasto'}
              </button>
            </form>
          </Card>

          <div className="space-y-2">
            {despesas.length === 0 ? (
              <Card><p className="text-slate-400 text-sm text-center py-4">Nenhum gasto lançado ainda.</p></Card>
            ) : (
              despesas.map((d) => (
                <Card key={d.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{d.descricao}</p>
                    <p className="text-xs text-slate-500">
                      {formatarData(d.dataHora)} · lançado por {d.registradoPorNome}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-red-500">− {formatarMoeda(d.valor)}</span>
                    <button onClick={() => handleExcluirDespesa(d.id)} className="text-xs text-red-500 font-semibold">
                      Excluir
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
