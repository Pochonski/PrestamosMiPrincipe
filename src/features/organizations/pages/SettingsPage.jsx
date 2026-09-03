import React from 'react';
import { useEffect, useState } from 'react';
import { Building2, Users, Mail, Crown, Save, UserPlus, Link2, Clock, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { IconBox } from '../../../components/ui/IconBox';
import { SectionTitle } from '../../../components/ui/SectionTitle';
import { useAuth } from '../../auth/useAuth';
import { describeAuthError } from '../../auth/errors';
import * as orgService from '../../../services/organizations';
import * as invitesService from '../../../services/invites';
import { MembersTable } from '../components/MembersTable';
import { InviteModal } from '../components/InviteModal';

export function SettingsPage() {
  const { currentOrg, isOwner, isAdmin, canInvite, refreshProfile } = useAuth();
  const [org, setOrg] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [tab, setTab] = useState('general');

  const [editNombre, setEditNombre] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [errorMeta, setErrorMeta] = useState(null);

  const [inviteOpen, setInviteOpen] = useState(false);

  async function loadAll() {
    setLoadingOrg(true);
    setLoadingMembers(true);
    try {
      const o = await orgService.getMyOrganization();
      setOrg(o);
      setEditNombre(o?.nombre || '');
      setEditSlug(o?.slug || '');
    } catch (e) {
      setErrorMeta(describeAuthError(e));
    } finally {
      setLoadingOrg(false);
    }
    try {
      const [m, iv] = await Promise.all([orgService.listMembers(), orgService.listInvites()]);
      setMembers(m);
      setInvites(iv);
    } catch (e) {
      // members/invites fail if viewer? but viewer can list
      console.warn(e);
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    setErrorMeta(null);
    try {
      const updated = await orgService.updateOrganization({ nombre: editNombre, slug: editSlug });
      setOrg(updated);
      await refreshProfile();
      setSaveMsg('Cambios guardados');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setErrorMeta(describeAuthError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRole(userId, newRol) {
    try {
      await invitesService.updateMemberRole(userId, newRol);
      await loadAll();
    } catch (err) {
      setErrorMeta(describeAuthError(err));
    }
  }

  async function handleRemove(userId) {
    try {
      await invitesService.removeMember(userId);
      await loadAll();
    } catch (err) {
      setErrorMeta(describeAuthError(err));
    }
  }

  async function handleRevokeInvite(inviteId) {
    try {
      await invitesService.revokeInvite(inviteId);
      await loadAll();
    } catch (err) {
      setErrorMeta(describeAuthError(err));
    }
  }

  if (loadingOrg) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
      <header>
        <div className="flex items-center gap-3">
          <IconBox icon={Building2} tone="gold" size="md" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy-900 dark:text-white sm:text-2xl">Organización</h1>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-navy-300">
              {org?.nombre || currentOrg?.nombre} · <span className="font-mono text-xs">{org?.slug}</span> {currentOrg?.rol && <Badge tone="gold" className="ml-2">{currentOrg.rol}</Badge>}
            </p>
          </div>
        </div>
      </header>

      {errorMeta && (
        <Alert tone={errorMeta.variant === 'warning' ? 'warning' : 'danger'} title={errorMeta.title}>
          {errorMeta.message}
        </Alert>
      )}
      {saveMsg && (
        <Alert tone="success" title={saveMsg}>
          Organización actualizada.
        </Alert>
      )}

      <div className="flex gap-2 border-b border-slate-200 dark:border-navy-700">
        {[
          { id: 'general', label: 'General', icon: Building2 },
          { id: 'miembros', label: `Miembros (${members.length})`, icon: Users },
          { id: 'invitaciones', label: `Invitaciones (${invites.length})`, icon: Mail },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold ${
              tab === t.id ? 'border-gold-500 text-navy-900 dark:text-white' : 'border-transparent text-neutral-500'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card className="space-y-4">
          <SectionTitle title="Datos de la organización" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre del negocio"
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              icon={Building2}
              disabled={!isOwner && !isAdmin}
            />
            <Input
              label="Slug (URL)"
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              icon={Link2}
              hint="3-32, solo minúsculas/números/-"
              disabled={!isOwner && !isAdmin}
            />
          </div>
          {!isAdmin && <p className="text-xs text-neutral-500">Solo owner/admin pueden editar.</p>}
          <div className="flex justify-end">
            <Button variant="primary" icon={Save} loading={saving} disabled={!isAdmin || !editNombre.trim() || !editSlug.trim()} onClick={handleSave}>
              Guardar cambios
            </Button>
          </div>
          <div className="rounded-card border border-slate-200 bg-slate-50 p-4 text-xs text-neutral-600 dark:border-navy-700 dark:bg-navy-700/40">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-gold-600" />
              Owner: <strong>{members.find((m) => m.rol === 'owner')?.email || org?.owner_id || '—'}</strong>
            </div>
            <p className="mt-1">ID organización: <span className="font-mono">{org?.id}</span></p>
          </div>
        </Card>
      )}

      {tab === 'miembros' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle title="Miembros" />
            {canInvite && (
              <Button variant="primary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
                Invitar
              </Button>
            )}
          </div>
          <MembersTable members={members} loading={loadingMembers} onChangeRole={handleChangeRole} onRemove={handleRemove} />
        </div>
      )}

      {tab === 'invitaciones' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle title="Invitaciones" />
            {canInvite && (
              <Button variant="primary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
                Nueva invitación
              </Button>
            )}
          </div>
          {invites.length === 0 ? (
            <Card className="py-10 text-center text-sm text-neutral-500">Sin invitaciones</Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
                {invites.map((iv) => {
                  const isPending = !iv.accepted_at && !iv.revoked_at && new Date(iv.expires_at) > new Date();
                  const tone = isPending ? 'warning' : iv.accepted_at ? 'success' : 'danger';
                  const label = isPending ? 'Pendiente' : iv.accepted_at ? 'Aceptada' : iv.revoked_at ? 'Revocada' : 'Expirada';
                  return (
                    <div key={iv.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-900 dark:text-white">{iv.email}</p>
                        <p className="flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="h-3 w-3" /> rol {iv.rol} · expira {new Date(iv.expires_at).toLocaleDateString('es-CR')}
                        </p>
                      </div>
                      <Badge tone={tone}>{label}</Badge>
                      <span className="font-mono text-xs text-neutral-500">{iv.token.slice(0, 8)}…</span>
                      {isPending && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(invitesService.buildInviteLink(iv.token))}
                          >
                            Copiar link
                          </Button>
                          {(isAdmin || isOwner) && (
                            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleRevokeInvite(iv.id)} className="text-danger-600" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onCreated={() => loadAll()} />
    </div>
  );
}

export default SettingsPage;
