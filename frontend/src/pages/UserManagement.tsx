import { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useAuth } from '../context/AuthContext';

interface User {
  id: number;
  email: string;
  fullName: string;
  enabled: boolean;
  roles: string[];
  hasPendingInvitation: boolean;
}

export default function UserManagement() {
  const { hasAnyRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [roles, setRoles] = useState<string[]>(['OPERATOR']);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const canManageUsers = hasAnyRole(['ADMIN', 'SUPER_ADMIN']);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/api/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;

    setCreating(true);
    setMessage('');

    try {
      await axiosInstance.post('/api/users', {
        email,
        fullName,
        roles,
      });

      setMessage('Utente invitato con successo!');
      setEmail('');
      setFullName('');
      fetchUsers();
    } catch (e: any) {
      setMessage('Errore: ' + (e.response?.data?.message || e.message));
    } finally {
      setCreating(false);
    }
  };

  const handleDisable = async (id: number) => {
    if (!confirm('Disabilitare questo utente?')) return;
    try {
      await axiosInstance.patch(`/api/users/${id}/disable`);
      toast.success('Utente disabilitato');
      fetchUsers();
    } catch (e) {
      toast.error('Errore');
    }
  };

  const handleEnable = async (id: number) => {
    try {
      await axiosInstance.patch(`/api/users/${id}/enable`);
      toast.success('Utente riabilitato');
      fetchUsers();
    } catch (e) {
      toast.error('Errore');
    }
  };

  const handleResetMfa = async (id: number) => {
    if (!confirm('Resettare la 2FA per questo utente?')) return;
    try {
      await axiosInstance.post(`/api/users/${id}/reset-mfa`);
      toast.success('2FA resettata');
      fetchUsers();
    } catch (e) {
      toast.error('Errore');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare definitivamente questo utente?')) return;
    try {
      await axiosInstance.delete(`/api/users/${id}`);
      toast.success('Utente eliminato');
      fetchUsers();
    } catch (e) {
      toast.error('Errore');
    }
  };

  if (!canManageUsers) {
    return (
      <div className="p-8">
        <div className="text-red-400">Non hai i permessi per gestire gli utenti.</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Gestione Utenti</h1>

      {/* Invite Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">Invita Nuovo Utente</h2>
        
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl"
              required
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Ruoli</label>
            <select
              multiple
              value={roles}
              onChange={(e) => setRoles(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full mt-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl h-24"
            >
              <option value="VIEWER">VIEWER</option>
              <option value="OPERATOR">OPERATOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 bg-emerald-500 text-black rounded-2xl font-medium hover:bg-emerald-400 disabled:opacity-70"
            >
              {creating ? 'Invio in corso...' : 'Invia Invito'}
            </button>
            {message && <span className="ml-4 text-sm text-emerald-400">{message}</span>}
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 font-medium">Utenti Registrati</div>
        
        {loading ? (
          <div className="p-6 text-zinc-400">Caricamento...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Ruoli</th>
                <th className="px-6 py-3">Stato</th>
                <th className="px-6 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-zinc-800 last:border-none hover:bg-zinc-950">
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.fullName || '-'}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {user.roles?.join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    {user.hasPendingInvitation ? (
                      <span className="text-yellow-400 text-sm">In attesa</span>
                    ) : user.enabled ? (
                      <span className="text-emerald-400 text-sm">Attivo</span>
                    ) : (
                      <span className="text-red-400 text-sm">Disabilitato</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 text-xs">
                      {user.enabled ? (
                        <button onClick={() => handleDisable(user.id)} className="px-2 py-1 bg-orange-600/80 rounded hover:bg-orange-600">Disabilita</button>
                      ) : (
                        <button onClick={() => handleEnable(user.id)} className="px-2 py-1 bg-emerald-600/80 rounded hover:bg-emerald-600">Abilita</button>
                      )}
                      <button onClick={() => handleResetMfa(user.id)} className="px-2 py-1 bg-blue-600/80 rounded hover:bg-blue-600">Reset 2FA</button>
                      <button onClick={() => handleDelete(user.id)} className="px-2 py-1 bg-red-600/80 rounded hover:bg-red-600">Elimina</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
