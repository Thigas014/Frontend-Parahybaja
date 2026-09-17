import { useEffect, useState } from 'react'
import { atualizarFechamento, excluirFechamento, listarVendas, registrarFechamento } from '../../api/services'
import type { FechamentoPayload } from '../../api/services'
import type { Venda } from '../../types'
import { Card } from '../../components/Card'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
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
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  async function carregar() {
    setVendas(await listarVendas())
  }

  useEffect(() => {
    carregar()
  }, [])

  function novoFechamento() {
    setEditandoId(null)
    setForm({ ...vazio, data: hojeISO() })
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
    setMostrarForm(true)
    setMensagem(null)
  }

  function subtotal(chave: keyof typeof vazioQuantidades) {
    return numero(form[chave]) * DENOMINACOES[chave]
  }

  const totalNotas = notasCampos.reduce((soma, c) => soma + subtotal(c.chave), 0)
  const totalMoedas = moedasCampos.reduce((soma, c) => soma + subtotal(c.chave), 0)
  const totalPix = numero(form.valorPix)
  const valorTotal = totalNotas + totalMoedas + totalPix

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
              <span className="text-sm text-primary-700">Rendimento total</span>
              <span className="text-lg font-bold text-primary-700">{formatarMoeda(valorTotal)}</span>
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
    </div>
  )
}
