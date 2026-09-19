export type Perfil = 'ADMIN' | 'MEMBRO'

export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
}

export interface Venda {
  id: number
  data: string // yyyy-MM-dd

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

  valorNotas: number
  valorMoedas: number
  valorTotal: number

  registradoPorNome: string
  dataHora: string
}

export interface Aporte {
  id: number
  descricao: string
  valor: number
  registradoPorNome: string
  dataHora: string
}

export interface Despesa {
  id: number
  descricao: string
  valor: number
  registradoPorNome: string
  dataHora: string
}

export type StatusPresenca = 'PRESENTE' | 'JUSTIFICADO' | 'AUSENTE'

export interface Presenca {
  id: number
  data: string
  usuarioId: number
  usuarioNome: string
  status: StatusPresenca | null
  justificativa: string | null
  taxaValor: number | null
  taxaPaga: boolean
}

export interface DiaDeVenda {
  id: number
  data: string
  criadoPorNome: string
}

export interface Dashboard {
  metaSemanal: number
  inicioSemana: string
  fimSemana: string
  totalBruto: number
  totalLiquido: number
  percentualBruto: number
  percentualLiquido: number
  totalVendasSemana: number
  totalAportesSemana: number
  totalDespesasSemana: number
  dataUltimaVenda: string | null
  proximaVendaMarcada: string | null
}

export interface Configuracao {
  id: number
  metaFinanceira: number
  valorTaxaJustificado: number
  valorTaxaSemJustificativa: number
}
