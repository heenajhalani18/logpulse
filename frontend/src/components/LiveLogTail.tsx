import type { LogEntry } from '../api/client';

interface Props {
  logs: LogEntry[];
  connected: boolean;
}

export function LiveLogTail({ logs, connected }: Props) {
  return (
    <div className="panel">
      <div className="panel__title-row">
        <h2 className="panel__title">Live log tail</h2>
        <span className={`status-dot ${connected ? 'status-dot--live' : 'status-dot--off'}`}>
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>
      <div className="log-tail">
        {logs.map((log, i) => (
          <div key={i} className={`log-tail__row log-tail__row--${log.level}`}>
            <span className="log-tail__time">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`log-tail__level log-tail__level--${log.level}`}>{log.level}</span>
            <span className="log-tail__service">{log.service}</span>
            <span className="log-tail__message">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="empty-state">Waiting for logs…</p>}
      </div>
    </div>
  );
}
