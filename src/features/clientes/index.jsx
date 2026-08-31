import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
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
} from '../../services/clientes';

export function ClientesPage({ onNavigate, params }) {
  const { clientes, query, setQuery } = useClientes();
  const [formMode, setFormMode] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    if (params?.autoCreate && formMode === null) {
      // eslint-disable-next-line react/set-state-in-effect
      setFormMode('create');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.autoCreate]);

  function openCreate() {
    setFormMode('create');
  }

  function openEdit(cliente) {
    setFormMode({ type: 'edit', cliente });
  }

  function closeForm() {
    setFormMode(null);
  }

  function handleSaved() {
    const isEdit = formMode?.type === 'edit';
    showToast(
      isEdit ? 'Cambios guardados correctamente' : 'Cliente creado correctamente',
      'success',
    );
    closeForm();
  }

  function handleDelete() {
    if (!toDelete) return;
    try {
      removeCliente(toDelete.id);
      showToast('Cliente eliminado', 'success');
    } catch (err) {
      if (err instanceof ClienteTienePrestamosError) {
        showToast(
          `No se puede eliminar: tiene ${err.cantidadPrestamos} préstamo(s) activo(s)`,
          'error',
        );
        return;
      }
      showToast('Error al eliminar cliente', 'error');
    }
  }

  function requestDelete(cliente) {
    setToDelete(cliente);
  }

  function confirmDelete() {
    handleDelete();
    setToDelete(null);
  }

  function handleOpen(cliente) {
    onNavigate?.('cliente-detalle', { clienteId: cliente.id });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:gap-6">
      <section>
        <SectionTitle title="Resumen" />
        <div className="mt-3">
          <StatCard
            label="Clientes registrados"
            value={clientes.length}
            sub="Total en cartera"
            icon={Users}
            tone="gold"
          />
        </div>
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
        <DeleteConfirm
          cliente={toDelete}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

export default ClientesPage;