import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '../api/client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws/logs';

export function useLiveLogs(maxItems = 50) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        // Retry after 3 seconds — handles Render free-tier services waking up or restarting
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

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
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [maxItems]);

  return { logs, connected };
}
