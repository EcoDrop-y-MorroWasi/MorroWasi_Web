import { useRef, useState } from 'react'
import { signOut } from '../utils/authStore'
import { applyImportedProgress, exportProgress, readProgressFile, type ImportPreview } from '../utils/progressBackup'
import {
  generateSyncCode,
  getLinkedCode,
  resolveConflict,
  setLinkedCode,
  syncProgress,
  type SyncResult,
} from '../utils/progressSync'

export const Config = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const [code, setCode] = useState(() => getLinkedCode() ?? '')
  const [codeInput, setCodeInput] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [conflict, setConflict] = useState<Extract<SyncResult, { status: 'conflicto' }> | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError(null)
    try {
      setPreview(await readProgressFile(file))
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'No se pudo leer el archivo.')
    }
  }

  const runSync = async (targetCode: string) => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncProgress(targetCode)
      setLinkedCode(targetCode)
      setCode(targetCode)
      if (result.status === 'conflicto') {
        setConflict(result)
      } else {
        const mensajes: Record<Exclude<SyncResult['status'], 'conflicto'>, string | null> = {
          'sin-cambios': 'Ya estaba todo sincronizado.',
          subido: null,
          descargado: 'Se aplicó el progreso del servidor (recargando)…',
        }
        setSyncMessage(mensajes[result.status])
      }
    } catch (err) {
      setSyncMessage(err instanceof Error ? `Error: ${err.message}` : 'No se pudo sincronizar.')
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateCode = () => {
    const nuevo = generateSyncCode()
    void runSync(nuevo)
  }

  const handleLinkCode = () => {
    const normalizado = codeInput.trim()
    if (normalizado.length !== 10) {
      setSyncMessage('El código tiene 10 caracteres.')
      return
    }
    void runSync(normalizado)
  }

  const handleResolveConflict = async (keep: 'local' | 'remote') => {
    if (!conflict || !code) return
    await resolveConflict(code, keep, conflict)
    setConflict(null)
    if (keep === 'local') setSyncMessage('Guardaste tu progreso local en el servidor, pisando el del código.')
  }

  return (
    <div className="keyline-border rounded-2xl bg-bg-light p-6">
      <h2 className="font-display text-lg font-bold mb-6">Configuración</h2>

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <div className="keyline-border rounded-2xl bg-surface p-4">
          <p className="font-display text-sm font-bold text-secondary">Tema</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl bg-primary/20 border-2 border-primary text-primary py-2 text-sm font-body"
            >
              Claro
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-secondary/20 border-2 border-secondary text-secondary py-2 text-sm font-body"
            >
              Oscuro
            </button>
          </div>
        </div>

        <div className="keyline-border rounded-2xl bg-surface p-4">
          <p className="font-display text-sm font-bold text-secondary">Respaldo de progreso</p>
          <p className="mt-1 font-body text-xs text-ink/60">
            Todo tu progreso vive en este navegador. Descarga un backup o restaura uno para no perderlo.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={exportProgress}
              className="flex-1 rounded-xl bg-primary text-white py-2 text-sm font-body"
            >
              Exportar
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-xl bg-bg-light border-2 border-ink py-2 text-sm font-body"
            >
              Importar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {importError && <p className="mt-2 font-body text-xs text-red-600">{importError}</p>}
        </div>

        <div className="keyline-border rounded-2xl bg-surface p-4">
          <p className="font-display text-sm font-bold text-secondary">Código de acceso</p>
          <p className="mt-1 font-body text-xs text-ink/60">
            Sin email ni Google: un código de 10 caracteres para tener tu progreso en más de un dispositivo.
          </p>

          {code ? (
            <div className="mt-2">
              <p className="font-body text-xs text-ink/60">Tu código:</p>
              <p className="font-display text-lg font-bold tracking-widest text-ink">{code}</p>
              <button
                type="button"
                disabled={syncing}
                onClick={() => runSync(code)}
                className="mt-2 w-full rounded-xl bg-primary text-white py-2 text-sm font-body disabled:opacity-50"
              >
                {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <button
                type="button"
                disabled={syncing}
                onClick={handleGenerateCode}
                className="w-full rounded-xl bg-primary text-white py-2 text-sm font-body disabled:opacity-50"
              >
                Guardar progreso
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Código de otro dispositivo"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="flex-1 rounded-xl border-2 border-ink bg-bg-light px-2 py-2 text-sm font-body tracking-widest"
                />
                <button
                  type="button"
                  disabled={syncing}
                  onClick={handleLinkCode}
                  className="rounded-xl border-2 border-ink bg-bg-light px-3 py-2 text-sm font-body disabled:opacity-50"
                >
                  Vincular
                </button>
              </div>
            </div>
          )}
          {syncMessage && <p className="mt-2 font-body text-xs text-ink/70">{syncMessage}</p>}
        </div>
      </section>

      {conflict && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c1c11]/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border-2 border-ink bg-surface p-6">
            <h3 className="font-display text-base font-bold text-ink">Progreso distinto en cada lado</h3>
            <p className="mt-2 font-body text-xs text-ink/70">
              Este navegador y el código <span className="font-bold">{code}</span> tienen cambios que no coinciden.
              Elegí cuál conservar — el otro se pierde.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 font-body text-xs text-ink/60">
              <p>Este navegador: {new Date(conflict.local.lastModified).toLocaleString()}</p>
              <p>Código: {new Date(conflict.remote.lastModified).toLocaleString()}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleResolveConflict('remote')}
                className="flex-1 rounded-xl bg-bg-light border-2 border-ink py-2 text-sm font-body"
              >
                Usar el del código
              </button>
              <button
                type="button"
                onClick={() => handleResolveConflict('local')}
                className="flex-1 rounded-xl bg-primary text-white py-2 text-sm font-body"
              >
                Usar este navegador
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c1c11]/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border-2 border-ink bg-surface p-6">
            <h3 className="font-display text-base font-bold text-ink">Restaurar progreso</h3>
            <p className="mt-2 font-body text-xs text-ink/70">
              Backup del perfil <span className="font-bold">{preview.profileId}</span>, exportado el{' '}
              {new Date(preview.exportedAt).toLocaleString()}.
            </p>
            <p className="mt-2 font-body text-xs text-ink/70">
              Esto reemplaza tu progreso actual en este navegador ({preview.entries.length} valores). No se puede
              deshacer.
            </p>
            {preview.localIsNewer && (
              <p className="mt-2 rounded-lg bg-red-100 p-2 font-body text-xs text-red-700">
                ⚠️ Tu progreso actual en este navegador es más reciente que este backup. Restaurarlo puede hacerte
                perder avances.
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="flex-1 rounded-xl bg-bg-light border-2 border-ink py-2 text-sm font-body"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => applyImportedProgress(preview)}
                className="flex-1 rounded-xl bg-primary text-white py-2 text-sm font-body"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <div className="keyline-border rounded-2xl bg-surface p-4">
          <p className="font-display text-sm font-bold text-secondary">Notificaciones</p>
          <div className="mt-2 space-y-2">
            <label className="font-body cursor-pointer">
              <input type="checkbox" className="rounded border-2" />
              <span>Recordatorios de misiones diarias</span>
            </label>
            <label className="font-body cursor-pointer">
              <input type="checkbox" className="rounded border-2" checked />
              <span>Alertas de goteo (Eco-Drop)</span>
            </label>
            <label className="font-body cursor-pointer">
              <input type="checkbox" className="rounded border-2" />
              <span>Semana de logros</span>
            </label>
          </div>
        </div>

        <div className="keyline-border rounded-2xl bg-surface p-4">
          <p className="font-display text-sm font-bold text-secondary">Cuenta</p>
          <p className="mt-1 font-body text-xs text-ink/60">
            Entraste sin correo ni contraseña. Tu progreso local no se borra al cerrar sesión, pero si tenías un
            chat abierto vas a perder tu lugar ahí (se crea una identidad nueva al volver a entrar).
          </p>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full rounded-xl bg-primary text-white py-2 text-sm font-body"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-primary/10 p-4">
        <h3 className="font-display text-sm font-bold text-primary mb-2">Información</h3>
        <p className="font-body text-base text-ink/60">
          Versión 2.0.0 · MorroWasi · Datos locales sin conexión ·
          <a
            href="#"
            className="underline text-primary hover:text-accent transition-colors"
          >
            Políticas de privacidad
          </a>
        </p>
      </section>
    </div>
  )
}