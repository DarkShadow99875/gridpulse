import { useState } from 'react'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import BoardView from './pages/BoardView'
import AiInsights from './pages/AiInsights'
import { useAuthStore } from './hooks/useAuth'
import { Brain, Zap } from 'lucide-react'

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const [currentView, setCurrentView] = useState<'dashboard' | 'board' | 'ai'>('dashboard
 