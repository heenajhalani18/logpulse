import { useEffect, useState } from 'react';
import { fetchErrorRate, fetchTopErrors, type ErrorRateBucket, type TopErrorBucket } from './api/client';
import { useLiveLogs } from './hooks/useLiveLogs';
import { StatCard } from './components/StatCard';
import { ErrorRateChart } from './components/ErrorRateChart';
import { TopErrorsPanel } from './components/TopErrorsPanel';
import { LiveLogTail } from './components/LiveLogTail';
import { LoginScreen } from './components/LoginScreen';
import './App.css';

function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('logpulse_token'));
  const [buckets, setBuckets] = useState<ErrorRateBucket[]>([]);
  const [topErrors, setTopErrors] = useState<TopErrorBucket[]>([]);
  const { logs, connected } = useLiveLogs(50);

  useEffect(() => {
    if (!authed) return;

    async function load() {
      try {
        const [rate, top] = await Promise.all([fetchErrorRate('10s'), fetchTopErrors()]);
        setBuckets(rate.slice(-30));
        setTopErrors(top);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [authed]);

  function handleLogout() {
    localStorage.removeItem('logpulse_token');
    setAuthed(false);
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  const totalLogs = buckets.reduce((sum, b) => sum + b.doc_count, 0);
  const totalErrors = buckets.reduce((sum, b) => {
    const err = b.by_level.buckets.find((l) => l.key === 'error');
    return sum + (err?.doc_count ?? 0);
  }, 0);
  const errorRate = totalLogs > 0 ? ((totalErrors / totalLogs) * 100).toFixed(1) : '0.0';

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1>LogPulse</h1>
          <p className="dashboard__subtitle">Real-time log analytics, built on Elasticsearch</p>
        </div>
        <div className="dashboard__header-right">
          <span className={`status-dot ${connected ? 'status-dot--live' : 'status-dot--off'}`}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
          <button className="logout-button" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <section className="stat-grid">
        <StatCard label="Logs (last ~5 min)" value={totalLogs.toString()} />
        <StatCard label="Error rate" value={`${errorRate}%`} tone={parseFloat(errorRate) > 15 ? 'error' : 'default'} />
        <StatCard label="Services reporting" value={topErrors.length.toString()} />
        <StatCard label="Errors (last ~5 min)" value={totalErrors.toString()} tone={totalErrors > 20 ? 'error' : 'default'} />
      </section>

      <section className="dashboard__chart">
        <ErrorRateChart buckets={buckets} />
      </section>

      <section className="dashboard__grid">
        <TopErrorsPanel buckets={topErrors} />
        <LiveLogTail logs={logs} connected={connected} />
      </section>
    </div>
  );
}

export default App;
