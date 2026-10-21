
import { useEffect, useState } from 'react'
import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
} from '../../api/services'
import type { Usuario } from '../../types'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'

const vazio = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'MEMBRO',
}

export function Membros() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [aviso, setAviso] = useState('')
  const [erroExclusao, setErroExclusao] = useState('')
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false)
  const [membroSelecionado, setMembroSelecionado] = useState<number | null>(null)
  const [processandoExclusao, setProcessandoExclusao] = useState(false)

  async function carregar() {
    try {
      setUsuarios(await listarUsuarios())
    } catch (erro) {
      console.error('Erro ao carregar membros:', erro)
      setAviso('Não foi possível carregar os membros.')
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function iniciarEdicao(u: Usuario) {
    setEditandoId(u.id)
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      perfil: u.perfil,
    })
    setMostrarForm(true)
    setMostrarSenha(false)
    setErro('')
    setAviso('')
  }

  function novoMembro() {
    setEditandoId(null)
    setForm(vazio)
    setMostrarForm(true)
    setMostrarSenha(false)
    setErro('')
    setAviso('')
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    try {
      if (editandoId !== null) {
        const payload: {
          nome: string
          email: string
          perfil: string
          senha?: string
        } = {
          nome: form.nome,
          email: form.email,
          perfil: form.perfil,
        }

        if (form.senha) {
          payload.senha = form.senha
        }

        await atualizarUsuario(editandoId, payload)
      } else {
        await criarUsuario(form)
      }

      setMostrarForm(false)
      setForm(vazio)
      setEditandoId(null)
      await carregar()
    } catch (err: any) {
      setErro(
        err?.response?.data?.mensagem ||
          'Não foi possível salvar o membro.'
      )
    }
  }

  async function alternarAtivo(u: Usuario) {
    setAviso('')

    try {
      await atualizarUsuario(u.id, { ativo: !u.ativo })
      await carregar()
    } catch (erro) {
      console.error('Erro ao alterar status do membro:', erro)
      setAviso('Não foi possível alterar o status do membro.')
    }
  }

  function solicitarExclusao(id: number) {
    setMembroSelecionado(id)
    setErroExclusao('')
    setAviso('')
    setConfirmacaoAberta(true)
  }

  async function excluir() {
    if (membroSelecionado === null || processandoExclusao) {
      return
    }

    setErroExclusao('')
    setAviso('')
    setProcessandoExclusao(true)

    try {
      const resultado = await excluirUsuario(membroSelecionado)

      setConfirmacaoAberta(false)
      setMembroSelecionado(null)

      if (!resultado.excluido) {
        setAviso(
          'Este membro possui registros vinculados. A conta foi desativada em vez de excluída.'
        )
      }

      await carregar()
    } catch (erro) {
      console.error('Erro ao excluir membro:', erro)
      setErroExclusao(
        'Não foi possível excluir o membro. Tente novamente.'
      )
    } finally {
      setProcessandoExclusao(false)
    }
  }

  function cancelarConfirmacao() {
    if (processandoExclusao) return

    setConfirmacaoAberta(false)
    setMembroSelecionado(null)
    setErroExclusao('')
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        aberto={confirmacaoAberta}
        titulo="Excluir membro"
        mensagem={
          erroExclusao ||
          'Tem certeza de que deseja excluir este membro?'
        }
        textoConfirmar="Excluir"
        processando={processandoExclusao}
        onConfirmar={excluir}
        onCancelar={cancelarConfirmacao}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-800">
          Membros da equipe
        </h2>

        <button
          type="button"
          onClick={novoMembro}
          className="min-h-11 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
        >
          + Membro
        </button>
      </div>

      {aviso && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-700" role="status">
            ⚠️ {aviso}
          </p>
        </Card>
      )}

      {mostrarForm && (
        <Card className="max-w-md">
          <form onSubmit={salvar} className="space-y-3">
            <input
              required
              placeholder="Nome"
              value={form.nome}
              onChange={(e) =>
                setForm({ ...form, nome: e.target.value })
              }
              className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />

            <input
              required
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />

            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                placeholder={
                  editandoId !== null
                    ? 'Nova senha (opcional)'
                    : 'Senha'
                }
                required={editandoId === null}
                value={form.senha}
                onChange={(e) =>
                  setForm({ ...form, senha: e.target.value })
                }
                className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 pr-20 text-sm"
              />

              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-0 top-0 h-full px-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            <select
              value={form.perfil}
              onChange={(e) =>
                setForm({ ...form, perfil: e.target.value })
              }
              className="min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="MEMBRO">Membro</option>
              <option value="ADMIN">Administrador</option>
            </select>

            {erro && (
              <p className="text-sm text-red-600" role="alert">
                {erro}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="min-h-11 flex-1 rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white"
              >
                Salvar
              </button>

              <button
                type="button"
                onClick={() => {
                  setMostrarForm(false)
                  setErro('')
                }}
                className="min-h-11 flex-1 rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-5">
        {/* Membros ativos */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Membros ativos
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {usuarios
              .filter((u) => u.ativo)
              .map((u) => (
                <Card key={u.id}>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {u.nome}
                    </p>

                    <p className="break-words text-sm text-slate-500">
                      {u.email}
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        u.perfil === 'ADMIN'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {u.perfil === 'ADMIN'
                        ? 'Administrador'
                        : 'Membro'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(u)}
                      className="min-h-11 text-sm font-semibold text-primary-600"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => alternarAtivo(u)}
                      className="min-h-11 text-sm font-semibold text-amber-600"
                    >
                      Desativar
                    </button>

                    <button
                      type="button"
                      onClick={() => solicitarExclusao(u.id)}
                      className="min-h-11 text-sm font-semibold text-red-500"
                    >
                      Excluir
                    </button>
                  </div>
                </Card>
              ))}

            {usuarios.filter((u) => u.ativo).length === 0 && (
              <p className="text-sm text-slate-400">
                Nenhum membro ativo.
              </p>
            )}
          </div>
        </div>

        {/* Membros inativos */}
        {usuarios.some((u) => !u.ativo) && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
              Membros inativos
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {usuarios
                .filter((u) => !u.ativo)
                .map((u) => (
                  <Card key={u.id} className="opacity-60">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {u.nome}
                      </p>

                      <p className="break-words text-sm text-slate-500">
                        {u.email}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.perfil === 'ADMIN'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {u.perfil === 'ADMIN'
                          ? 'Administrador'
                          : 'Membro'}
                      </span>

                      <span className="ml-1 mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        Inativo
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(u)}
                        className="min-h-11 text-sm font-semibold text-primary-600"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => alternarAtivo(u)}
                        className="min-h-11 text-sm font-semibold text-amber-600"
                      >
                        Ativar
                      </button>

                      <button
                        type="button"
                        onClick={() => solicitarExclusao(u.id)}
                        className="min-h-11 text-sm font-semibold text-red-500"
                      >
                        Excluir
                      </button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
