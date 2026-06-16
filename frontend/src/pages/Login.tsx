import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMethod, setMfaMethod] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, verifyMfa, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Caricamento...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.mfaRequired) {
        setMfaRequired(true);
        setMfaMethod(result.mfaMethod || '');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Accesso non riuscito');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyMfa(email, mfaCode);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Codice 2FA non valido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md p-8 bg-zinc-900 rounded-3xl border border-zinc-800">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-black" />
            </div>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">GridPulse</h1>
          <p className="text-zinc-400 text-sm mt-1">Accedi alla piattaforma</p>
        </div>

        {!mfaRequired ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500"
                placeholder="nome@azienda.it"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-70"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify} className="space-y-5">
            <div className="text-center">
              <p className="text-zinc-300">Inserisci il codice 2FA</p>
              <p className="text-sm text-zinc-500 mt-1">
                Metodo: {mfaMethod === 'TOTP' ? 'Authenticator App' : 'Email'}
              </p>
            </div>

            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-center text-2xl tracking-[8px] focus:outline-none focus:border-emerald-500"
              placeholder="000000"
              maxLength={6}
              required
            />

            {error && (
              <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-70"
            >
              {loading ? 'Verifica in corso...' : 'Verifica codice 2FA'}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-3 text-center text-sm text-zinc-500">
          <p>
            Non hai un account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 transition">
              Crea profilo
            </Link>
          </p>
          <Link to="/" className="inline-block text-xs text-zinc-400 hover:text-emerald-400 transition">
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}