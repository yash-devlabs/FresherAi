/**
 * Lightweight inline sparkline rendered as an SVG polyline.
 * Used inside the dashboard stat cards to mirror the reference design.
 */
export function Sparkline({ data, color = 'currentColor', className, }) {
    const width = 120;
    const height = 40;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((value, index) => {
        const x = data.length > 1 ? (index / (data.length - 1)) * width : width / 2;
        const y = height - ((value - min) / range) * (height - 6) - 3;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`;
    const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;
    return (<svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`}/>
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>);
}
