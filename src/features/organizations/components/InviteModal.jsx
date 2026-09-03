import React from 'react';
import { useState } from 'react';
import { Mail, Shield } from 'lucide-react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { useAuth } from '../../auth/useAuth';
import { describeAuthError } from '../../auth/errors';
import * as invitesService from '../../../services/invites';

export function InviteModal({ open, onClose, onCreated }) {
  const { rol } = useAuth();
  const [email, setEmail] = useState('');
  const [inviteRol, setInviteRol] = useState(rol === 'cobrador' ? 'viewer' : 'cobrador');
  const [submitting, setSubmitting] = useState(false);
  const [errorMeta, setErrorMeta] = useState(null);
  const [created, setCreated] = useState(null);

  const canInviteAdmin = rol === 'owner' || rol === 'admin';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMeta(null);
    setSubmitting(true);
    try {
      const invite = await invitesService.createInvite({ email, rol: inviteRol });
      setCreated(invite);
      onCreated?.(invite);
    } catch (err) {
      setErrorMeta(describeAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setEmail('');
    setErrorMeta(null);
    setCreated(null);
    onClose?.();
  }

  return (
    <ModalShell open={open} onClose={handleClose} title="Invitar miembro" description="Enviá una invitación por email con link magic." size="md">
      {created ? (
        <div className="space-y-4">
          <Alert tone="success" title="Invitación creada">
            Se creó la invitación para <strong>{created.email}</strong> como <strong>{created.rol}</strong>.
          </Alert>
          <div className="rounded-card border border-slate-200 bg-slate-50 p-3 dark:border-navy-700 dark:bg-navy-700/40">
            <p className="text-xs font-semibold text-neutral-600 dark:text-navy-300">Link de invitación (válido 7 días):</p>
            <div className="mt-1 flex items-center gap-2">
              <input
                readOnly
                value={invitesService.buildInviteLink(created.token)}
                className="flex-1 rounded-input border border-slate-200 bg-white px-3 py-2 text-xs dark:border-navy-700 dark:bg-navy-800"
              />
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(invitesService.buildInviteLink(created.token));
                }}
              >
                Copiar
              </Button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">Compartí este link con la persona. Expira el {new Date(created.expires_at).toLocaleDateString('es-CR')}.</p>
          </div>
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMeta && (
            <Alert tone={errorMeta.variant === 'warning' ? 'warning' : 'danger'} title={errorMeta.title}>
              {errorMeta.message}
            </Alert>
          )}
          <Input
            name="invite_email"
            label="Email del invitado"
            placeholder="ej: juan@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            type="email"
            required
            autoFocus
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-navy-700 dark:text-navy-200">Rol</label>
            <select
              value={inviteRol}
              onChange={(e) => setInviteRol(e.target.value)}
              className="w-full rounded-input border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-navy-700 dark:bg-navy-800"
            >
              {canInviteAdmin && <option value="admin">Admin — gestiona miembros y todo</option>}
              <option value="cobrador">Cobrador — CRUD clientes/préstamos/cobros</option>
              <option value="viewer">Viewer — solo lectura</option>
            </select>
            {!canInviteAdmin && <p className="mt-1 text-xs text-neutral-500">Como cobrador solo podés invitar viewers.</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={Shield} loading={submitting} disabled={!email.trim()}>
              Crear invitación
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
