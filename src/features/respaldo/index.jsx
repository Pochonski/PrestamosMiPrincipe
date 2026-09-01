import { useEffect, useRef, useState } from 'react';
import { Database, Upload, FileJson, AlertTriangle, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { showToast } from '../../components/ui/Toast';
import { onDataChanged } from '../../lib/events';
import * as notifService from '../../services/notificaciones';
import { RestoreConfirm } from './components/RestoreConfirm';
import {
  buildBackup,
  downloadBackup,
  parseBackupFile,
  previewBackup,
  applyBackup,
} from './selectors';

export function RespaldoPage() {
  const [preview, setPreview] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    clientes: 0,
    prestamos: 0,
    cobros: 0,
    notificaciones: 0,
  });
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  async function refreshStats() {
    try {
      const backup = await buildBackup();
      setStats({
        clientes: (backup.data.clientes || []).length,
        prestamos: (backup.data.prestamos || []).length,
        cobros: (backup.data.cobros || []).length,
        notificaciones: (backup.data.notificaciones || []).length,
      });
    } catch {
      setStats({ clientes: 0, prestamos: 0, cobros: 0, notificaciones: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStats();
    return onDataChanged(refreshStats);
  }, []);

  async function handleDownload() {
    try {
      await downloadBackup();
      notifService.create({
        tipo: 'info',
        titulo: 'Respaldo descargado',
        mensaje: 'Tu información está al día y respaldada.',
      });
      showToast('Respaldo descargado', 'success');
    } catch {
      showToast('Error al generar el respaldo', 'error');
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setPreview(null);
    setFileName(file.name);
    try {
      const parsed = await parseBackupFile(file);
      setPreview(parsed);
    } catch (err) {
      setError(err.message);
      setFileName(null);
    }
  }

  function handleRestore() {
    if (!preview) return;
    setConfirmOpen(true);
  }

  async function doRestore() {
    setConfirmOpen(false);
    try {
      await applyBackup(preview);
      showToast('Datos restaurados. Recargando...', 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      showToast('Error al restaurar', 'error');
    }
  }

  function handleCancel() {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 dark:bg-navy-700/50 dark:text-navy-100">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-900 sm:text-2xl dark:text-white">
              Respaldar datos
            </h1>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-navy-300">
              Descarga una copia de seguridad de toda tu información.
            </p>
          </div>
        </div>
      </header>

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <FileJson className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-navy-900 dark:text-white">Datos actuales</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Clientes" value={stats.clientes} />
              <Stat label="Préstamos" value={stats.prestamos} />
              <Stat label="Cobros" value={stats.cobros} />
              <Stat label="Notificaciones" value={stats.notificaciones} />
            </div>
          </div>
        </div>
      </Card>

      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-4 py-3.5 text-sm font-bold text-navy-900 shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] sm:text-base"
      >
        <Database className="h-5 w-5" />
        Descargar respaldo completo
      </button>

      <section className="space-y-3">
        <SectionTitle title="Restaurar desde archivo" />
        <Card className="p-5">
          {!preview && !error && (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition-colors hover:border-gold-400 hover:bg-gold-50/30 dark:border-navy-600 dark:bg-navy-700/30 dark:hover:border-gold-400 dark:hover:bg-gold-500/10">
              <Upload className="h-8 w-8 text-slate-400 dark:text-navy-300" />
              <div>
                <p className="text-sm font-semibold text-navy-700 dark:text-navy-100">
                  Tocá para seleccionar un archivo
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-navy-300">
                  Archivo JSON exportado previamente
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-500/40 dark:bg-rose-500/10">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
              <div>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                  No se pudo leer el archivo
                </p>
                <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            </div>
          )}

          {preview && (
            <RestorePreview
            fileName={fileName}
            preview={preview}
            onCancel={handleCancel}
            onConfirm={handleRestore}
          />
          )}
        </Card>
      </section>

      {confirmOpen && preview && (
        <RestoreConfirm
          backupDate={preview.exportedAt}
          onConfirm={doRestore}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-2 text-center dark:bg-navy-800">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-300">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-navy-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function RestorePreview({ fileName, preview, onCancel, onConfirm }) {
  const counts = previewBackup(preview).counts;
  const exportedAt = preview.exportedAt ? new Date(preview.exportedAt) : null;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Archivo válido
          </p>
          <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
            <span className="font-mono">{fileName}</span>
            {exportedAt && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Calendar className="inline h-3 w-3" />
                {exportedAt.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Clientes" value={counts.clientes} />
        <Stat label="Préstamos" value={counts.prestamos} />
        <Stat label="Cobros" value={counts.cobros} />
        <Stat label="Notificaciones" value={counts.notificaciones} />
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Atención
            </p>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
              Restaurar reemplazará TODOS los datos actuales por los del archivo. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          Confirmar y restaurar
        </button>
      </div>
    </div>
  );
}

export default RespaldoPage;