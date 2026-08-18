import { useEffect, useState } from 'react';
import type { LogEntry } from '../api/client';

interface Props {
  logs: LogEntry[];
  connected: boolean;
}

function timeAgo(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 0) return 'just now';
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export function LiveLogTail({ logs, connected }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

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
            <span className="log-tail__time">{timeAgo(log.timestamp, now)}</span>
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
