import React, { useEffect, useRef, useState } from 'react';
import { ClienteCard } from './ClienteCard';
import { ClienteEmpty } from './ClienteEmpty';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';

const VIRTUALIZE_THRESHOLD = 80;
const ROW_HEIGHT = 96;
const BUFFER_ROWS = 6;

export function ClientesList({
  clientes,
  query,
  onOpen,
  onEdit,
  onDelete,
  onCreate,
  hasMore,
  loadingMore,
  loadMore,
  PAGE_SIZE = 50,
}) {
  if (!clientes || clientes.length === 0) {
    return <ClienteEmpty query={query} onCreate={onCreate} />;
  }

  if (clientes.length > VIRTUALIZE_THRESHOLD) {
    return (
      <VirtualizedList
        clientes={clientes}
        query={query}
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadMore={loadMore}
        PAGE_SIZE={PAGE_SIZE}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {clientes.map((c) => (
          <li key={c.id} className="animate-fade-in">
            <ClienteCard cliente={c} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>
      {hasMore && <LoadMoreButton loadingMore={loadingMore} loadMore={loadMore} PAGE_SIZE={PAGE_SIZE} />}
    </div>
  );
}

function LoadMoreButton({ loadingMore, loadMore, PAGE_SIZE }) {
  return (
    <div className="flex justify-center">
      <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
        {loadingMore && <Spinner size="sm" tone="navy" />}
        {loadingMore ? 'Cargando…' : `Cargar más (${PAGE_SIZE})`}
      </Button>
    </div>
  );
}

function VirtualizedList({
  clientes,
  query,
  onOpen,
  onEdit,
  onDelete,
  hasMore,
  loadingMore,
  loadMore,
  PAGE_SIZE,
}) {
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(
    typeof window !== 'undefined' ? window.innerHeight - 200 : 600,
  );

  useEffect(() => {
    const onResize = () => setViewportH(Math.max(400, window.innerHeight - 200));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onScroll = (e) => setScrollTop(e.currentTarget.scrollTop);
  const total = clientes.length;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endIdx = Math.min(total, Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + BUFFER_ROWS);
  const visible = clientes.slice(startIdx, endIdx);
  const padTop = startIdx * ROW_HEIGHT;
  const padBottom = (total - endIdx) * ROW_HEIGHT;

  return (
    <div className="space-y-4">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="max-h-[70vh] overflow-y-auto rounded-input border border-slate-100 scrollbar-thin dark:border-navy-700/60"
      >
        <div style={{ height: total * ROW_HEIGHT, position: 'relative' }}>
          <div style={{ transform: `translateY(${padTop}px)` }}>
            {visible.map((c) => (
              <div
                key={c.id}
                style={{ height: ROW_HEIGHT }}
                className="border-b border-slate-100 px-3 py-2 dark:border-navy-700/60"
              >
                <ClienteCard cliente={c} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
              </div>
            ))}
            {padBottom > 0 && <div style={{ height: padBottom }} aria-hidden="true" />}
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-neutral-500 dark:text-navy-300">
        Mostrando {startIdx + 1}–{Math.min(endIdx, total)} de {total}
      </p>
      {hasMore && <LoadMoreButton loadingMore={loadingMore} loadMore={loadMore} PAGE_SIZE={PAGE_SIZE} />}
    </div>
  );
}
