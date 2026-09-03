import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Database, Upload, FileJson, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { IconBox } from '../../components/ui/IconBox';
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <IconBox icon={Database} tone="navy" size="md" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
              Respaldar datos
            </h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              Descarga una copia de seguridad de toda tu información.
            </p>
          </div>
        </div>
      </header>

      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <IconBox icon={FileJson} tone="info" size="md" />
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

      <Button variant="primary" size="lg" icon={Database} onClick={handleDownload} fullWidth>
        Descargar respaldo completo
      </Button>

      <section className="space-y-3">
        <SectionTitle title="Restaurar desde archivo" />
        <Card className="p-5">
          {!preview && !error && (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-card border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition-colors hover:border-gold-400 hover:bg-gold-50/30 dark:border-navy-600 dark:bg-navy-700/30 dark:hover:border-gold-400 dark:hover:bg-gold-500/10">
              <Upload className="h-8 w-8 text-neutral-400 dark:text-navy-300" />
              <div>
                <p className="text-sm font-semibold text-navy-700 dark:text-navy-100">
                  Tocá para seleccionar un archivo
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-navy-300">
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
            <Alert tone="danger" title="No se pudo leer el archivo">
              {error}
            </Alert>
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
    <div className="rounded-input bg-white p-2 text-center dark:bg-navy-800">
      <p className="section-label">{label}</p>
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
      <Alert tone="success" title="Archivo válido">
        <span className="font-mono">{fileName}</span>
        {exportedAt && (
          <span className="ml-2 inline-flex items-center gap-1">
            <Calendar className="inline h-3 w-3" aria-hidden="true" />
            {exportedAt.toLocaleDateString('es-CR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )}
      </Alert>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Clientes" value={counts.clientes} />
        <Stat label="Préstamos" value={counts.prestamos} />
        <Stat label="Cobros" value={counts.cobros} />
        <Stat label="Notificaciones" value={counts.notificaciones} />
      </div>

      <Alert tone="warning" title="Atención">
        Restaurar reemplazará TODOS los datos actuales por los del archivo. Esta acción no se puede
        deshacer.
      </Alert>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} fullWidth>
          Cancelar
        </Button>
        <Button variant="emerald" onClick={onConfirm} fullWidth>
          Confirmar y restaurar
        </Button>
      </div>
    </div>
  );
}

export default RespaldoPage;
