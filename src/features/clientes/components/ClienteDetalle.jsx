import React from 'react';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, MapPin, Phone, Wallet, TrendingUp, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { IconBox } from '../../../components/ui/IconBox';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatPhoneCR } from '../../../lib/format';
import { useDataChange } from '../../../lib/hooks/useDataChange';
import { showToast } from '../../../components/ui/Toast';
import * as clientesService from '../../../services/clientes';
import { ClienteTienePrestamosError, remove as removeCliente, create as createCliente } from '../../../services/clientes';
import * as prestamosService from '../../../services/prestamos';
import { PrestamoCard } from '../../prestamos/components/PrestamoCard';
import { PrestamoEditModal } from '../../prestamos/components/PrestamoEditModal';
import { DeletePrestamoConfirm } from '../../prestamos/components/DeletePrestamoConfirm';
import { ClienteFormFlow } from './ClienteFormFlow';
import { DeleteConfirm } from './DeleteConfirm';
import { usePrestamosCliente } from '../../prestamos/hooks/usePrestamosCliente';
import { statsCliente } from '../../../lib/resumen';

export function ClienteDetalle({ onNavigate, params }) {
  const clienteId = params?.clienteId;
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const prestamos = usePrestamosCliente(clienteId);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editCliente, setEditCliente] = useState(false);
  const [deleteCliente, setDeleteCliente] = useState(false);
  const [deletingCliente, setDeletingCliente] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const c = await clientesService.getById(clienteId);
        if (!cancelled) {
          setCliente(c);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clienteId]);

  useDataChange(() => {
    clientesService.getById(clienteId).then(setCliente);
  });

  const [stats, setStats] = useState({ total: 0, vigentes: 0, atrasados: 0, cancelados: 0 });
  useEffect(() => {
    let cancelled = false;
    statsCliente(clienteId)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [clienteId]);
  useDataChange(() => {
    statsCliente(clienteId).then(setStats).catch(() => {});
  });

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-neutral-600 dark:text-navy-300">Cliente no encontrado.</p>
        <Button variant="primary" onClick={() => onNavigate?.('clientes')}>
          Volver a Clientes
        </Button>
      </div>
    );
  }

  function handleOpenPrestamo(p) {
    onNavigate?.('prestamo-detalle', { prestamoId: p.id, clienteId });
  }

  function handleEditPrestamo(p) {
    setEditTarget(p);
  }

  function handleDeletePrestamo(p) {
    setDeleteTarget(p);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await prestamosService.remove(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Préstamo eliminado', 'success');
    } catch (err) {
      showToast(err.message || 'Error al eliminar el préstamo', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleConfirmDeleteCliente() {
    if (!cliente) return;
    const backup = { ...cliente };
    setDeletingCliente(true);
    try {
      await removeCliente(cliente.id);
      setDeleteCliente(false);
      showToast('Cliente eliminado', 'success', {
        label: 'Deshacer',
        duration: 8000,
        onClick: async () => {
          try {
            await createCliente({
              nombre: backup.nombre,
              cedula: backup.cedula,
              telefono: backup.telefono,
              direccion: backup.direccion,
            });
            showToast('Cliente restaurado', 'success');
          } catch (err) {
            showToast(err.message || 'Error al restaurar', 'error');
          }
        },
      });
      onNavigate?.('clientes', {});
    } catch (err) {
      if (err instanceof ClienteTienePrestamosError) {
        showToast(
          `No se puede eliminar: tiene ${err.cantidadPrestamos} préstamo(s) activo(s)`,
          'error',
        );
        return;
      }
      showToast(err.message || 'Error al eliminar cliente', 'error');
    } finally {
      setDeletingCliente(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <Button
        variant="ghost"
        size="sm"
        icon={ArrowLeft}
        onClick={() => onNavigate?.('clientes')}
        className="!w-fit"
      >
        Volver a Clientes
      </Button>

      <Card className="relative overflow-hidden p-0">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-200/40 blur-3xl dark:bg-gold-500/10" />
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar nombre={cliente.nombre} size="lg" />
              <div className="min-w-0">
                <h1 className="truncate font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl dark:text-white">
                  {cliente.nombre}
                </h1>
                <p className="truncate text-sm text-neutral-600 dark:text-navy-300">{cliente.cedula}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Pencil}
                onClick={() => setEditCliente(true)}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setDeleteCliente(true)}
              >
                Eliminar
              </Button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="glass-subtle flex items-center gap-2 rounded-input px-3 py-2">
              <IconBox icon={Phone} tone="neutral" size="sm" />
              <span className="text-sm text-navy-900 dark:text-white">
                {formatPhoneCR(cliente.telefono)}
              </span>
            </div>
            <div className="glass-subtle flex items-start gap-2 rounded-input px-3 py-2">
              <IconBox icon={MapPin} tone="neutral" size="sm" />
              <span className="text-sm text-navy-900 dark:text-white">{cliente.direccion}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatTile icon={Wallet} label="Préstamos" value={stats.total} tone="navy" />
        <StatTile icon={TrendingUp} label="Vigentes" value={stats.vigentes} tone="emerald" />
        <StatTile
          icon={AlertTriangle}
          label="Atrasados"
          value={stats.atrasados}
          tone={stats.atrasados > 0 ? 'rose' : 'slate'}
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        icon={Plus}
        onClick={() => onNavigate?.('registrar-prestamo', { clienteId })}
        fullWidth
      >
        Registrar préstamo
      </Button>

      <section className="space-y-2">
        <h2 className="section-label">Préstamos del cliente</h2>
        {prestamos.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Este cliente aún no tiene préstamos"
            description="Tocá 'Registrar préstamo' para crear el primero."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {prestamos.map((p) => (
              <li key={p.id} className="animate-fade-in">
                <PrestamoCard
                  prestamo={p}
                  onOpen={handleOpenPrestamo}
                  onEdit={handleEditPrestamo}
                  onDelete={handleDeletePrestamo}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {editTarget && (
        <PrestamoEditModal
          prestamo={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeletePrestamoConfirm
          prestamo={{ ...deleteTarget, nombre_cliente: cliente.nombre.split(' ')[0] || 'cliente' }}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {editCliente && (
        <ClienteFormFlow
          cliente={cliente}
          onClose={() => setEditCliente(false)}
          onSaved={() => {
            setEditCliente(false);
            showToast('Cambios guardados correctamente', 'success');
          }}
        />
      )}

      {deleteCliente && (
        <DeleteConfirm
          cliente={cliente}
          onConfirm={handleConfirmDeleteCliente}
          onCancel={() => (deletingCliente ? null : setDeleteCliente(false))}
        />
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }) {
  const tones = {
    navy: 'navy',
    emerald: 'emerald',
    rose: 'rose',
    slate: 'neutral',
  };
  return (
    <Card padding="sm" hover>
      <div className="flex items-center gap-3">
        <IconBox icon={Icon} tone={tones[tone]} size="md" />
        <div>
          <p className="section-label">{label}</p>
          <p className="text-xl font-bold tabular-nums text-navy-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default ClienteDetalle;
