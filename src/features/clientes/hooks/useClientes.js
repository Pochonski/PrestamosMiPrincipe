import { useEffect, useState } from 'react';
import * as clientesService from '../../../services/clientes';
import { useDataChange } from '../../../lib/hooks/useDataChange';

export function useClientes() {
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useDataChange(() => setTick((t) => t + 1));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await clientesService.buscar(query);
        if (!cancelled) {
          setClientes(result);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setClientes([]);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [query, tick]);

  return {
    clientes,
    query,
    setQuery,
    loading,
    refresh: () => setTick((t) => t + 1),
  };
}