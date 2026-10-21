import { useEffect, useMemo, useState } from 'react'
import { criarDiaDeVenda, excluirDiaDeVenda, listarDiasDeVenda } from '../api/services'
import type { DiaDeVenda } from '../types'
import { Card } from '../components/Card'
import { useAuth } from '../context/AuthContext'
import { ConfirmDialog } from '../components/ConfirmDialog'

const nomesMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function paraISO(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export function Calendario() {
  const { isAdmin } = useAuth()
  const hoje = new Date()
  const [mesAtual, setMesAtual] = useState(hoje.getMonth())
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear())
  const [dias, setDias] = useState<DiaDeVenda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [processandoRemocao, setProcessandoRemocao] = useState(false)
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false)
  const [diaSelecionado, setDiaSelecionado] = useState<{
    id: number
    dia: number
    mes: number
  } | null>(null)

  async function carregar() {
    setCarregando(true)
    setDias(await listarDiasDeVenda())
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const marcados = useMemo(() => {
    const mapa = new Map<string, DiaDeVenda>()
    dias.forEach((d) => mapa.set(d.data, d))
    return mapa
  }, [dias])

  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay()
  const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate()
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1)
  ]

  function mudarMes(delta: number) {
    let novoMes = mesAtual + delta
    let novoAno = anoAtual
    if (novoMes < 0) { novoMes = 11; novoAno -= 1 }
    if (novoMes > 11) { novoMes = 0; novoAno += 1 }
    setMesAtual(novoMes)
    setAnoAtual(novoAno)
  }

 async function clicarDia(dia: number) {
  if (!isAdmin) return

  const iso = paraISO(anoAtual, mesAtual, dia)
  const existente = marcados.get(iso)

  if (existente) {
    setDiaSelecionado({
      id: existente.id,
      dia,
      mes: mesAtual + 1,
    })
    setConfirmacaoAberta(true)
    return
  }

  await criarDiaDeVenda(iso)
  await carregar()
  }

  
async function confirmarRemocao() {
  if (!diaSelecionado || processandoRemocao) return

  setProcessandoRemocao(true)

  try {
    await excluirDiaDeVenda(diaSelecionado.id)

    setConfirmacaoAberta(false)
    setDiaSelecionado(null)

    await carregar()
  } catch (erro) {
    console.error('Erro ao remover dia de venda:', erro)
    alert('Não foi possível remover o dia de venda. Tente novamente.')
  } finally {
    setProcessandoRemocao(false)
  }
}


  const isHoje = (dia: number) =>
    dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4 pb-24 lg:pb-6">
      <h1 className="text-xl font-bold text-slate-800">📅 Calendário de vendas</h1>
      {isAdmin && (
        <p className="text-xs text-slate-500">Toque numa data para marcar ou desmarcar como dia de venda.</p>
      )}

      <ConfirmDialog
      aberto={confirmacaoAberta}
      titulo="Remover dia de venda"
      mensagem={
        diaSelecionado
          ? `Deseja remover ${diaSelecionado.dia}/${diaSelecionado.mes} como dia de venda?`
          : 'Deseja remover este dia de venda?'
      }
      textoConfirmar="Remover"
      processando={processandoRemocao}
      onConfirmar={confirmarRemocao}
      onCancelar={() => {
        setConfirmacaoAberta(false)
        setDiaSelecionado(null)
      }}
      />
  
      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => mudarMes(-1)} className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-600">‹</button>
          <span className="font-semibold text-slate-800">{nomesMeses[mesAtual]} de {anoAtual}</span>
          <button onClick={() => mudarMes(1)} className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-600">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-2">
          {diasSemana.map((d, i) => <div key={i}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celulas.map((dia, i) => {
            if (dia === null) return <div key={i} />
            const iso = paraISO(anoAtual, mesAtual, dia)
            const marcado = marcados.has(iso)
            return (
              <button
                key={i}
                onClick={() => clicarDia(dia)}
                disabled={!isAdmin}
                className={`aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                  marcado
                    ? 'bg-primary-600 text-white'
                    : isHoje(dia)
                      ? 'bg-primary-50 text-primary-600 border border-primary-300'
                      : 'text-slate-600 hover:bg-slate-50'
                } ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {dia}
              </button>
            )
          })}
        </div>
      </Card>

      {!carregando && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Próximas datas marcadas</p>
          {dias.filter((d) => d.data >= paraISO(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())).length === 0 ? (
            <Card><p className="text-slate-400 text-sm text-center py-4">Nenhuma data futura marcada ainda.</p></Card>
          ) : (
            dias
              .filter((d) => d.data >= paraISO(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()))
              .map((d) => {
                const [ano, mes, dia] = d.data.split('-')
                return (
                  <Card key={d.id} className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{dia}/{mes}/{ano}</span>
                    <span className="text-xs text-slate-500">marcado por {d.criadoPorNome}</span>
                  </Card>
                )
              })
          )}
        </div>
      )}
    </div>
  )
}
