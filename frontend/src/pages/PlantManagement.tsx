import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BarChart3, Factory, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { plantService, PlantPayload } from '../services/plantService';
import { EnergyPlant, Metric } from '../types';
import SearchToolbar from '../components/SearchToolbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY_PLANT: PlantPayload = {
  name: '',
  type: 'SOLAR',
  location: '',
  capacityMw: 0,
  company: '',
  status: 'ACTIVE',
  latitude: undefined,
  longitude: undefined,
};

const TYPES = ['SOLAR', 'WIND'];
const STATUSES = ['ACTIVE', 'MAINTENANCE', 'OFFLINE'];

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string } } }).response;
    return res?.data?.message || 'Operazione non riuscita';
  }
  return error instanceof Error ? error.message : 'Operazione non riuscita';
}

export default function PlantManagement() {
  const { hasAnyRole } = useAuth();
  const canRead = hasAnyRole(['VIEWER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN']);
  const canWrite = hasAnyRole(['OPERATOR', 'ADMIN', 'SUPER_ADMIN']);
  const canCreate = hasAnyRole(['ADMIN', 'SUPER_ADMIN']);
  const canDelete = hasAnyRole(['ADMIN', 'SUPER_ADMIN']);

  const [plants, setPlants] = useState<EnergyPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PlantPayload>(EMPTY_PLANT);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; plant: EnergyPlant | null }>({
    open: false,
    plant: null,
  });

  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metricsPlant, setMetricsPlant] = useState<EnergyPlant | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricForm, setMetricForm] = useState({
    id: null as number | null,
    recordedAt: new Date().toISOString().slice(0, 16),
    powerOutput: 0,
    efficiency: 0,
    temperature: 0,
  });

  const filters = useMemo(
    () => ({ search: search.trim(), type: typeFilter, status: statusFilter }),
    [search, typeFilter, statusFilter]
  );

  const fetchPlants = useCallback(async () => {
    try {
      const data = await plantService.list(filters);
      setPlants(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!canRead) return;
    setLoading(true);
    fetchPlants();
  }, [canRead, fetchPlants]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PLANT);
    setModalOpen(true);
  };

  const openEdit = (plant: EnergyPlant) => {
    setEditingId(plant.id);
    setForm({
      name: plant.name,
      type: plant.type,
      location: plant.location,
      capacityMw: plant.capacityMw,
      company: plant.company,
      status: plant.status,
      latitude: plant.latitude,
      longitude: plant.longitude,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await plantService.update(editingId, form);
        toast.success('Impianto aggiornato');
      } else {
        await plantService.create(form);
        toast.success('Impianto creato');
      }
      setModalOpen(false);
      await fetchPlants();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openMetrics = async (plant: EnergyPlant) => {
    setMetricsPlant(plant);
    setMetricsOpen(true);
    setMetricsLoading(true);
    try {
      const data = await plantService.listMetrics(plant.id, undefined, undefined, 50);
      setMetrics(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMetricsLoading(false);
    }
  };

  const resetMetricForm = () => {
    setMetricForm({
      id: null,
      recordedAt: new Date().toISOString().slice(0, 16),
      powerOutput: 0,
      efficiency: 0,
      temperature: 0,
    });
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricsPlant) return;
    setSaving(true);
    try {
      const payload = {
        recordedAt: new Date(metricForm.recordedAt).toISOString(),
        powerOutput: metricForm.powerOutput,
        efficiency: metricForm.efficiency,
        temperature: metricForm.temperature,
      };
      if (metricForm.id) {
        await plantService.updateMetric(metricForm.id, payload);
        toast.success('Metrica aggiornata');
      } else {
        await plantService.createMetric(metricsPlant.id, payload);
        toast.success('Metrica creata');
      }
      resetMetricForm();
      setMetrics(await plantService.listMetrics(metricsPlant.id, undefined, undefined, 50));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMetric = async (id: number) => {
    if (!metricsPlant || !confirm('Eliminare questa metrica?')) return;
    try {
      await plantService.deleteMetric(id);
      toast.success('Metrica eliminata');
      setMetrics(await plantService.listMetrics(metricsPlant.id, undefined, undefined, 50));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.plant) return;
    setSaving(true);
    try {
      await plantService.delete(confirmDelete.plant.id);
      toast.success('Impianto eliminato');
      setConfirmDelete({ open: false, plant: null });
      await fetchPlants();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!canRead) {
    return <div className="p-8 text-red-400">Non hai i permessi per visualizzare gli impianti.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gestione Impianti</h1>
          <p className="mt-1 text-sm text-zinc-400">{plants.length} impianti trovati</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Nuovo impianto
          </button>
        )}
      </div>

      <div className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
        <SearchToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Cerca per nome, località, azienda..."
          onReset={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); }}
        >
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white">
            <option value="">Tutti i tipi</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white">
            <option value="">Tutti gli stati</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </SearchToolbar>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        {loading ? (
          <div className="p-8 text-zinc-400">Caricamento...</div>
        ) : plants.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">Nessun impianto trovato.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Località</th>
                  <th className="px-6 py-3">Capacità</th>
                  <th className="px-6 py-3">Azienda</th>
                  <th className="px-6 py-3">Stato</th>
                  {canWrite && <th className="px-6 py-3">Azioni</th>}
                </tr>
              </thead>
              <tbody>
                {plants.map((plant) => (
                  <tr key={plant.id} className="border-b border-zinc-800/80 last:border-none hover:bg-zinc-950/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-zinc-100">
                        <Factory className="h-4 w-4 text-emerald-400" />
                        {plant.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-300">{plant.type}</td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{plant.location}</td>
                    <td className="px-6 py-4 text-sm text-zinc-300">{plant.capacityMw} MW</td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{plant.company || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-lg px-2 py-1 text-xs ${
                        plant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400'
                          : plant.status === 'MAINTENANCE' ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {plant.status}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          <button type="button" title="Metriche" onClick={() => openMetrics(plant)} className="rounded-lg bg-blue-600/20 p-2 text-blue-400 hover:bg-blue-600/30">
                            <BarChart3 className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => openEdit(plant)} className="rounded-lg bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete({ open: true, plant })}
                              className="rounded-lg bg-red-600/20 p-2 text-red-400 hover:bg-red-600/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title={editingId ? 'Modifica impianto' : 'Nuovo impianto'} onClose={() => setModalOpen(false)} wide>
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-zinc-400">Nome *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Tipo *</label>
            <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Stato</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-zinc-400">Località *</label>
            <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Capacità (MW)</label>
            <input type="number" step="0.1" value={form.capacityMw} onChange={(e) => setForm({ ...form, capacityMw: Number(e.target.value) })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Azienda</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Latitudine</label>
            <input type="number" step="any" value={form.latitude ?? ''} onChange={(e) => setForm({ ...form, latitude: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Longitudine</label>
            <input type="number" step="any" value={form.longitude ?? ''} onChange={(e) => setForm({ ...form, longitude: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-white" />
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Annulla</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {saving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={metricsOpen}
        title={metricsPlant ? `Metriche — ${metricsPlant.name}` : 'Metriche'}
        onClose={() => { setMetricsOpen(false); resetMetricForm(); }}
        wide
      >
        {canWrite && (
          <form onSubmit={handleSaveMetric} className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Data/ora</label>
              <input type="datetime-local" value={metricForm.recordedAt} onChange={(e) => setMetricForm({ ...metricForm, recordedAt: e.target.value })} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Potenza (MW)</label>
              <input type="number" step="0.01" value={metricForm.powerOutput} onChange={(e) => setMetricForm({ ...metricForm, powerOutput: Number(e.target.value) })} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Efficienza (%)</label>
              <input type="number" step="0.1" value={metricForm.efficiency} onChange={(e) => setMetricForm({ ...metricForm, efficiency: Number(e.target.value) })} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-white" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-zinc-500">Temp (°C)</label>
                <input type="number" step="0.1" value={metricForm.temperature} onChange={(e) => setMetricForm({ ...metricForm, temperature: Number(e.target.value) })} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-white" />
              </div>
              <button type="submit" disabled={saving} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black">
                {metricForm.id ? 'Agg.' : 'Add'}
              </button>
            </div>
          </form>
        )}
        {metricsLoading ? (
          <p className="text-zinc-400">Caricamento metriche...</p>
        ) : metrics.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nessuna metrica registrata.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                  <th className="py-2">Data</th>
                  <th className="py-2">Potenza</th>
                  <th className="py-2">Eff.</th>
                  <th className="py-2">Temp</th>
                  {canWrite && <th className="py-2">Azioni</th>}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id} className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-400">{new Date(m.recordedAt).toLocaleString('it-IT')}</td>
                    <td className="py-2">{m.powerOutput} MW</td>
                    <td className="py-2">{m.efficiency}%</td>
                    <td className="py-2">{m.temperature}°C</td>
                    {canWrite && (
                      <td className="py-2">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setMetricForm({ id: m.id, recordedAt: m.recordedAt.slice(0, 16), powerOutput: m.powerOutput, efficiency: m.efficiency, temperature: m.temperature })} className="text-xs text-emerald-400">Edit</button>
                          <button type="button" onClick={() => handleDeleteMetric(m.id)} className="text-xs text-red-400">Del</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete.open}
        title="Elimina impianto"
        message={confirmDelete.plant ? `Eliminare "${confirmDelete.plant.name}" e tutte le metriche collegate?` : ''}
        danger
        loading={saving}
        onCancel={() => setConfirmDelete({ open: false, plant: null })}
        onConfirm={handleDelete}
      />
    </div>
  );
}