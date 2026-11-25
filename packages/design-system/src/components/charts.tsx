export function Sparkline({
  values,
  width = 160,
  height = 48,
  stroke = 'var(--ar-electric)',
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');
  const area = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      className="ar-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <polygon points={area} fill={stroke} opacity="0.08" />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DEFAULT_COLORS = ['#2f7bff', '#5fd5ff', '#9bb4d6', '#58d6a9', '#f0b35a'];

export function DonutChart({
  data,
  size = 148,
  thickness = 12,
  centerLabel,
  centerValue,
}: {
  data: Array<{ label: string; value: number; color?: string }>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="ar-donut">
      <div className="ar-donut__visual" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Allocation chart">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--ar-line)"
            strokeWidth={thickness}
          />
          {data.map((item, index) => {
            const fraction = total > 0 ? item.value / total : 0;
            const dash = fraction * circumference;
            const element = (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return element;
          })}
        </svg>
        <div className="ar-donut__center">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="ar-donut__legend">
        {data.map((item, index) => (
          <li key={item.label}>
            <i style={{ background: item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length] }} />
            <span>{item.label}</span>
            <b>{total > 0 ? `${Math.round((item.value / total) * 100)}%` : '0%'}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
