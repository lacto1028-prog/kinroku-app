import { useEffect, useMemo, useState } from "react";

interface SparklineProps {
  data: number[];
  stroke?: string;
  className?: string;
  strokeWidth?: number;
  /** 最後の点にドットを表示 */
  dot?: boolean;
}

/** 描画アニメーション付きの小さな折れ線グラフ */
export default function Sparkline({
  data,
  stroke = "#A8732C",
  className,
  strokeWidth = 2,
  dot = true,
}: SparklineProps) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const { line, area, last } = useMemo(() => {
    const w = 100;
    const h = 32;
    const pad = 3;
    const src = data.length >= 2 ? data : [0, ...data, 0];
    const max = Math.max(...src);
    const min = Math.min(...src);
    const range = max - min || 1;
    const pts = src.map((v, i) => [
      pad + (i * (w - pad * 2)) / (src.length - 1),
      h - pad - ((v - min) / range) * (h - pad * 2),
    ]);
    // Catmull-Rom をベジェに変換して滑らかに
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    const areaPath = `${d} L ${w - pad} ${h} L ${pad} ${h} Z`;
    return { line: d, area: areaPath, last: pts[pts.length - 1] };
  }, [data]);

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d={area} fill={stroke} opacity={0.13} style={{ transition: "opacity .8s ease .4s", opacity: drawn ? 0.13 : 0 }} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray={320}
        strokeDashoffset={drawn ? 0 : 320}
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1) .15s" }}
      />
      {dot && (
        <circle
          cx={last[0]}
          cy={last[1]}
          r={2.6}
          fill={stroke}
          style={{ transition: "opacity .4s ease 1s", opacity: drawn ? 1 : 0 }}
        />
      )}
    </svg>
  );
}