"use client";

import { useState, useRef, MouseEvent } from "react";

export type ChartSeries = {
  key: string;
  label: string;
  strokeColor: string;
  fillGradientStart?: string;
  fillGradientEnd?: string;
};

export type InteractiveChartProps = {
  data: Record<string, string | number>[];
  xAxisKey: string;
  series: ChartSeries[];
  height?: number;
  valueFormatter?: (value: number) => string;
};

export function InteractiveChart({
  data,
  xAxisKey,
  series,
  height = 350,
  valueFormatter = (val) => val.toLocaleString(),
}: InteractiveChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          border: "1px dashed var(--line)",
          borderRadius: "16px",
          background: "rgba(0, 0, 0, 0.01)",
        }}
      >
        No chart data available.
      </div>
    );
  }

  // Dimensions inside viewBox
  const viewWidth = 800;
  const viewHeight = height;
  const padding = { top: 30, right: 30, bottom: 40, left: 65 };
  const plotWidth = viewWidth - padding.left - padding.right;
  const plotHeight = viewHeight - padding.top - padding.bottom;

  // Calculate limits (start Y at 0 for financial scales)
  const yValues = data.flatMap((d) => series.map((s) => Number(d[s.key] || 0)));
  const yMin = 0;
  const rawMax = Math.max(...yValues, 100);
  // Add a 15% buffer to top of chart
  const yMax = Math.ceil(rawMax * 1.15);

  // Helper coordinate mappers
  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const scale = yMax - yMin;
    if (scale === 0) return padding.top + plotHeight / 2;
    return padding.top + (1 - (val - yMin) / scale) * plotHeight;
  };

  // Grid line calculations
  const yTicksCount = 5;
  const yTicks = Array.from({ length: yTicksCount }, (_, i) => {
    return yMin + (i * (yMax - yMin)) / (yTicksCount - 1);
  });

  // Calculate coordinates for mouse hover
  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Relative position inside the actual rendered client rect
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // Map to viewBox coordinate space
    const xView = (clientX / rect.width) * viewWidth;
    
    // Reverse calculation to find index
    const relativeX = xView - padding.left;
    const fraction = relativeX / plotWidth;
    const rawIndex = fraction * (data.length - 1);
    const index = Math.max(0, Math.min(data.length - 1, Math.round(rawIndex)));
    
    setHoverIndex(index);
    
    // Tooltip position: offset near the active data point
    const activeX = getX(index);
    // Position tooltip box in client rect coords
    const activeClientX = (activeX / viewWidth) * rect.width;
    const activeClientY = (clientY / viewHeight) * rect.height;

    setTooltipPos({
      x: activeClientX,
      y: activeClientY - 10,
    });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setTooltipPos(null);
  };

  // Generate paths for each series
  const renderPaths = () => {
    return series.map((s) => {
      // Build point list
      const points = data.map((d, i) => ({
        x: getX(i),
        y: getY(Number(d[s.key] || 0)),
      }));

      if (points.length === 0) return null;

      // Construct SVG path string (using smooth lines/Cubic Bezier or straight lines)
      // Since it's a trend line, a smooth Cubic Bezier path looks extremely premium.
      let dPath = "";
      if (points.length === 1) {
        dPath = `M ${points[0].x} ${points[0].y}`;
      } else {
        dPath = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i + 1];
          // Control points for smooth bezier interpolation
          const cpX1 = p0.x + (p1.x - p0.x) / 3;
          const cpY1 = p0.y;
          const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
          const cpY2 = p1.y;
          dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
        }
      }

      // Construct area path that closes at bottom
      const areaPath = `
        ${dPath}
        L ${points[points.length - 1].x} ${viewHeight - padding.bottom}
        L ${points[0].x} ${viewHeight - padding.bottom}
        Z
      `;

      const gradId = `grad-${s.key}`;

      return (
        <g key={s.key}>
          {/* Gradients */}
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.fillGradientStart || s.strokeColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.fillGradientEnd || s.strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Line Stroke */}
          <path
            d={dPath}
            fill="none"
            stroke={s.strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0px 2px 4px ${s.strokeColor}25)` }}
          />

          {/* Individual Dots on Hover */}
          {hoverIndex !== null && (
            <circle
              cx={getX(hoverIndex)}
              cy={getY(Number(data[hoverIndex][s.key] || 0))}
              r="5"
              fill={s.strokeColor}
              stroke="var(--surface-2)"
              strokeWidth="2"
            />
          )}
        </g>
      );
    });
  };

  // Select X-axis label coordinates (e.g. show 5-6 ticks maximum to prevent overlap)
  const xTickInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        style={{ overflow: "visible", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Horizontal Grid lines */}
        <g stroke="rgba(0, 0, 0,0.04)" strokeDasharray="3 3">
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            return <line key={i} x1={padding.left} y1={y} x2={viewWidth - padding.right} y2={y} />;
          })}
        </g>

        {/* X and Y Axes labels */}
        <g fill="var(--muted)" fontSize="11" fontFamily="inherit">
          {/* Y Axis Ticks */}
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            // Format tickVal cleanly
            let formatted = tickVal >= 100000 ? `৳${(tickVal / 100000).toFixed(1)}L` : `৳${(tickVal / 1000).toFixed(0)}k`;
            if (tickVal === 0) formatted = "৳0";
            return (
              <text key={i} x={padding.left - 10} y={y + 4} textAnchor="end">
                {formatted}
              </text>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            if (i % xTickInterval !== 0 && i !== data.length - 1) return null;
            const x = getX(i);
            const label = String(d[xAxisKey] || "");
            return (
              <text key={i} x={x} y={viewHeight - padding.bottom + 20} textAnchor="middle">
                {label}
              </text>
            );
          })}
        </g>

        {/* Dynamic elements */}
        {renderPaths()}

        {/* Hover Highlight line */}
        {hoverIndex !== null && (
          <line
            x1={getX(hoverIndex)}
            y1={padding.top}
            x2={getX(hoverIndex)}
            y2={viewHeight - padding.bottom}
            stroke="rgba(0, 0, 0, 0.12)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}
      </svg>

      {/* HTML Floating Tooltip Box */}
      {hoverIndex !== null && tooltipPos && (
        <div
          className="glass-card"
          style={{
            position: "absolute",
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
            zIndex: 100,
            padding: "10px 14px",
            fontSize: "0.82rem",
            borderRadius: "12px",
            border: "1px solid var(--line)",
            backgroundColor: "rgba(11, 22, 41, 0.95)",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            display: "grid",
            gap: "6px",
            minWidth: "150px",
          }}
        >
          <strong style={{ borderBottom: "1px solid rgba(0, 0, 0,0.06)", paddingBottom: "4px", color: "var(--text)" }}>
            {data[hoverIndex][xAxisKey]}
          </strong>
          {series.map((s) => {
            const val = Number(data[hoverIndex][s.key] || 0);
            return (
              <div key={s.key} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: s.strokeColor }} />
                  {s.label}
                </span>
                <strong style={{ color: "var(--text)" }}>{valueFormatter(val)}</strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
