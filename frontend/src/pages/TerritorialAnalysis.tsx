import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import axiosInstance from '../services/axiosInstance'

// Fix default marker icons for Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface PlantComparison {
  plantName: string
  location: string
  type: string
  solarScore: number
  windScore: number
  advantage: string
}

interface AnalysisResult {
  latitude: number
  longitude: number
  solarScore: number
  windScore: number
  annualYieldKwhPerKwp: number
  avgWindSpeed: number
  recommendation: string
  primaryTechnology: string
  plantComparisons: PlantComparison[]
  summary: string
  analysisStartDate?: string
  analysisEndDate?: string
  windDataReliable?: boolean
  windDataRecords?: number
  windDataSource?: string

  // Meteostat station info (when used as fallback)
  meteostatStationName?: string
  meteostatStationDistanceKm?: number
}

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })

  return position ? <Marker position={position} /> : null
}

export default function TerritorialAnalysis() {
  const [position, setPosition] = useState<[number, number]>([41.8, 12.8]) // Center Italy
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Date range filter (for historical weather-based analysis)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Auto re-analyze when both dates are selected
  useEffect(() => {
    if (startDate && endDate && result) {
      // Small delay to avoid too many calls while typing
      const timer = setTimeout(() => {
        analyze()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [startDate, endDate])

  const analyze = async () => {
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        latitude: position[0],
        longitude: position[1],
      }

      // Only send dates if both are provided
      if (startDate && endDate) {
        payload.startDate = startDate
        payload.endDate = endDate
      }

      const { data } = await axiosInstance.post<AnalysisResult>('/api/analysis/site-suitability', payload)

      setResult(data)
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Errore durante l\'analisi'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const clearDateFilter = () => {
    setStartDate('')
    setEndDate('')
  }

  const applyPreset = (preset: any) => {
    if (preset.days) {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - preset.days)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    } else if (preset.start && preset.end) {
      setStartDate(preset.start)
      setEndDate(preset.end)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 65) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="text-emerald-400 text-sm font-medium tracking-widest mb-2">GEOMAPPING</div>
        <h1 className="text-4xl font-semibold tracking-tighter">Analisi Territoriale</h1>
        <p className="text-zinc-400 mt-2 max-w-2xl">
          Seleziona un punto sulla mappa per valutare il potenziale di installazione di impianti solari ed eolici.
          Il sistema utilizza dati gratuiti da PVGIS (UE) e Open-Meteo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* MAP */}
        <div className="lg:col-span-3 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-medium">Mappa Interattiva</div>
              <div className="text-xs text-zinc-500">Clicca per selezionare la posizione</div>
            </div>
            <div className="text-xs font-mono text-zinc-500">
              {position[0].toFixed(4)}, {position[1].toFixed(4)}
            </div>
          </div>

          <div className="h-[520px] relative">
            <MapContainer
              center={[41.8, 12.8]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>

          {/* Date Range Filter - Refined */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-widest text-zinc-500">Periodo Storico (opzionale)</div>
              {(startDate || endDate) && (
                <button 
                  onClick={clearDateFilter}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
                >
                  Rimuovi filtro
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { label: 'Ultimo anno', days: 365 },
                { label: 'Inverno 24/25', start: '2024-12-01', end: '2025-02-28' },
                { label: 'Estate 2024', start: '2024-06-01', end: '2024-08-31' },
                { label: '2024 intero', start: '2024-01-01', end: '2024-12-31' },
              ].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(preset)}
                  className="text-[10px] px-2.5 py-1 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-zinc-400 block mb-0.5">Da</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm focus:border-emerald-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-zinc-400 block mb-0.5">A</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={loading}
              className="mt-3 w-full py-3 rounded-2xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 active:bg-emerald-600 transition disabled:opacity-60"
            >
              {loading ? 'Analisi in corso...' : (startDate && endDate ? 'Rianalizza su questo periodo' : 'Analizza questa zona')}
            </button>

            <div className="text-[10px] text-zinc-500 mt-2 leading-snug">
              Lascia vuoto = medie storiche lunghe. Il filtro date influenza soprattutto i dati <strong>eolici</strong> (solare usa medie a lungo termine).
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !loading && (
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 text-center">
              <div className="text-6xl mb-4">📍</div>
              <div className="text-lg font-medium">Seleziona una posizione</div>
              <p className="text-sm text-zinc-500 mt-2">
                Clicca sulla mappa e premi "Analizza questa zona" per ottenere i dati di idoneità.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 text-center">
              <div className="animate-pulse text-emerald-400">Analisi del potenziale in corso...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded-3xl p-6 text-red-400">
              {error}
            </div>
          )}

          {result && (
            <>
              {/* Scores */}
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Punteggi di Idoneità</div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 rounded-2xl p-4">
                    <div className="text-sm text-zinc-400">Solare</div>
                    <div className={`text-5xl font-semibold mt-1 ${getScoreColor(result.solarScore)}`}>
                      {result.solarScore}
                    </div>
                    <div className="text-xs text-zinc-500">/ 100</div>
                  </div>
                  <div className="bg-zinc-950 rounded-2xl p-4">
                    <div className="text-sm text-zinc-400">Eolico</div>
                    <div className={`text-5xl font-semibold mt-1 ${getScoreColor(result.windScore)}`}>
                      {result.windScore}
                    </div>
                    <div className="text-xs text-zinc-500">/ 100</div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-zinc-950 rounded-2xl text-sm">
                  <span className="text-emerald-400 font-medium">Raccomandazione:</span> {result.recommendation}
                </div>

                {/* Custom Period Banner */}
                {result.analysisStartDate && result.analysisEndDate && (
                  <div className="mt-3 px-3 py-2 bg-emerald-950/40 border border-emerald-900 rounded-xl text-xs flex items-center gap-2">
                    <span className="text-emerald-400">📅</span>
                    <span>
                      Analisi su periodo personalizzato: <strong>{result.analysisStartDate}</strong> → <strong>{result.analysisEndDate}</strong>
                    </span>
                  </div>
                )}

                {/* Prominent Warning when using long-term average for recent periods */}
                {result.windDataSource && result.windDataSource.includes("LONG_TERM") && (
                  <div className="mt-4 p-4 bg-red-950/70 border-2 border-red-700 rounded-3xl text-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5">⚠️</div>
                      <div>
                        <div className="font-semibold text-red-400 text-base mb-1">
                          Dati reali non disponibili per il periodo selezionato
                        </div>
                        <div className="text-red-300 text-sm leading-relaxed">
                          I dati orari di vento per il 2026 non sono ancora disponibili negli archivi gratuiti 
                          (Open-Meteo e Meteostat). Per questo motivo si stanno usando le <strong>medie climatiche 
                          storiche</strong> per questa zona.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Meteostat station info */}
                {result.meteostatStationName && (
                  <div className="mt-3 text-xs text-zinc-400">
                    Dati vento da stazione reale: <span className="text-emerald-400 font-medium">{result.meteostatStationName}</span>
                    {result.meteostatStationDistanceKm && (
                      <span className="ml-1">({result.meteostatStationDistanceKm} km di distanza)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Production estimates */}
              <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Produzione Stimata</div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Produzione solare</span>
                    <span className="font-medium">{result.annualYieldKwhPerKwp?.toFixed(0)} kWh/kWp/anno</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Velocità vento media</span>
                    <span className="font-medium">
                      {result.avgWindSpeed?.toFixed(1)} m/s
                      {result.analysisStartDate && result.analysisEndDate && (
                        <span className="text-[10px] text-emerald-400 ml-1.5 block">
                          {result.windDataSource || 'periodo filtrato'}
                          {result.windDataRecords !== undefined && ` • ${result.windDataRecords.toLocaleString()} record`}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tecnologia consigliata</span>
                    <span className="font-medium text-emerald-400">{result.primaryTechnology}</span>
                  </div>
                </div>
              </div>

              {/* Comparison */}
              {result.plantComparisons && result.plantComparisons.length > 0 && (
                <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Confronto con i tuoi impianti</div>
                  <div className="space-y-2 text-sm">
                    {result.plantComparisons.slice(0, 4).map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-950 rounded-xl px-3 py-2">
                        <div>
                          <div className="font-medium">{p.plantName}</div>
                          <div className="text-[10px] text-zinc-500">{p.location}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div>S: <span className={getScoreColor(p.solarScore)}>{p.solarScore}</span> / E: <span className={getScoreColor(p.windScore)}>{p.windScore}</span></div>
                          <div className="text-emerald-500/70">{p.advantage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          {result.summary}
        </div>
      )}
    </div>
  )
}
