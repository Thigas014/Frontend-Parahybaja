import { useEffect, useState } from 'react'
import { atualizarMeta, atualizarTaxas, obterConfiguracao } from '../../api/services'
import { Card } from '../../components/Card'

export function Configuracoes() {
  const [meta, setMeta] = useState('')
  const [taxaJustificado, setTaxaJustificado] = useState('')
  const [taxaSemJustificativa, setTaxaSemJustificativa] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvandoTaxa, setSalvandoTaxa] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [mensagemTaxa, setMensagemTaxa] = useState('')

  async function carregar() {
    const config = await obterConfiguracao()
    setMeta(String(config.metaFinanceira))
    setTaxaJustificado(String(config.valorTaxaJustificado))
    setTaxaSemJustificativa(String(config.valorTaxaSemJustificativa))
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

  return (
    <div className="space-y-4 max-w-md">
      <h2 className="font-bold text-slate-800">Configurações</h2>

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
            <p className="text-xs text-slate-400 mt-1">Mesmo valor toda semana, resetando todo domingo.</p>
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
  )
}
