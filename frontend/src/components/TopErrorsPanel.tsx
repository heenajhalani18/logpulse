import type { TopErrorBucket } from '../api/client';

interface Props {
  buckets: TopErrorBucket[];
}

export function TopErrorsPanel({ buckets }: Props) {
  return (
    <div className="panel">
      <h2 className="panel__title">Top errors by service</h2>
      <div className="top-errors">
        {buckets.map((service) => (
          <div key={service.key} className="top-errors__service">
            <div className="top-errors__service-header">
              <span>{service.key}</span>
              <span className="top-errors__service-count">{service.doc_count}</span>
            </div>
            <ul className="top-errors__list">
              {service.by_message.buckets.map((msg) => (
                <li key={msg.key} className="top-errors__item">
                  <span className="top-errors__message">{msg.key}</span>
                  <span className="top-errors__badge">{msg.doc_count}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {buckets.length === 0 && <p className="empty-state">No errors recorded yet.</p>}
      </div>
    </div>
  );
}
