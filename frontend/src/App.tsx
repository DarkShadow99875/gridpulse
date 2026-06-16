import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { 
  LayoutDashboard, Brain, MessageCircle, FileText, 
  MapPin, Zap, LogOut, Users, Factory
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import AiInsights from './pages/AiInsights'
import AiChat from './pages/AiChat'
import EsgReport from './pages/EsgReport'
import TerritorialAnalysis from './pages/TerritorialAnalysis'
import Login from './pages/Login'
import Register from './pages/Register'
import UserManagement from './pages/UserManagement'
import PlantManagement from './pages/PlantManagement'
import { AuthProvider, useAuth } from './context/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/insights', label: 'AI Insights', icon: Brain },
  { path: '/chat', label: 'AI Chat', icon: MessageCircle },
  { path: '/reports', label: 'Report ESG', icon: FileText },
  { path: '/analysis', label: 'Analisi Territoriale', icon: MapPin },
  { path: '/admin/plants', label: 'Gestione Impianti', icon: Factory, roles: ['OPERATOR', 'ADMIN', 'SUPER_ADMIN'] },
  { path: '/admin/users', label: 'Gestione Utenti', icon: Users, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasAnyRole } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">Caricamento...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-zinc-200">Accesso negato</h2>
          <p className="text-zinc-400 mt-2">
            Non hai i permessi necessari per visualizzare questa sezione.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function MainLayout() {
  const location = useLocation();
  const { logout, hasAnyRole, displayName, email } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <div className="w-72 border-r border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="p-8 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-tighter">GridPulse</div>
              <div className="text-[10px] text-zinc-500 -mt-1">ENERGY INTELLIGENCE</div>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="text-xs font-medium text-zinc-500 px-4 mb-3 mt-2 tracking-widest">NAVIGAZIONE</div>
          <nav className="space-y-1">
            {navItems
              .filter((item) => {
                if (!item.roles || item.roles.length === 0) return true;
                return hasAnyRole(item.roles);
              })
              .map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      active 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="px-4 py-2 mb-2">
            <div className="text-sm font-medium text-zinc-200 truncate">
              {displayName || email}
            </div>
            {displayName && (
              <div className="text-xs text-zinc-500 truncate">{email}</div>
            )}
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="p-6 border-t border-zinc-800 text-xs text-zinc-500">
          <div>Accesso sicuro • v0.2.0</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          <Routes>
            <Route 
              path="/dashboard" 
              element={<Dashboard />}
            />

            <Route 
              path="/insights" 
              element={<AiInsights />}
            />

            <Route 
              path="/chat" 
              element={<AiChat />}
            />

            <Route 
              path="/reports" 
              element={<EsgReport />}
            />

            <Route 
              path="/analysis" 
              element={<TerritorialAnalysis />}
            />

            <Route 
              path="/admin/plants" 
              element={
                <ProtectedRoute requiredRoles={['OPERATOR', 'ADMIN', 'SUPER_ADMIN']}>
                  <PlantManagement />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  );
}