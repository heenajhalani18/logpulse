import { useState, type FormEvent } from 'react';
import { login } from '../api/client';

interface Props {
  onLogin: () => void;
}

const sampleLogLines = [
  { level: 'info', service: 'api-gateway', message: 'Request processed successfully' },
  { level: 'error', service: 'auth-service', message: 'Failed login attempt: invalid credentials' },
  { level: 'info', service: 'payments-service', message: 'Payment completed' },
  { level: 'warn', service: 'auth-service', message: 'Rate limit approaching threshold' },
  { level: 'info', service: 'api-gateway', message: 'Cache hit for key' },
  { level: 'error', service: 'payments-service', message: 'Database connection timeout' },
  { level: 'info', service: 'auth-service', message: 'User logged in' },
  { level: 'warn', service: 'api-gateway', message: 'Slow response time detected' },
];

export function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const token = await login(username, password);
      localStorage.setItem('logpulse_token', token);
      onLogin();
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand__mesh" />
        <div className="auth-brand__content">
          <div className="auth-brand__logo">
            <span className="auth-brand__logo-dot" />
            LogPulse
          </div>
          <h1 className="auth-brand__headline">
            Watch every service.<br />Catch every spike.
          </h1>
          <p className="auth-brand__sub">
            A real-time log analytics dashboard built on Elasticsearch, Node.js, TypeScript,
            and React — full-text search, live aggregations, and instant alerts.
          </p>

          <div className="auth-brand__features">
            <div className="auth-brand__feature">
              <span className="auth-brand__feature-icon">⚡</span>
              <span>Live WebSocket log tail</span>
            </div>
            <div className="auth-brand__feature">
              <span className="auth-brand__feature-icon">📊</span>
              <span>Error-rate aggregations</span>
            </div>
            <div className="auth-brand__feature">
              <span className="auth-brand__feature-icon">🔔</span>
              <span>Threshold-based alerting</span>
            </div>
          </div>

          <div className="auth-terminal">
            <div className="auth-terminal__scroll">
              {[...sampleLogLines, ...sampleLogLines].map((line, i) => (
                <div key={i} className={`auth-terminal__line auth-terminal__line--${line.level}`}>
                  <span className="auth-terminal__level">{line.level}</span>
                  <span className="auth-terminal__service">{line.service}</span>
                  <span className="auth-terminal__message">{line.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="auth-card__subtitle">Enter your credentials to view the dashboard</p>

          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <span className="login-button__spinner" /> : 'Sign in'}
          </button>

          <p className="login-footer">github.com/heenajhalani18/logpulse</p>
        </form>
      </div>
    </div>
  );
}
