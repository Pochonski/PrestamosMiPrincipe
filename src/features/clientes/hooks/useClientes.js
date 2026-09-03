import { useCallback, useEffect, useRef, useState } from 'react';
import * as clientesService from '../../../services/clientes';
import { useDataChange } from '../../../lib/hooks/useDataChange';
import { useTickOnDataChange } from '../../../lib/hooks/useAsyncResource';

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

export function useClientes() {
  const [query, setQueryRaw] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const debounceRef = useRef(null);
  const dataTick = useTickOnDataChange();

  const setQuery = useCallback((q) => {
    setQueryRaw(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(q);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOffset(0);
    clientesService
      .buscar(debouncedQuery, { limit: PAGE_SIZE, offset: 0 })
      .then((rows) => {
        if (cancelled) return;
        setClientes(rows);
        setHasMore(rows.length === PAGE_SIZE);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setClientes([]);
        setHasMore(false);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, dataTick]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextOffset = offset + PAGE_SIZE;
    try {
      const rows = await clientesService.buscar(query, { limit: PAGE_SIZE, offset: nextOffset });
      setClientes((prev) => [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
      setOffset(nextOffset);
    } catch {
      // swallow; user can retry
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, offset, query]);

  return {
    clientes,
    query,
    setQuery,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    PAGE_SIZE,
  };
}