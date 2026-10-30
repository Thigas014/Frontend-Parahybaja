
import { useEffect, useId, useRef } from 'react'

type ConfirmDialogProps = {
  aberto: boolean
  titulo: string
  mensagem: string
  textoConfirmar?: string
  processando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  processando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const tituloId = useId()
  const mensagemId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const focoAnteriorRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!aberto) return

    focoAnteriorRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    cancelarRef.current?.focus()

    function tratarTeclado(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()

        if (!processando) {
          onCancelar()
        }

        return
      }

      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const botoes = Array.from(
        dialog.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled)'
        )
      )

      if (botoes.length === 0) {
        event.preventDefault()
        return
      }

      const primeiro = botoes[0]
      const ultimo = botoes[botoes.length - 1]

      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault()
        ultimo.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === ultimo
      ) {
        event.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', tratarTeclado)

    return () => {
      document.removeEventListener('keydown', tratarTeclado)
      focoAnteriorRef.current?.focus()
    }
  }, [aberto, processando, onCancelar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={mensagemId}
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
      >
        <h2
          id={tituloId}
          className="text-lg font-bold text-slate-800"
        >
          {titulo}
        </h2>

        <p
          id={mensagemId}
          className="mt-2 break-words text-sm leading-6 text-slate-600"
        >
          {mensagem}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            disabled={processando}
            className="min-h-11 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={processando}
            className="min-h-11 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {processando ? 'Processando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
