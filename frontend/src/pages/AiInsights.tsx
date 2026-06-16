import { useState, useEffect } from 'react'
import axiosInstance from '../services/axiosInstance'
import { Brain, AlertTriangle, Calendar, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface AiInsight {
  riskLevel: string
  predictedMaintenanceDate: string
  recommendation: string
  healthScore: number
  modelUsed: string
}

interface Plant {
  id: number
  name: string
  type: string
  location?: string
}

export default function AiInsights() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null)
  const [insight, setInsight] = useState<AiInsight | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const { data } = await axiosInstance.get('/api/plants')
        setPlants(data)
        if (data.length > 0) {
          setSelectedPlant(data[0].id)
        }
      } catch (error) {
        toast.error('Errore nel caricamento degli impianti')
      }
    }
    fetchPlants()
  }, [])

  const loadInsight = async (plantId: number) => {
    setLoading(true)
    try {
      const { data } = await axiosInstance.get(`/api/ai/insights/${plantId}`)
      setInsight(data)
    } catch (error) {
      toast.error('Errore nel recupero delle previsioni AI')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedPlant) {
      loadInsight(selectedPlant)
    }
  }, [selectedPlant])

  const getRiskColor = (risk: string) => {
    if (risk === 'HIGH') return 'bg-red-500/20 text-red-400 border-red-500'
    if (risk === 'MEDIUM') return 'bg-amber-500/20 text-amber-400 border-amber-500'
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-purple-500/10 rounded-2xl">
          <Brain className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-5xl font-semibold tracking-tight">AI Insights</h1>
          <p className="text-xl text-zinc-400 mt-2">Previsioni predittive e manutenzione intelligente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plant Selector */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Seleziona Impianto
            </h3>
            
            <div className="space-y-3">
              {plants.map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => setSelectedPlant(plant.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedPlant === plant.id 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className="font-medium">{plant.name}</div>
                  <div className="text-sm text-zinc-500">{plant.type} • {plant.location}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight Panel */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 flex items-center justify-center h-[400px]">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-zinc-400">L'AI sta analizzando i dati...</p>
              </div>
            </div>
          ) : insight ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-sm text-purple-400 font-medium">AI PREDICTIVE MAINTENANCE</div>
                  <div className="text-4xl font-semibold tracking-tight mt-2">Health Score</div>
                </div>
                <div className={`px-6 py-2 rounded-full text-lg font-semibold border ${getRiskColor(insight.riskLevel)}`}>
                  {insight.riskLevel} RISK
                </div>
              </div>

              <div className="text-7xl font-semibold tabular-nums tracking-tighter mb-2">
                {insight.healthScore}
                <span className="text-4xl text-zinc-400">/100</span>
              </div>

              <div className="text-zinc-400 mb-10">Punteggio di salute calcolato su 30 giorni di dati</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3 text-amber-400 mb-3">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Prossima Manutenzione Prevista</span>
                  </div>
                  <div className="text-3xl font-semibold">
                    {new Date(insight.predictedMaintenanceDate).toLocaleDateString('it-IT', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3 text-purple-400 mb-3">
                    <Brain className="w-5 h-5" />
                    <span className="font-medium">Modello AI</span>
                  </div>
                  <div className="text-lg">{insight.modelUsed}</div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="font-medium text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" /> Raccomandazione AI
                </div>
                <p className="text-zinc-300 leading-relaxed">{insight.recommendation}</p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
              Seleziona un impianto per vedere le previsioni AI
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-zinc-500">
        Powered by Time-Series Forecasting + Anomaly Detection • Simulazione AI per demo
      </div>
    </div>
  )
}