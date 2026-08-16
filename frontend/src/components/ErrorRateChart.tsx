import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ErrorRateBucket } from '../api/client';

interface Props {
  buckets: ErrorRateBucket[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function ErrorRateChart({ buckets }: Props) {
  const data = buckets.map((b) => {
    const row: Record<string, number | string> = { time: formatTime(b.key_as_string), info: 0, warn: 0, error: 0 };
    for (const level of b.by_level.buckets) {
      row[level.key] = level.doc_count;
    }
    return row;
  });

  return (
    <div className="panel">
      <h2 className="panel__title">Log volume by level</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262932" />
          <XAxis dataKey="time" stroke="#8b8f9a" fontSize={12} interval="preserveStartEnd" />
          <YAxis stroke="#8b8f9a" fontSize={12} />
          <Tooltip contentStyle={{ background: '#1a1d24', border: '1px solid #262932', borderRadius: 8 }} />
          <Area type="monotone" dataKey="info" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
          <Area type="monotone" dataKey="warn" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
          <Area type="monotone" dataKey="error" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.7} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="legend">
        <span className="legend__item"><span className="legend__dot legend__dot--info" /> Info</span>
        <span className="legend__item"><span className="legend__dot legend__dot--warn" /> Warn</span>
        <span className="legend__item"><span className="legend__dot legend__dot--error" /> Error</span>
      </div>
    </div>
  );
}
