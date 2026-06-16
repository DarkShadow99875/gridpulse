import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Mail, Pencil, Plus, RefreshCw, Trash2, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { User, UserStatus } from '../types';
import SearchToolbar from '../components/SearchToolbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import RolePicker from '../components/RolePicker';

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'active', label: 'Attivi' },
  { value: 'pending', label: 'In attesa invito' },
  { value: 'disabled', label: 'Disabilitati' },
];

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string } } }).response;
    return res?.data?.message || 'Operazione non riuscita';
  }
  return error instanceof Error ? error.message : 'Operazione non riuscita';
}

function statusBadge(user: User) {
  if (user.hasPendingInvitation) {
    return <span className="rounded-lg bg-yellow-500/10 px-2 py-1 text-xs text-yellow-400">In attesa</span>;
  }
  if (user.enabled) {
    return <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">Attivo</span>;
  }
  return <span className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400">Disabilitato</span>;
}

export default function UserManagement() {
  const { hasAnyRole, email: currentEmail } = useAuth();
  const canManageUsers = hasAnyRole(['ADMIN', 'SUPER_ADMIN']);

  const [users, setUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const [inviteForm, setInviteForm] = useState({ email: '', fullName: '', roles: ['OPERATOR'] as string[] });
  const [editForm, setEditForm] = useState({ id: 0, email: '', fullName: '', roles: [] as string[] });

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    danger?: boolean;
  }>({ open: false, title: '', message: '', action: async () => {} });

  const filters = useMemo(
    () => ({ search: search.trim(), role: roleFilter, status: statusFilter }),
    [search, roleFilter, statusFilter]
  );

  const fetchUsers = useCallback(async () => {
    try {
      const data = await userService.list(filters);
      setUsers(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!canManageUsers) return;
    setLoading(true);
    fetchUsers();
  }, [canManageUsers, fetchUsers]);

  useEffect(() => {
    if (!canManageUsers) return;
    userService.listRoles().then((roles) => setAvailableRoles(roles.map((r) => r.name))).catch(() => {});
  }, [canManageUsers]);

  const openConfirm = (title: string, message: string, action: () => Promise<void>, danger = false) => {
    setConfirm({ open: true, title, message, action, danger });
  };

  const runAction = async (id: number, action: () => Promise<void>, successMsg: string) => {
    setActionLoading(id);
    try {
      await action();
      toast.success(successMsg);
      await fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
      setConfirm((c) => ({ ...c, open: false }));
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteForm.roles.length === 0) {
      toast.error('Seleziona almeno un ruolo');
      return;
    }
    setActionLoading(-1);
    try {
      const created = await userService.create(inviteForm);
      toast.success('Invito creato con successo');
      if (created.invitationToken) {
        setInviteLink(userService.buildInvitationLink(created.invitationToken));
      }
      setInviteForm({ email: '', fullName: '', roles: ['OPERATOR'] });
      await fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.roles.length === 0) {
      toast.error('Seleziona almeno un ruolo');
      return;
    }
    setActionLoading(editForm.id);
    try {
      await userService.update(editForm.id, {
        email: editForm.email,
        fullName: editForm.fullName,
        roles: editForm.roles,
      });
      toast.success('Utente aggiornato');
      setEditOpen(false);
      await fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const copyInviteLink = async (token?: string) => {
    const link = token ? userService.buildInvitationLink(token) : inviteLink;
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success('Link invito copiato');
  };

  const openEdit = (user: User) => {
    setEditForm({
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
      roles: [...(user.roles || [])],
    });
    setEditOpen(true);
  };

  const isSelf = (user: User) => user.email === currentEmail;

  if (!canManageUsers) {
    return (
      <div className="p-8">
        <div className="text-red-400">Non hai i permessi per gestire gli utenti.</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gestione Utenti</h1>
          <p className="mt-1 text-sm text-zinc-400">{users.length} utenti trovati</p>
        </div>
        <button
          type="button"
          onClick={() => { setInviteOpen(true); setInviteLink(''); }}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Invita utente
        </button>
      </div>

      <div className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Cerca per email o nome..."
          onReset={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
        >
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white"
          >
            <option value="">Tutti i ruoli</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as UserStatus)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </SearchToolbar>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        {loading ? (
          <div className="p-8 text-zinc-400">Caricamento...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400">Nessun utente corrisponde ai filtri.</p>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="mt-4 text-sm text-emerald-400 hover:text-emerald-300"
            >
              Invita il primo utente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-3">Utente</th>
                  <th className="px-6 py-3">Ruoli</th>
                  <th className="px-6 py-3">Stato</th>
                  <th className="px-6 py-3">2FA</th>
                  <th className="px-6 py-3">Creato</th>
                  <th className="px-6 py-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-800/80 last:border-none hover:bg-zinc-950/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-100">{user.fullName || '—'}</div>
                      <div className="text-sm text-zinc-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((role) => (
                          <span key={role} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{role}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{statusBadge(user)}</td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {user.mfaEnabled ? user.preferredMfaMethod : 'Off'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          title="Modifica"
                          onClick={() => openEdit(user)}
                          className="rounded-lg bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {user.hasPendingInvitation && user.invitationToken && (
                          <button
                            type="button"
                            title="Copia link invito"
                            onClick={() => copyInviteLink(user.invitationToken)}
                            className="rounded-lg bg-blue-600/20 p-2 text-blue-400 hover:bg-blue-600/30"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {user.hasPendingInvitation && (
                          <>
                            <button
                              type="button"
                              title="Reinvia invito"
                              disabled={actionLoading === user.id}
                              onClick={async () => {
                                setActionLoading(user.id);
                                try {
                                  const updated = await userService.resendInvitation(user.id);
                                  if (updated.invitationToken) {
                                    setInviteLink(userService.buildInvitationLink(updated.invitationToken));
                                    setInviteOpen(true);
                                  }
                                  toast.success('Invito reinviato');
                                  await fetchUsers();
                                } catch (error) {
                                  toast.error(getErrorMessage(error));
                                } finally {
                                  setActionLoading(null);
                                }
                              }}
                              className="rounded-lg bg-yellow-600/20 p-2 text-yellow-400 hover:bg-yellow-600/30 disabled:opacity-50"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Revoca invito"
                              onClick={() => openConfirm('Revoca invito', 'Eliminare questo invito pendente?', () => userService.revokeInvitation(user.id).then(() => {}), true)}
                              className="rounded-lg bg-orange-600/20 p-2 text-orange-400 hover:bg-orange-600/30"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}

                        {!user.hasPendingInvitation && (
                          user.enabled ? (
                            <button
                              type="button"
                              title="Disabilita"
                              disabled={isSelf(user) || actionLoading === user.id}
                              onClick={() => openConfirm('Disabilita utente', `Disabilitare ${user.email}?`, () => userService.disable(user.id))}
                              className="rounded-lg bg-orange-600/20 p-2 text-orange-400 hover:bg-orange-600/30 disabled:opacity-50"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Abilita"
                              disabled={actionLoading === user.id}
                              onClick={() => runAction(user.id, () => userService.enable(user.id), 'Utente abilitato')}
                              className="rounded-lg bg-emerald-600/20 p-2 text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}

                        {user.mfaEnabled && (
                          <button
                            type="button"
                            title="Reset 2FA"
                            onClick={() => openConfirm('Reset 2FA', `Resettare la 2FA per ${user.email}?`, () => userService.resetMfa(user.id))}
                            className="rounded-lg bg-blue-600/20 p-2 text-blue-400 hover:bg-blue-600/30"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          title="Elimina"
                          disabled={isSelf(user) || actionLoading === user.id}
                          onClick={() => openConfirm('Elimina utente', `Eliminare definitivamente ${user.email}?`, () => userService.delete(user.id), true)}
                          className="rounded-lg bg-red-600/20 p-2 text-red-400 hover:bg-red-600/30 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={inviteOpen} title="Invita nuovo utente" onClose={() => setInviteOpen(false)}>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Email *</label>
            <input
              type="email"
              required
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Nome completo</label>
            <input
              type="text"
              value={inviteForm.fullName}
              onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Ruoli *</label>
            <RolePicker
              availableRoles={availableRoles.length ? availableRoles : ['VIEWER', 'OPERATOR', 'ADMIN']}
              selected={inviteForm.roles}
              onChange={(roles) => setInviteForm({ ...inviteForm, roles })}
            />
          </div>

          {inviteLink && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="mb-2 text-sm text-emerald-400">Link di registrazione (valido 72h)</p>
              <div className="flex gap-2">
                <input readOnly value={inviteLink} className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300" />
                <button type="button" onClick={() => copyInviteLink()} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-black">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setInviteOpen(false)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
              Chiudi
            </button>
            <button type="submit" disabled={actionLoading === -1} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {actionLoading === -1 ? 'Invio...' : 'Invia invito'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} title="Modifica utente" onClose={() => setEditOpen(false)}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Nome completo</label>
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Ruoli</label>
            <RolePicker
              availableRoles={availableRoles.length ? availableRoles : ['VIEWER', 'OPERATOR', 'ADMIN']}
              selected={editForm.roles}
              onChange={(roles) => setEditForm({ ...editForm, roles })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
              Annulla
            </button>
            <button type="submit" disabled={actionLoading === editForm.id} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
              Salva modifiche
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        danger={confirm.danger}
        loading={actionLoading !== null}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={async () => {
          setActionLoading(-2);
          try {
            await confirm.action();
            toast.success('Operazione completata');
            await fetchUsers();
          } catch (error) {
            toast.error(getErrorMessage(error));
          } finally {
            setActionLoading(null);
            setConfirm((c) => ({ ...c, open: false }));
          }
        }}
      />
    </div>
  );
}