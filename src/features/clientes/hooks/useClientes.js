import { useCallback, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import * as clientesService from '../../../services/clientes';
import { useDataChange } from '../../../lib/hooks/useDataChange';
import { onDataChanged } from '../../../lib/events';

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

export function useClientes() {
  const [query, setQueryRaw] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const debounceRef = useRef(null);
  const queryClient = useQueryClient();

  const setQuery = useCallback((q) => {
    setQueryRaw(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(q);
      setOffset(0);
    }, DEBOUNCE_MS);
  }, []);

  const queryKey = ['clientes', 'list', { q: debouncedQuery, offset }];

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['clientes', 'list', { q: debouncedQuery }],
    initialPageParam: 0,
    getNextPageParam: (last, allPages) =>
      last.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    queryFn: ({ pageParam }) =>
      clientesService.buscar(debouncedQuery, { limit: PAGE_SIZE, offset: pageParam }),
    staleTime: 30_000,
  });

  useDataChange((table) => {
    if (!table || table === 'clientes') {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    }
  });

  const flatPages = data?.pages?.flat() ?? [];
  const hasMore = Boolean(hasNextPage);
  const loading = isLoading;

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    await fetchNextPage();
  }, [hasMore, fetchNextPage]);

  return {
    clientes: flatPages,
    query,
    setQuery,
    loading,
    loadingMore: isFetching && !isLoading,
    hasMore,
    loadMore,
    PAGE_SIZE,
  };
}