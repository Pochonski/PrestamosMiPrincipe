import { useState } from 'react';
import { search } from '../selectors';
import { useDataChange } from '../../../lib/hooks/useDataChange';

export function useClientes() {
  const [clientes, setClientes] = useState(() => search(''));
  const [query, setQuery] = useState('');

  function recompute() {
    setClientes(search(query));
  }

  useDataChange(recompute);

  function setQueryDebounced(value) {
    setQuery(value);
  }

  return { clientes, query, setQuery: setQueryDebounced, refresh: recompute };
}