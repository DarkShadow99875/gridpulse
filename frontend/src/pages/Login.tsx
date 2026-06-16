import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMethod, setMfaMethod] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.mfaRequired) {
        setMfaRequired(true);
        setMfaMethod(data.mfaMethod);
      } else {
        // Normal login success
        await login(email, password); // this will also store tokens
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: mfaCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Codice 2FA non valido');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md p-8 bg-zinc-900 rounded-3xl border border-zinc-800">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-3xl font-bold">G</span>
          </div>
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

        <div className="mt-6 text-center text-xs text-zinc-500">
          Accesso riservato al personale autorizzato
        </div>
      </div>
    </div>
  );
}

