import type { CSSProperties } from 'react';

type Props = {
  size?: 'sm' | 'md';
  variant?: 'glass' | 'red';
  scale?: number;
  style?: CSSProperties;
};

const strokeShadow = (px: number) => {
  const shadows: string[] = [];
  for (let a = 0; a < 360; a += 45) {
    const x = Math.round(Math.cos((a * Math.PI) / 180) * px * 10) / 10;
    const y = Math.round(Math.sin((a * Math.PI) / 180) * px * 10) / 10;
    shadows.push(`${x}px ${y}px 0 #000`);
  }
  return shadows.join(', ');
};

export default function Logo({ size = 'md', variant = 'glass', scale = 1, style }: Props) {
  const big = size === 'md';
  const font = (big ? 22 : 16) * scale;
  const sub = (big ? 13 : 11) * scale;

  if (variant === 'red') {
    const strokeWidth = 1.2 * scale;
    const redSub = (big ? 16 : 14) * scale;
    return (
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 * scale, ...style }}>
        <span style={{
          fontFamily: "'Dancing Script', cursive",
          fontWeight: 700, fontSize: font * 1.9, color: '#e0202a',
          WebkitTextStroke: `${strokeWidth}px #000`,
          textShadow: strokeShadow(strokeWidth),
          paintOrder: 'stroke fill',
          lineHeight: 1,
        }}>
          E<span style={{ marginLeft: 4 * scale }}>daah</span>
        </span>
        <span style={{
          fontWeight: 800, fontSize: redSub, color: '#e0202a',
          WebkitTextStroke: `${strokeWidth * 0.7}px #000`,
          textShadow: strokeShadow(strokeWidth * 0.7),
          paintOrder: 'stroke fill',
          letterSpacing: '0.08em', lineHeight: 1,
        }}>
          AB
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 5 * scale,
      padding: `${(big ? 8 : 6) * scale}px ${(big ? 16 : 13) * scale}px`,
      borderRadius: 999,
      background: 'rgba(255,255,255,.14)',
      border: '1.5px solid rgba(255,255,255,.38)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      ...style,
    }}>
      <span style={{
        fontWeight: 800, fontSize: font, color: '#fff',
        letterSpacing: '0.02em', lineHeight: 1,
      }}>
        Edaah
      </span>
      <span style={{
        fontWeight: 600, fontSize: sub, color: 'rgba(255,255,255,.82)',
        letterSpacing: '0.1em', lineHeight: 1,
      }}>
        AB
      </span>
    </div>
  );
}
