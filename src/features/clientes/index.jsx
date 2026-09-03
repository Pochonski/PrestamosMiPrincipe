import React from 'react';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { StatCard } from '../../components/ui/StatCard';
import { ClienteSearch } from './components/ClienteSearch';
import { ClientesList } from './components/ClientesList';
import { ClienteFAB } from './components/ClienteFAB';
import { ClienteFormFlow } from './components/ClienteFormFlow';
import { DeleteConfirm } from './components/DeleteConfirm';
import { showToast } from '../../components/ui/Toast';
import { useClientes } from './hooks/useClientes';
import {
  ClienteTienePrestamosError,
  remove as removeCliente,
  create as createCliente,
} from '../../services/clientes';

export function ClientesPage({ onNavigate, params }) {
  const { clientes, query, setQuery, loading, hasMore, loadingMore, loadMore, PAGE_SIZE } =
    useClientes();
  const [formMode, setFormMode] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    if (params?.autoCreate && formMode === null) {
      setFormMode('create');
      onNavigate?.('clientes', {});
    }
  }, [params?.autoCreate, formMode, onNavigate]);

  function openCreate() {
    setFormMode('create');
  }

  function openEdit(cliente) {
    setFormMode({ type: 'edit', cliente });
  }

  function closeForm() {
    setFormMode(null);
  }

  async function handleSaved() {
    const isEdit = formMode?.type === 'edit';
    showToast(isEdit ? 'Cambios guardados correctamente' : 'Cliente creado correctamente', 'success');
    closeForm();
  }

  async function handleDelete() {
    if (!toDelete) return;
    const backup = { ...toDelete };
    try {
      await removeCliente(backup.id);
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
    } catch (err) {
      if (err instanceof ClienteTienePrestamosError) {
        showToast(
          `No se puede eliminar: tiene ${err.cantidadPrestamos} préstamo(s) activo(s)`,
          'error',
        );
        return;
      }
      showToast(err.message || 'Error al eliminar cliente', 'error');
    }
  }

  function requestDelete(cliente) {
    setToDelete(cliente);
  }

  async function confirmDelete() {
    await handleDelete();
    setToDelete(null);
  }

  function handleOpen(cliente) {
    onNavigate?.('cliente-detalle', { clienteId: cliente.id });
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <section className="space-y-2">
        <SectionTitle title="Resumen" />
        <StatCard
          label="Clientes registrados"
          value={clientes.length}
          sub="Total en cartera"
          icon={Users}
          tone="gold"
        />
      </section>

      <section className="space-y-3">
        <SectionTitle title="Directorio" />
        <ClienteSearch
          value={query}
          onChange={setQuery}
          total={clientes.length}
          filtered={clientes.length}
        />
      </section>

      <ClientesList
        clientes={clientes}
        query={query}
        onOpen={handleOpen}
        onEdit={openEdit}
        onDelete={requestDelete}
        onCreate={openCreate}
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadMore={loadMore}
        PAGE_SIZE={PAGE_SIZE}
      />

      <ClienteFAB onClick={openCreate} />

      {formMode && (
        <ClienteFormFlow
          cliente={formMode.cliente || null}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <DeleteConfirm cliente={toDelete} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
      )}
    </div>
  );
}

export default ClientesPage;
