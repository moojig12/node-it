// Read-only summary of `GET /api/nodes/:id/aggregate` for a subtree root.
// The Explorer re-fetches this whenever the tree mutates.

function formatValue(value, strategy, type) {
  if (value == null) return '—';
  if (strategy === 'count') return value.toLocaleString();
  if (type === 'currency') {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `$${Number(value).toFixed(2)}`;
    }
  }
  if (Number.isInteger(value)) return value.toLocaleString();
  return Number(value).toFixed(2);
}

function AggregateStrip({ aggregate, category }) {
  if (!aggregate) return null;
  const entries = Object.entries(aggregate.aggregates || {});

  return (
    <div className="aggregate-strip">
      <div className="agg-stat">
        <span className="agg-label">Nodes</span>
        <span className="agg-value">{aggregate.nodeCount}</span>
        <span className="agg-strategy">in subtree</span>
      </div>
      {entries.map(([key, data]) => {
        const field = category.fields.find((f) => f.key === key);
        return (
          <div key={key} className="agg-stat">
            <span className="agg-label">{field?.label ?? key}</span>
            <span className="agg-value">
              {formatValue(data.value, data.strategy, field?.type)}
            </span>
            <span className="agg-strategy">{data.strategy}</span>
          </div>
        );
      })}
    </div>
  );
}

export default AggregateStrip;
