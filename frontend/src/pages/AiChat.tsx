import { useState, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import axiosInstance from '../services/axiosInstance'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Plant {
  id: number
  name: string
}

export default function AiChat() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Ciao! Sono l\'assistente AI di GridPulse. Chiedimi qualsiasi cosa sullo stato degli impianti, efficienza, manutenzione prevista o impatto ambientale.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axiosInstance.get<Plant[]>('/api/plants').then(r => {
      setPlants(r.data)
      if (r.data.length) setSelectedPlantId(r.data[0].id)
    }).catch(() => toast.error('Errore caricamento impianti'))
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || !selectedPlantId) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    const question = input.trim()
    setInput('')
    setLoading(true)

    try {
      const { data } = await axiosInstance.post<{ answer: string }>('/api/ai/chat', {
        question,
        plantId: selectedPlantId
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Si è verificato un problema nel contattare l\'AI. Riprova tra qualche secondo.' 
      }])
      toast.error('Errore nella risposta AI')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col h-[calc(100vh-0px)]">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl"><Bot className="w-8 h-8 text-emerald-400" /></div>
          <div>
            <h1 className="text-5xl font-semibold tracking-tight">AI Chat</h1>
            <p className="text-zinc-400 mt-1">Chiedi in linguaggio naturale a proposito dei tuoi impianti</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-zinc-400">Contesto impianto:</span>
        <select 
          value={selectedPlantId ?? ''} 
          onChange={e => setSelectedPlantId(Number(e.target.value))}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
        >
          {plants.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 card overflow-y-auto mb-4 p-8 space-y-8" style={{ minHeight: '420px' }}>
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 flex-shrink-0 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div className={`max-w-[78%] rounded-3xl px-6 py-4 text-[15px] leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' 
                ? 'bg-emerald-500 text-black font-medium' 
                : 'bg-zinc-950 border border-zinc-800'
            }`}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-2xl bg-zinc-800 flex-shrink-0 flex items-center justify-center mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
            <div className="text-sm text-zinc-400 pt-2">L'AI sta elaborando la risposta...</div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Es: Qual è l'efficienza del Parco Solare Puglia?  /  Quando è prevista la prossima manutenzione?"
          className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-3xl px-6 py-4 text-base outline-none placeholder:text-zinc-500"
          disabled={loading}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
          className="btn-primary disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          Invia
        </button>
      </div>

      <div className="text-center text-xs text-zinc-500 mt-3">
        Le risposte sono generate da un motore AI specializzato su dati energetici
      </div>
    </div>
  )
}
