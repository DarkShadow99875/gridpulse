import { useEffect, useState } from 'react'
import { Download, FileText, Calendar } from 'lucide-react'
import axiosInstance from '../services/axiosInstance'
import { toast } from 'sonner'

interface Plant {
  id: number
  name: string
  type: string
  location: string
  capacityMw: number
}

export default function EsgReport() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    axiosInstance.get<Plant[]>('/api/plants')
      .then(r => {
        setPlants(r.data)
        if (r.data.length) setSelectedId(r.data[0].id)
      })
      .catch(() => toast.error('Errore nel caricamento degli impianti'))
  }, [])

  const downloadReport = async () => {
    if (!selectedId) return
    setGenerating(true)

    try {
      const response = await axiosInstance.get(`/api/reports/esg/${selectedId}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      const plant = plants.find(p => p.id === selectedId)
      const filename = `GridPulse_ESG_${plant?.name.replace(/\s+/g, '_') || selectedId}_${new Date().toISOString().slice(0,10)}.pdf`
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Report ESG scaricato con successo', { description: filename })
    } catch (error) {
      toast.error('Errore durante la generazione del PDF', { description: 'Riprova tra qualche secondo' })
    } finally {
      setGenerating(false)
    }
  }

  const selectedPlant = plants.find(p => p.id === selectedId)

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <FileText className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-5xl font-semibold tracking-tight">Report ESG</h1>
            <p className="text-xl text-zinc-400 mt-2">Genera e scarica report di sostenibilità con crediti di carbonio</p>
          </div>
        </div>
      </div>

      <div className="card max-w-2xl">
        <div className="mb-8">
          <div className="text-sm text-emerald-400 font-medium tracking-wider mb-2">SELEZIONA IMPIANTO</div>
          <div className="grid grid-cols-1 gap-3">
            {plants.map(plant => (
              <button
                key={plant.id}
                onClick={() => setSelectedId(plant.id)}
                className={`p-5 rounded-3xl border text-left transition-all flex justify-between items-center ${selectedId === plant.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}
              >
                <div>
                  <div className="font-semibold text-lg">{plant.name}</div>
                  <div className="text-sm text-zinc-400 mt-0.5">{plant.location} • {plant.type} • {plant.capacityMw} MW</div>
                </div>
                {selectedId === plant.id && <div className="text-emerald-400 text-xs font-mono tracking-[2px]">SELEZIONATO</div>}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8">
          <div className="text-sm text-zinc-400 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Il report include
          </div>
          <ul className="text-sm space-y-1.5 text-zinc-300 mb-9 pl-1">
            <li>• Prestazioni energetiche e efficienza media del periodo</li>
            <li>• CO₂ evitato (kg e tonnellate) + crediti di carbonio generati</li>
            <li>• Raccomandazioni operative personalizzate</li>
            <li>• Dati calcolati sugli ultimi 60 record disponibili</li>
          </ul>

          <button
            onClick={downloadReport}
            disabled={!selectedId || generating}
            className="btn-primary w-full justify-center text-base py-4 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {generating ? 'Generazione PDF in corso...' : 'Scarica Report ESG (PDF)'}
          </button>

          {selectedPlant && (
            <div className="text-center text-xs text-zinc-500 mt-5">
              File: GridPulse_ESG_{selectedPlant.name.replace(/\s/g, '_')}_{new Date().toISOString().slice(0,10)}.pdf
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-8 text-center text-sm text-zinc-500">
        I report sono generati in tempo reale con Apache PDFBox.
      </div>
    </div>
  )
}
