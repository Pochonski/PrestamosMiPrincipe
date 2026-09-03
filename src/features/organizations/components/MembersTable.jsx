import React from 'react';
import { useState } from 'react';
import { Crown, Shield, HandCoins, Eye, Trash2, Loader2 } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/useAuth';

const ROL_META = {
  owner: { label: 'Owner', tone: 'gold', icon: Crown },
  admin: { label: 'Admin', tone: 'info', icon: Shield },
  cobrador: { label: 'Cobrador', tone: 'success', icon: HandCoins },
  viewer: { label: 'Viewer', tone: 'neutral', icon: Eye },
};

export function MembersTable({ members, loading, onChangeRole, onRemove }) {
  const { user, isAdmin } = useAuth();
  const [actingId, setActingId] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-500">Sin miembros</p>;
  }

  return (
    <div className="overflow-hidden rounded-card border border-slate-200 dark:border-navy-700">
      <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
        {members.map((m) => {
          const meta = ROL_META[m.rol] || ROL_META.viewer;
          const isMe = m.user_id === user?.id;
          const isOwner = m.rol === 'owner';
          const canAct = isAdmin && !isMe && !isOwner;
          return (
            <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
              <Avatar nombre={m.full_name || m.email} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">
                    {m.full_name || m.email}
                  </p>
                  {isMe && <Badge tone="neutral">Vos</Badge>}
                </div>
                <p className="truncate text-xs text-neutral-500 dark:text-navy-300">{m.email}</p>
              </div>
              <Badge tone={meta.tone} icon={meta.icon}>
                {meta.label}
              </Badge>
              {canAct && (
                <div className="flex items-center gap-1">
                  <select
                    value={m.rol}
                    disabled={!!actingId}
                    onChange={async (e) => {
                      const newRol = e.target.value;
                      if (newRol === m.rol) return;
                      setActingId(m.user_id);
                      try {
                        await onChangeRole?.(m.user_id, newRol);
                      } finally {
                        setActingId(null);
                      }
                    }}
                    className="rounded-input border border-slate-200 bg-white px-2 py-1 text-xs font-medium dark:border-navy-700 dark:bg-navy-800"
                  >
                    <option value="admin">Admin</option>
                    <option value="cobrador">Cobrador</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    disabled={!!actingId}
                    onClick={async () => {
                      if (!confirm(`¿Remover a ${m.email} de la organización?`)) return;
                      setActingId(m.user_id);
                      try {
                        await onRemove?.(m.user_id);
                      } finally {
                        setActingId(null);
                      }
                    }}
                    className="text-danger-600"
                  />
                  {actingId === m.user_id && <Loader2 className="h-4 w-4 animate-spin text-gold-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
