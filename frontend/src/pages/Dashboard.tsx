import { useEffect, useState } from 'react'
import { Zap, TrendingUp, AlertTriangle, MapPin } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import axiosInstance from '../services/axiosInstance'
import { toast } from 'sonner'

interface Plant {
  id: number
  name: string
  type: string
  location: string
  capacityMw: number
  company: string
  status: string
}

interface Metric {
  recordedAt: string
  powerOutput: number
  efficiency: number
  temperature: number
}

export default function Dashboard() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)

  // Date filter state
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const { data } = await axiosInstance.get<Plant[]>('/api/plants')
        setPlants(data)
        if (data.length > 0) {
          setSelectedPlant(data[0])
        }
      } catch (e) {
        toast.error('Impossibile caricare gli impianti')
      } finally {
        setLoading(false)
      }
    }
    fetchPlants()
  }, [])

  useEffect(() => {
    if (!selectedPlant) return

    const fetchMetrics = async () => {
      try {
        let url = `/api/plants/${selectedPlant.id}/metrics`

        const params = new URLSearchParams()
        if (fromDate) params.append('start', fromDate)
        if (toDate) params.append('end', toDate)

        // If no date range, default to last 24 records
        if (!fromDate && !toDate) {
          params.append('limit', '24')
        }

        const { data } = await axiosInstance.get<Metric[]>(`${url}?${params.toString()}`)
        // Always keep data in chronological order (ascending) for charts
        const sorted = [...data].sort((a, b) => 
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        )
        setMetrics(sorted)
      } catch (e) {
        toast.error('Errore caricamento metriche')
      }
    }
    fetchMetrics()
  }, [selectedPlant, fromDate, toDate])

  const totalCapacity = plants.reduce((sum, p) => sum + (p.capacityMw || 0), 0)
  const operational = plants.filter(p => p.status === 'OPERATIONAL').length
  const avgEfficiency = metrics.length > 0 
    ? metrics.reduce((s, m) => s + (m.efficiency || 0), 0) / metrics.length 
    : 0

  const chartData = metrics.map((m) => ({
    time: new Date(m.recordedAt).toLocaleString('it-IT', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    potenza: Math.round((m.powerOutput || 0) * 10) / 10,
    efficienza: Math.round((m.efficiency || 0) * 10) / 10,
  }))

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <div className="mb-10">
        <div className="uppercase tracking-[3px] text-xs text-emerald-400 font-medium mb-1">PIATTAFORMA DI MONITORAGGIO</div>
        <h1 className="text-6xl font-semibold tracking-tighter">Benvenuto in GridPulse</h1>
        <p className="text-xl text-zinc-400 mt-3 max-w-2xl">
          Monitoraggio in tempo reale, manutenzione predittiva e report ESG per i tuoi impianti rinnovabili.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="card flex items-center gap-5">
          <div className="p-3 bg-emerald-500/10 rounded-2xl"><Zap className="w-6 h-6 text-emerald-400" /></div>
          <div>
            <div className="text-4xl font-semibold tabular-nums">{plants.length}</div>
            <div className="text-sm text-zinc-400">Impianti monitorati</div>
          </div>
        </div>
        <div className="card flex items-center gap-5">
          <div className="p-3 bg-blue-500/10 rounded-2xl"><TrendingUp className="w-6 h-6 text-blue-400" /></div>
          <div>
            <div className="text-4xl font-semibold tabular-nums">{totalCapacity.toFixed(0)} <span className="text-2xl text-zinc-400">MW</span></div>
            <div className="text-sm text-zinc-400">Capacità totale installata</div>
          </div>
        </div>
        <div className="card flex items-center gap-5">
          <div className="p-3 bg-amber-500/10 rounded-2xl"><AlertTriangle className="w-6 h-6 text-amber-400" /></div>
          <div>
            <div className="text-4xl font-semibold tabular-nums">{operational} / {plants.length}</div>
            <div className="text-sm text-zinc-400">Impianti operativi</div>
          </div>
        </div>
        <div className="card flex items-center gap-5">
          <div className="p-3 bg-purple-500/10 rounded-2xl"><TrendingUp className="w-6 h-6 text-purple-400" /></div>
          <div>
            <div className="text-4xl font-semibold tabular-nums">{avgEfficiency.toFixed(1)}<span className="text-2xl text-zinc-400">%</span></div>
            <div className="text-sm text-zinc-400">Efficienza media (selezionato)</div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Da</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">A</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={() => {
            setFromDate('')
            setToDate('')
          }}
          className="btn-secondary text-sm py-2 px-4"
        >
          Pulisci filtro
        </button>
        <div className="text-xs text-zinc-500 ml-2">
          {fromDate || toDate ? 'Dati filtrati per periodo' : 'Mostrando ultimi dati disponibili'}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 card">
          <div className="font-semibold mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> I tuoi impianti
          </div>
          <div className="space-y-2">
            {loading && <div className="text-zinc-500">Caricamento...</div>}
            {plants.map(plant => {
              const active = selectedPlant?.id === plant.id
              return (
                <button
                  key={plant.id}
                  onClick={() => setSelectedPlant(plant)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${active ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{plant.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{plant.location}</div>
                    </div>
                    <div className={`text-[10px] px-2.5 py-0.5 rounded font-mono tracking-widest ${plant.status === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {plant.status}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500 flex gap-3">
                    <span>{plant.type}</span>
                    <span>{plant.capacityMw} MW</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-semibold">Produzione (ultime 24 rilevazioni)</div>
                <div className="text-xs text-zinc-500">{selectedPlant ? selectedPlant.name : 'Seleziona un impianto'}</div>
              </div>
            </div>
            <div className="h-72 -mx-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                    <XAxis dataKey="time" tick={{ fill: '#52525b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#52525b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a' }} />
                    <Bar dataKey="potenza" fill="#10b981" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500">Nessun dato disponibile</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="font-semibold mb-5">Andamento efficienza</div>
            <div className="h-64 -mx-1">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                    <XAxis dataKey="time" tick={{ fill: '#52525b', fontSize: 11 }} />
                    <YAxis domain={[55, 100]} tick={{ fill: '#52525b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a' }} />
                    <Line type="natural" dataKey="efficienza" stroke="#a78bfa" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-zinc-500">Caricamento...</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-zinc-500">
        I dati sono simulati in tempo reale • GridPulse MVP 2026
      </div>
    </div>
  )
}
