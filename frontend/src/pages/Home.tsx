import { Link } from 'react-router-dom';
import { Zap, Brain, MapPin, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const features = [
  {
    icon: Zap,
    title: 'Monitoraggio in tempo reale',
    description: 'Dashboard unificata per impianti, metriche e performance energetiche.',
  },
  {
    icon: Brain,
    title: 'Intelligenza artificiale',
    description: 'Insight predittivi e assistente conversazionale sui dati della rete.',
  },
  {
    icon: MapPin,
    title: 'Analisi territoriale',
    description: 'Visualizza e confronta gli impianti su mappa con dati geospaziali.',
  },
  {
    icon: Shield,
    title: 'Accesso sicuro',
    description: 'Autenticazione JWT, ruoli granulari e supporto MFA.',
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Caricamento...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500">
              <Zap className="h-6 w-6 text-black" />
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">GridPulse</div>
              <div className="text-[10px] text-zinc-500 -mt-0.5 tracking-widest">ENERGY INTELLIGENCE</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="rounded-2xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-500/50 hover:text-emerald-400"
            >
              Registrati
            </Link>
            <Link
              to="/login"
              className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Accedi
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
            Piattaforma energetica
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Controllo, analisi e intelligenza per la tua rete energetica
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            GridPulse centralizza dati operativi, report ESG e strumenti AI in un&apos;unica
            piattaforma pensata per operatori e amministratori.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 font-semibold text-black transition hover:bg-emerald-400"
            >
              Crea il tuo profilo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-6 py-3.5 font-medium text-zinc-200 transition hover:border-emerald-500/50 hover:text-emerald-400"
            >
              Ho già un account
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-800/80 bg-zinc-900/30 py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-zinc-100">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-500">
        GridPulse v0.2.0 — Accesso riservato al personale autorizzato
      </footer>
    </div>
  );
}