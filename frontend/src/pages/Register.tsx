import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationMode, setInvitationMode] = useState(false);

  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token') || '';

  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!invitationToken) return;

    setInvitationMode(true);

    const loadInvitation = async () => {
      try {
        const info = await authService.getInvitationInfo(invitationToken);
        setEmail(info.email);
        setFirstName(info.firstName);
        setLastName(info.lastName);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Invito non valido');
      }
    };

    loadInvitation();
  }, [invitationToken]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri');
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        invitationToken: invitationToken || undefined,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registrazione non riuscita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-lg p-8 bg-zinc-900 rounded-3xl border border-zinc-800">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-black" />
            </div>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Crea il tuo profilo</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {invitationMode
              ? 'Completa la registrazione con il tuo invito'
              : 'Registrati per accedere a GridPulse'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500"
                placeholder="Mario"
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Cognome</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500"
                placeholder="Rossi"
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={invitationMode}
              className={`w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500 ${
                invitationMode ? 'opacity-70 cursor-not-allowed' : ''
              }`}
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
              placeholder="Minimo 8 caratteri"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Conferma password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500"
              placeholder="Ripeti la password"
              required
              minLength={8}
              autoComplete="new-password"
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
            {loading ? 'Creazione profilo...' : 'Crea profilo'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Hai già un account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
}