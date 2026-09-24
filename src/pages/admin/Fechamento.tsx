import { useEffect, useState } from 'react'
import {
  atualizarFechamento,
  criarAporte,
  criarDespesa,
  excluirAporte,
  excluirDespesa,
  excluirFechamento,
  listarAportes,
  listarDespesas,
  listarVendas,
  registrarFechamento
} from '../../api/services'
import type { FechamentoPayload } from '../../api/services'
import type { Aporte, Despesa, Venda } from '../../types'
import { Card } from '../../components/Card'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function hojeISO() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

// Cada campo agora guarda a QUANTIDADE de notas/moedas daquela denominação,
// não o valor já calculado. O valor de cada denominação é sempre
// quantidade × valorDaDenominacao.
const vazioQuantidades = {
  notas2: '', notas5: '', notas10: '', notas20: '', notas50: '',
  moedas1: '', moedas050: '', moedas025: '', moedas010: '', moedas005: ''
}

const DENOMINACOES: Record<keyof typeof vazioQuantidades, number> = {
  notas2: 2, notas5: 5, notas10: 10, notas20: 20, notas50: 50,
  moedas1: 1, moedas050: 0.5, moedas025: 0.25, moedas010: 0.1, moedas005: 0.05
}

const notasCampos: { chave: keyof typeof vazioQuantidades; label: string }[] = [
  { chave: 'notas2', label: 'R$ 2,00' },
  { chave: 'notas5', label: 'R$ 5,00' },
  { chave: 'notas10', label: 'R$ 10,00' },
  { chave: 'notas20', label: 'R$ 20,00' },
  { chave: 'notas50', label: 'R$ 50,00' }
]

const moedasCampos: { chave: keyof typeof vazioQuantidades; label: string }[] = [
  { chave: 'moedas1', label: 'R$ 1,00' },
  { chave: 'moedas050', label: 'R$ 0,50' },
  { chave: 'moedas025', label: 'R$ 0,25' },
  { chave: 'moedas010', label: 'R$ 0,10' },
  { chave: 'moedas005', label: 'R$ 0,05' }
]

const vazio = { data: hojeISO(), ...vazioQuantidades, valorPix: '' }

type GastoLinha = { descricao: string; valor: string }

function numero(v: string) {
  return Number(v) || 0
}

/** Converte um valor em reais (vindo do backend) de volta pra quantidade de cédulas/moedas. */
function valorParaQuantidade(valor: number, denominacao: number) {
  if (!valor) return ''
  const qtd = Math.round(valor / denominacao)
  return String(qtd)
}

export function Fechamento() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [aportes, setAportes] = useState<Aporte[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [form, setForm] = useState(vazio)
  const [gastos, setGastos] = useState<GastoLinha[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const [descricaoAporte, setDescricaoAporte] = useState('')
  const [valorAporte, setValorAporte] = useState('')
  const [enviandoAporte, setEnviandoAporte] = useState(false)

  const [descricaoGastoAvulso, setDescricaoGastoAvulso] = useState('')
  const [valorGastoAvulso, setValorGastoAvulso] = useState('')
  const [enviandoGastoAvulso, setEnviandoGastoAvulso] = useState(false)

  async function carregar() {
    const [listaVendas, listaAportes, listaDespesas] = await Promise.all([
      listarVendas(),
      listarAportes(),
      listarDespesas()
    ])
    setVendas(listaVendas)
    setAportes(listaAportes)
    setDespesas(listaDespesas)
  }

  useEffect(() => {
    carregar()
  }, [])

  function novoFechamento() {
    setEditandoId(null)
    setForm({ ...vazio, data: hojeISO() })
    setGastos([])
    setMostrarForm(true)
    setMensagem(null)
  }

  function iniciarEdicao(v: Venda) {
    setEditandoId(v.id)
    setForm({
      data: v.data,
      notas2: valorParaQuantidade(v.notas2, 2),
      notas5: valorParaQuantidade(v.notas5, 5),
      notas10: valorParaQuantidade(v.notas10, 10),
      notas20: valorParaQuantidade(v.notas20, 20),
      notas50: valorParaQuantidade(v.notas50, 50),
      moedas1: valorParaQuantidade(v.moedas1, 1),
      moedas050: valorParaQuantidade(v.moedas050, 0.5),
      moedas025: valorParaQuantidade(v.moedas025, 0.25),
      moedas010: valorParaQuantidade(v.moedas010, 0.1),
      moedas005: valorParaQuantidade(v.moedas005, 0.05),
      valorPix: String(v.valorPix)
    })
    setGastos([])
    setMostrarForm(true)
    setMensagem(null)
  }

  function subtotal(chave: keyof typeof vazioQuantidades) {
    return numero(form[chave]) * DENOMINACOES[chave]
  }

  function adicionarGasto() {
    setGastos((atual) => [...atual, { descricao: '', valor: '' }])
  }

  function atualizarGasto(index: number, campo: keyof GastoLinha, valor: string) {
    setGastos((atual) => atual.map((g, i) => (i === index ? { ...g, [campo]: valor } : g)))
  }

  function removerGasto(index: number) {
    setGastos((atual) => atual.filter((_, i) => i !== index))
  }

  const totalNotas = notasCampos.reduce((soma, c) => soma + subtotal(c.chave), 0)
  const totalMoedas = moedasCampos.reduce((soma, c) => soma + subtotal(c.chave), 0)
  const totalPix = numero(form.valorPix)
  const valorTotal = totalNotas + totalMoedas + totalPix
  const totalGastos = gastos.reduce((soma, g) => soma + numero(g.valor), 0)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setMensagem(null)

    // Envia pro backend o VALOR já calculado de cada denominação (quantidade × valor),
    // que é o formato que a API espera e usa nos cálculos do dashboard.
    const payload: FechamentoPayload = {
      data: form.data,
      notas2: subtotal('notas2'), notas5: subtotal('notas5'), notas10: subtotal('notas10'),
      notas20: subtotal('notas20'), notas50: subtotal('notas50'),
      moedas1: subtotal('moedas1'), moedas050: subtotal('moedas050'), moedas025: subtotal('moedas025'),
      moedas010: subtotal('moedas010'), moedas005: subtotal('moedas005'),
      valorPix: numero(form.valorPix)
    }

    try {
      if (editandoId) {
        await atualizarFechamento(editandoId, payload)
      } else {
        await registrarFechamento(payload)
      }

      // Lança cada gasto preenchido, já datado com o mesmo dia do fechamento.
      const gastosValidos = gastos.filter((g) => g.descricao.trim() && numero(g.valor) > 0)
      for (const g of gastosValidos) {
        await criarDespesa(g.descricao.trim(), numero(g.valor), form.data)
      }

      setMensagem({ tipo: 'sucesso', texto: 'Fechamento salvo com sucesso!' })
      setMostrarForm(false)
      carregar()
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err?.response?.data?.mensagem || 'Não foi possível salvar.' })
    } finally {
      setEnviando(false)
    }
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este fechamento?')) return
    await excluirFechamento(id)
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

  async function handleCriarGastoAvulso(e: React.FormEvent) {
    e.preventDefault()
    if (!descricaoGastoAvulso || !valorGastoAvulso) return
    setEnviandoGastoAvulso(true)
    await criarDespesa(descricaoGastoAvulso, Number(valorGastoAvulso))
    setDescricaoGastoAvulso('')
    setValorGastoAvulso('')
    setEnviandoGastoAvulso(false)
    carregar()
  }

  async function handleExcluirDespesa(id: number) {
    if (!confirm('Excluir este gasto? Ele deixará de ser descontado no modo Líquido.')) return
    await excluirDespesa(id)
    carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-800">Fechamento de caixa</h2>
        <button onClick={novoFechamento} className="text-sm bg-primary-600 text-white rounded-lg px-3 py-1.5 font-semibold">
          + Novo fechamento
        </button>
      </div>

      {mostrarForm && (
        <Card className="max-w-lg">
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500">Data</label>
              <input
                required
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase">Notas — quantidade</p>
                <span className="text-xs font-semibold text-slate-500">{formatarMoeda(totalNotas)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {notasCampos.map((c) => (
                  <div key={c.chave}>
                    <label className="text-[11px] text-slate-500">{c.label}</label>
                    <input
                      type="number"
                      step="1"
                      min={0}
                      placeholder="0"
                      value={form[c.chave]}
                      onChange={(e) => setForm({ ...form, [c.chave]: e.target.value })}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                    />
                    {numero(form[c.chave]) > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">= {formatarMoeda(subtotal(c.chave))}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase">Moedas — quantidade</p>
                <span className="text-xs font-semibold text-slate-500">{formatarMoeda(totalMoedas)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {moedasCampos.map((c) => (
                  <div key={c.chave}>
                    <label className="text-[11px] text-slate-500">{c.label}</label>
                    <input
                      type="number"
                      step="1"
                      min={0}
                      placeholder="0"
                      value={form[c.chave]}
                      onChange={(e) => setForm({ ...form, [c.chave]: e.target.value })}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                    />
                    {numero(form[c.chave]) > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">= {formatarMoeda(subtotal(c.chave))}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Pix (valor em R$, não é quantidade)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="0,00"
                value={form.valorPix}
                onChange={(e) => setForm({ ...form, valorPix: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="bg-primary-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-primary-700">Valor bruto</span>
              <span className="text-lg font-bold text-primary-700">{formatarMoeda(valorTotal)}</span>
            </div>

            {/* Gastos de reposição do mesmo dia */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase">Gastos de reposição (opcional)</p>
                {totalGastos > 0 && <span className="text-xs font-semibold text-red-500">− {formatarMoeda(totalGastos)}</span>}
              </div>

              {gastos.length > 0 && (
                <div className="space-y-2 mb-2">
                  {gastos.map((g, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        placeholder="Descrição (ex: Água, Gelo...)"
                        value={g.descricao}
                        onChange={(e) => atualizarGasto(index, 'descricao', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0,00"
                        value={g.valor}
                        onChange={(e) => atualizarGasto(index, 'valor', e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removerGasto(index)}
                        className="text-slate-400 hover:text-red-500 px-1 py-1.5 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={adicionarGasto}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                + Adicionar gasto
              </button>
            </div>

            {mensagem && (
              <p className={`text-sm ${mensagem.tipo === 'sucesso' ? 'text-green-600' : 'text-red-500'}`}>
                {mensagem.texto}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-sm"
              >
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="flex-1 bg-slate-100 text-slate-600 rounded-lg py-2 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vendas.map((v) => (
          <Card key={v.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-800">{formatarData(v.data)}</p>
                <p className="text-xs text-slate-500">
                  Notas {formatarMoeda(v.valorNotas)} · Moedas {formatarMoeda(v.valorMoedas)} · Pix {formatarMoeda(v.valorPix)}
                </p>
              </div>
              <p className="font-bold text-primary-600">{formatarMoeda(v.valorTotal)}</p>
            </div>
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
              <button onClick={() => iniciarEdicao(v)} className="text-xs text-primary-600 font-semibold">Editar</button>
              <button onClick={() => excluir(v.id)} className="text-xs text-red-500 font-semibold">Excluir</button>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-start pt-2">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">🎁 Aportes / doações</h3>
          <Card>
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

          {aportes.length === 0 ? (
            <Card><p className="text-slate-400 text-sm text-center py-4">Nenhum aporte lançado ainda.</p></Card>
          ) : (
            aportes.map((a) => (
              <Card key={a.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{a.descricao}</p>
                  <p className="text-xs text-slate-500">
                    {formatarDataHora(a.dataHora)} · lançado por {a.registradoPorNome}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-primary-600">{formatarMoeda(a.valor)}</span>
                  <button onClick={() => handleExcluirAporte(a.id)} className="text-xs text-red-500 font-semibold">
                    Excluir
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">📦 Gastos de reposição</h3>
          <Card>
            <form onSubmit={handleCriarGastoAvulso} className="space-y-3">
              <input
                required
                placeholder="Descrição (ex: Água, Gelo, Copos...)"
                value={descricaoGastoAvulso}
                onChange={(e) => setDescricaoGastoAvulso(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                step="0.01"
                min={0.01}
                placeholder="Valor (R$)"
                value={valorGastoAvulso}
                onChange={(e) => setValorGastoAvulso(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={enviandoGastoAvulso}
                className="w-full bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg py-2 text-sm"
              >
                {enviandoGastoAvulso ? 'Lançando...' : 'Lançar gasto'}
              </button>
            </form>
          </Card>

          {despesas.length === 0 ? (
            <Card><p className="text-slate-400 text-sm text-center py-4">Nenhum gasto lançado ainda.</p></Card>
          ) : (
            despesas.map((d) => (
              <Card key={d.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{d.descricao}</p>
                  <p className="text-xs text-slate-500">
                    {formatarDataHora(d.dataHora)} · lançado por {d.registradoPorNome}
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
  )
}
