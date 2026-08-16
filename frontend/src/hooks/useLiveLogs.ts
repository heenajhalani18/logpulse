import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '../api/client';

export function useLiveLogs(maxItems = 50) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000/ws/logs');
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'log') {
          setLogs((prev) => [msg.data, ...prev].slice(0, maxItems));
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => ws.close();
  }, [maxItems]);

  return { logs, connected };
}
