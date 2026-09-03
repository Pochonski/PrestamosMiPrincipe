import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notifService from '../../../services/notificaciones';
import { getNotificacionesAgrupadas } from '../selectors';

export function useNotificaciones() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notificaciones', 'list'],
    queryFn: notifService.list,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] });

  const marcarLeidaMut = useMutation({
    mutationFn: (id) => notifService.marcarLeida(id),
    onSuccess: invalidate,
  });
  const marcarTodasMut = useMutation({
    mutationFn: notifService.marcarTodasLeidas,
    onSuccess: invalidate,
  });

  const todas = useMemo(
    () => (data ? [...data].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) : []),
    [data],
  );
  const noLeidas = useMemo(() => todas.filter((n) => !n.leida), [todas]);
  const total = todas.length;
  const countNoLeidas = noLeidas.length;

  function getAgrupadas(filter) {
    const source = filter === 'no-leidas' ? noLeidas : todas;
    return getNotificacionesAgrupadas(source);
  }

  return {
    todas,
    noLeidas,
    total,
    countNoLeidas,
    loading: isLoading,
    marcarLeida: (id) => marcarLeidaMut.mutateAsync(id),
    marcarTodas: () => marcarTodasMut.mutateAsync(),
    getAgrupadas,
  };
}