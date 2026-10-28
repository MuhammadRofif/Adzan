import React from 'react';

/**
 * Ilustrasi latar: masjid, awan, matahari/bulan sabit & bintang.
 * SVG inline (±3 KB) — tanpa request gambar, tajam di semua layar.
 * Animasi hanya transform/opacity dan dimatikan saat prefers-reduced-motion.
 */
export const IslamicScene: React.FC<{ night?: boolean; className?: string }> = ({ night = false, className }) => (
  <svg
    className={className}
    viewBox="0 0 400 200"
    preserveAspectRatio="xMidYMax slice"
    aria-hidden="true"
    focusable="false"
  >
    {night ? (
      <g>
        {/* Bulan sabit */}
        <circle cx="330" cy="46" r="22" fill="#fff3c4" />
        <circle cx="341" cy="39" r="20" fill="#1e3a8a" />
        {/* Bintang */}
        {[[60, 30], [120, 60], [200, 24], [260, 70], [380, 90], [30, 90]].map(([x, y], i) => (
          <path
            key={i}
            className="scene-twinkle"
            style={{ animationDelay: `${i * 0.6}s` }}
            d={`M${x} ${y - 6} L${x + 1.8} ${y - 1.8} L${x + 6} ${y} L${x + 1.8} ${y + 1.8} L${x} ${y + 6} L${x - 1.8} ${y + 1.8} L${x - 6} ${y} L${x - 1.8} ${y - 1.8} Z`}
            fill="#ffe78a"
          />
        ))}
      </g>
    ) : (
      <g>
        {/* Matahari */}
        <circle cx="330" cy="48" r="26" fill="#ffd54a" />
        <circle cx="330" cy="48" r="36" fill="#ffd54a" opacity="0.25" />
      </g>
    )}

    {/* Awan */}
    <g className="scene-cloud" fill="#ffffff" opacity={night ? 0.15 : 0.9}>
      <ellipse cx="70" cy="60" rx="34" ry="14" />
      <ellipse cx="92" cy="52" rx="22" ry="14" />
      <ellipse cx="50" cy="56" rx="16" ry="10" />
    </g>
    <g className="scene-cloud scene-cloud-slow" fill="#ffffff" opacity={night ? 0.12 : 0.75}>
      <ellipse cx="230" cy="44" rx="28" ry="11" />
      <ellipse cx="248" cy="38" rx="17" ry="11" />
    </g>

    {/* Bukit */}
    <path d="M0 170 Q100 140 200 165 T400 160 V200 H0 Z" fill={night ? '#0f7a5c' : '#7deac4'} />
    <path d="M0 185 Q120 165 240 182 T400 178 V200 H0 Z" fill={night ? '#11614b' : '#43d6a6'} />

    {/* Masjid */}
    <g fill={night ? '#e0f2fe' : '#ffffff'}>
      {/* Menara kiri & kanan */}
      <rect x="128" y="96" width="12" height="80" rx="2" />
      <path d="M126 98 L134 80 L142 98 Z" />
      <rect x="260" y="96" width="12" height="80" rx="2" />
      <path d="M258 98 L266 80 L274 98 Z" />
      {/* Badan */}
      <rect x="150" y="128" width="100" height="50" rx="4" />
      {/* Kubah */}
      <path d="M160 130 Q160 92 200 86 Q240 92 240 130 Z" />
      <rect x="198" y="72" width="4" height="16" />
    </g>
    <path d="M196 70 a5 5 0 1 0 6 -4 a4 4 0 1 1 -6 4 Z" fill="#ffc21f" />
    {/* Pintu & jendela */}
    <g fill={night ? '#ffd54a' : '#38bdf8'} opacity={night ? 0.9 : 0.85}>
      <path d="M190 178 V156 Q200 144 210 156 V178 Z" />
      <path d="M164 160 V148 Q170 140 176 148 V160 Z" />
      <path d="M224 160 V148 Q230 140 236 148 V160 Z" />
    </g>
  </svg>
);
