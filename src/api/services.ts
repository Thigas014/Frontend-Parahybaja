import { api } from './client'
import type {
  Aporte,
  Configuracao,
  Dashboard,
  DiaDeVenda,
  Despesa,
  Presenca,
  StatusPresenca,
  Usuario,
  Venda
} from '../types'

// ---------- Auth ----------
export async function login(email: string, senha: string) {
  const { data } = await api.post('/auth/login', { email, senha })
  return data as { token: string; id: number; nome: string; email: string; perfil: string }
}

// ---------- Usuários ----------
export async function listarUsuarios() {
  const { data } = await api.get<Usuario[]>('/usuarios')
  return data
}

export async function criarUsuario(payload: { nome: string; email: string; senha: string; perfil: string }) {
  const { data } = await api.post<Usuario>('/usuarios', payload)
  return data
}

export async function atualizarUsuario(id: number, payload: Partial<{ nome: string; email: string; senha: string; perfil: string; ativo: boolean }>) {
  const { data } = await api.put<Usuario>(`/usuarios/${id}`, payload)
  return data
}

export async function excluirUsuario(id: number) {
  await api.delete(`/usuarios/${id}`)
}

// ---------- Vendas (fechamento de caixa: notas + moedas por denominação + pix) ----------
export interface FechamentoPayload {
  data: string
  notas2: number
  notas5: number
  notas10: number
  notas20: number
  notas50: number
  moedas1: number
  moedas050: number
  moedas025: number
  moedas010: number
  moedas005: number
  valorPix: number
}

export async function listarVendas(inicio?: string, fim?: string) {
  const { data } = await api.get<Venda[]>('/vendas', { params: inicio && fim ? { inicio, fim } : {} })
  return data
}

export async function registrarFechamento(payload: FechamentoPayload) {
  const { data } = await api.post<Venda>('/vendas', payload)
  return data
}

export async function atualizarFechamento(id: number, payload: FechamentoPayload) {
  const { data } = await api.put<Venda>(`/vendas/${id}`, payload)
  return data
}

export async function excluirFechamento(id: number) {
  await api.delete(`/vendas/${id}`)
}

// ---------- Dashboard ----------
export async function obterDashboard() {
  const { data } = await api.get<Dashboard>('/dashboard')
  return data
}

// ---------- Configuração / Meta / Taxa ----------
export async function obterConfiguracao() {
  const { data } = await api.get<Configuracao>('/configuracao')
  return data
}

export async function atualizarMeta(metaFinanceira: number) {
  const { data } = await api.put<Configuracao>('/configuracao/meta', { metaFinanceira })
  return data
}

export async function atualizarTaxas(valorTaxaJustificado: number, valorTaxaSemJustificativa: number) {
  const { data } = await api.put<Configuracao>('/configuracao/taxas', { valorTaxaJustificado, valorTaxaSemJustificativa })
  return data
}

// ---------- Aportes (doações / contribuições extras) ----------
export async function listarAportes() {
  const { data } = await api.get<Aporte[]>('/aportes')
  return data
}

export async function criarAporte(descricao: string, valor: number) {
  const { data } = await api.post<Aporte>('/aportes', { descricao, valor })
  return data
}

export async function excluirAporte(id: number) {
  await api.delete(`/aportes/${id}`)
}

// ---------- Despesas (gastos de reposição) ----------
export async function listarDespesas() {
  const { data } = await api.get<Despesa[]>('/despesas')
  return data
}

export async function criarDespesa(descricao: string, valor: number) {
  const { data } = await api.post<Despesa>('/despesas', { descricao, valor })
  return data
}

export async function excluirDespesa(id: number) {
  await api.delete(`/despesas/${id}`)
}

// ---------- Presenças ----------
export async function listarPresencas(data: string) {
  const { data: resp } = await api.get<Presenca[]>('/presencas', { params: { data } })
  return resp
}

export async function justificarAusencia(data: string, justificativa: string) {
  const { data: resp } = await api.post<Presenca>('/presencas/justificativa', { data, justificativa })
  return resp
}

export async function marcarPresenca(usuarioId: number, data: string, status: StatusPresenca) {
  const { data: resp } = await api.post<Presenca>('/presencas/marcar', { usuarioId, data, status })
  return resp
}

export async function marcarTaxaPaga(id: number, paga: boolean) {
  const { data } = await api.patch<Presenca>(`/presencas/${id}/taxa-paga`, null, { params: { paga } })
  return data
}

// ---------- Dias de venda (calendário) ----------
export async function listarDiasDeVenda(inicio?: string, fim?: string) {
  const { data } = await api.get<DiaDeVenda[]>('/dias-de-venda', { params: inicio && fim ? { inicio, fim } : {} })
  return data
}

export async function criarDiaDeVenda(data: string) {
  const { data: resp } = await api.post<DiaDeVenda>('/dias-de-venda', { data })
  return resp
}

export async function excluirDiaDeVenda(id: number) {
  await api.delete(`/dias-de-venda/${id}`)
}
