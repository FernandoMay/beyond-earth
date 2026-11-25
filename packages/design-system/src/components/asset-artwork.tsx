import type { AssetCategory } from '@aerospace/shared-types';

type ArtworkKind =
  | 'engine'
  | 'aircraft'
  | 'satellite'
  | 'tooling'
  | 'drone'
  | 'ground'
  | 'service'
  | 'component'
  | 'inventory';

function kindFor(category: AssetCategory): ArtworkKind {
  switch (category) {
    case 'engine':
      return 'engine';
    case 'aircraft':
      return 'aircraft';
    case 'satellite':
      return 'satellite';
    case 'tooling':
      return 'tooling';
    case 'drone-fleet':
      return 'drone';
    case 'orbital-infrastructure':
      return 'ground';
    case 'service-contract':
      return 'service';
    case 'component':
      return 'component';
    case 'inventory':
      return 'inventory';
  }
}

function Turbine({ accent }: { accent: string }) {
  return (
    <g>
      <circle
        cx="300"
        cy="132"
        r="60"
        fill="none"
        stroke={accent}
        strokeWidth="1.4"
        opacity="0.9"
      />
      <circle
        cx="300"
        cy="132"
        r="43"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <circle cx="300" cy="132" r="12" fill="none" stroke={accent} strokeWidth="1.5" />
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 14;
        const x1 = 300 + Math.cos(angle) * 14;
        const y1 = 132 + Math.sin(angle) * 14;
        const x2 = 300 + Math.cos(angle + 0.22) * 43;
        const y2 = 132 + Math.sin(angle + 0.22) * 43;
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} Q ${300 + Math.cos(angle + 0.1) * 28} ${132 + Math.sin(angle + 0.1) * 28} ${x2} ${y2}`}
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.55"
          />
        );
      })}
      <path d="M198 154 118 184l18-38 62 8Z" fill={accent} opacity="0.12" />
      <path
        d="M214 111h-55m55 21h-79m79 21h-48"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
      />
      <path d="M360 132h40" stroke={accent} strokeWidth="1" opacity="0.5" />
    </g>
  );
}

function Aircraft({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M104 149c30-7 55-13 89-17l25-32 14 3-9 30 44-3 35-33 13 4-19 31c24 2 54 5 83 15 11 4 17 9 12 14-7 7-33 10-60 11l-173 2c-31 0-70-3-77-9-4-4 2-9 23-16Z"
        fill={accent}
        fillOpacity="0.09"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M184 165h76m-104 4h17m135-4h33" stroke={accent} strokeWidth="1.2" opacity="0.7" />
      <circle cx="264" cy="116" r="3.4" fill={accent} />
      <path d="M89 197h306" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
      <path
        d="m118 175 15 23m218-23-17 23"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.25"
      />
    </g>
  );
}

function Satellite({ accent }: { accent: string }) {
  return (
    <g>
      <rect
        x="211"
        y="101"
        width="60"
        height="72"
        rx="5"
        fill={accent}
        fillOpacity="0.08"
        stroke="currentColor"
      />
      <path d="M225 117h32m-32 16h32m-32 16h20" stroke={accent} strokeWidth="1.1" opacity="0.7" />
      <path
        d="M211 124h-74v38h74m60-38h74v38h-74"
        fill={accent}
        fillOpacity="0.04"
        stroke="currentColor"
      />
      <path
        d="M137 124v38m16-38v38m19-38v38m-35 0h35m36-38v38m16-38v38m19-38v38m-35 0h35"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.35"
      />
      <path d="M241 101V76m0 0-11-13m11 13 11-13" stroke={accent} strokeWidth="1.2" />
      <ellipse cx="241" cy="76" rx="14" ry="5" fill="none" stroke={accent} strokeWidth="1" />
      <path
        d="M160 208c38 12 122 12 160 0"
        stroke={accent}
        strokeWidth="1"
        opacity="0.4"
        strokeDasharray="4 7"
      />
    </g>
  );
}

function Tooling({ accent }: { accent: string }) {
  return (
    <g>
      <rect
        x="161"
        y="82"
        width="170"
        height="118"
        rx="3"
        fill={accent}
        fillOpacity="0.04"
        stroke="currentColor"
      />
      <rect
        x="178"
        y="99"
        width="80"
        height="55"
        rx="2"
        fill="none"
        stroke={accent}
        strokeWidth="1.1"
        opacity="0.7"
      />
      <path d="M218 99v55m-40-27h80" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <path d="M290 99v55h24v-55" fill="none" stroke="currentColor" />
      <circle cx="302" cy="126" r="7" fill="none" stroke={accent} />
      <path d="M302 119v14m-7-7h14" stroke={accent} strokeWidth="0.8" />
      <path d="M186 172h120l-12 16H198Z" fill={accent} fillOpacity="0.08" stroke="currentColor" />
      <path d="M161 82h170M161 200h170" stroke={accent} strokeWidth="1.2" opacity="0.6" />
      <path d="M149 210h194" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
    </g>
  );
}

function Drone({ accent }: { accent: string }) {
  return (
    <g>
      <path d="M203 139h74l16 28h-106Z" fill={accent} fillOpacity="0.09" stroke="currentColor" />
      <path
        d="M217 139 186 101m65 38 31-38M217 167l-35 27m66-27 35 27"
        stroke={accent}
        strokeWidth="1.2"
        opacity="0.7"
      />
      <ellipse cx="181" cy="96" rx="33" ry="5" fill="none" stroke="currentColor" opacity="0.45" />
      <ellipse cx="299" cy="96" rx="33" ry="5" fill="none" stroke="currentColor" opacity="0.45" />
      <ellipse cx="177" cy="198" rx="26" ry="4" fill="none" stroke="currentColor" opacity="0.35" />
      <ellipse cx="303" cy="198" rx="26" ry="4" fill="none" stroke="currentColor" opacity="0.35" />
      <circle cx="240" cy="155" r="7" fill="none" stroke={accent} strokeWidth="1.4" />
      <path d="M240 155v22h-14" stroke={accent} strokeWidth="1" />
      <path d="M136 220h208" stroke="currentColor" opacity="0.14" strokeDasharray="2 8" />
    </g>
  );
}

function Ground({ accent }: { accent: string }) {
  return (
    <g>
      <path
        d="M328 183c-14-49-49-77-89-77s-75 28-89 77"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M306 183c-10-35-35-55-67-55s-57 20-67 55"
        fill="none"
        stroke={accent}
        strokeWidth="1"
        opacity="0.6"
      />
      <path d="M240 183v-47m0 0-13-21m13 21 13-21" stroke={accent} strokeWidth="1.4" />
      <circle cx="240" cy="136" r="5" fill={accent} />
      <path
        d="M240 111c-25 9-30 34-21 51m21-51c25 9 30 34 21 51"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M172 190h136l-12 18H184Z" fill={accent} fillOpacity="0.07" stroke="currentColor" />
      <path d="M205 199h70m-60 0v9m50-9v9" stroke="currentColor" opacity="0.3" />
      <path d="M112 221h268" stroke="currentColor" opacity="0.16" />
    </g>
  );
}

function Service({ accent }: { accent: string }) {
  return (
    <g>
      <circle cx="240" cy="142" r="58" fill="none" stroke="currentColor" opacity="0.25" />
      <ellipse
        cx="240"
        cy="142"
        rx="58"
        ry="21"
        transform="rotate(-24 240 142)"
        fill="none"
        stroke={accent}
        strokeWidth="1.2"
      />
      <ellipse
        cx="240"
        cy="142"
        rx="86"
        ry="31"
        transform="rotate(-24 240 142)"
        fill="none"
        stroke="currentColor"
        opacity="0.15"
        strokeDasharray="4 6"
      />
      <circle cx="240" cy="142" r="9" fill={accent} fillOpacity="0.2" stroke={accent} />
      {[
        [154, 102],
        [330, 129],
        [200, 205],
        [302, 193],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="4.5" fill={accent} />
          <circle cx={cx} cy={cy} r="10" fill="none" stroke={accent} opacity="0.3" />
        </g>
      ))}
      <path
        d="M154 102c24-30 83-38 133-12M330 129c10 23-9 45-28 64M200 205c-30-9-45-34-46-63"
        fill="none"
        stroke="currentColor"
        opacity="0.2"
      />
    </g>
  );
}

function Component({ accent }: { accent: string }) {
  return (
    <g>
      <circle cx="240" cy="139" r="54" fill={accent} fillOpacity="0.05" stroke="currentColor" />
      <circle cx="240" cy="139" r="25" fill="none" stroke={accent} />
      <circle cx="240" cy="139" r="9" fill={accent} fillOpacity="0.2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 12;
        const x1 = 240 + Math.cos(angle) * 38;
        const y1 = 139 + Math.sin(angle) * 38;
        const x2 = 240 + Math.cos(angle) * 54;
        const y2 = 139 + Math.sin(angle) * 54;
        return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke="currentColor" opacity="0.45" />;
      })}
      <path d="M240 85v-12m0 132v-12m-53-54h-12m130 0h-12" stroke={accent} strokeWidth="1.2" />
    </g>
  );
}

function Inventory({ accent }: { accent: string }) {
  return (
    <g>
      {[0, 1, 2].map((col) =>
        [0, 1].map((row) => (
          <g key={`${col}-${row}`}>
            <rect
              x={170 + col * 54}
              y={108 + row * 52}
              width="48"
              height="42"
              rx="2"
              fill={accent}
              fillOpacity="0.04"
              stroke="currentColor"
              opacity={0.75}
            />
            <path
              d={`M182 ${128 + row * 52}h24M182 ${136 + row * 52}h16`}
              stroke={accent}
              opacity="0.6"
            />
          </g>
        )),
      )}
      <path d="M150 216h190" stroke="currentColor" opacity="0.16" />
      <path d="M356 100v103h-228" fill="none" stroke={accent} strokeWidth="1" opacity="0.35" />
    </g>
  );
}

export function AssetArtwork({
  category,
  label,
  className = '',
}: {
  category: AssetCategory;
  label: string;
  className?: string;
}) {
  const kind = kindFor(category);
  const accent = 'var(--ar-electric, #2f7bff)';

  return (
    <svg
      viewBox="0 0 480 280"
      className={`ar-artwork ${className}`}
      role="img"
      aria-label={`${label} technical illustration`}
    >
      <defs>
        <linearGradient id={`ar-art-bg-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#081426" />
          <stop offset="58%" stopColor="#07101f" />
          <stop offset="100%" stopColor="#040811" />
        </linearGradient>
        <radialGradient id={`ar-art-glow-${kind}`} cx="62%" cy="45%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <pattern id={`ar-art-grid-${kind}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0v24" fill="none" stroke="#7ba6d8" strokeOpacity="0.055" />
        </pattern>
      </defs>
      <rect width="480" height="280" fill={`url(#ar-art-bg-${kind})`} />
      <rect width="480" height="280" fill={`url(#ar-art-grid-${kind})`} />
      <rect width="480" height="280" fill={`url(#ar-art-glow-${kind})`} />
      <path d="M0 232h480M0 248h480" stroke="#7ba6d8" strokeOpacity="0.06" />
      <g color="#c9d7ea" fill="none">
        {kind === 'engine' && <Turbine accent={accent} />}
        {kind === 'aircraft' && <Aircraft accent={accent} />}
        {kind === 'satellite' && <Satellite accent={accent} />}
        {kind === 'tooling' && <Tooling accent={accent} />}
        {kind === 'drone' && <Drone accent={accent} />}
        {kind === 'ground' && <Ground accent={accent} />}
        {kind === 'service' && <Service accent={accent} />}
        {kind === 'component' && <Component accent={accent} />}
        {kind === 'inventory' && <Inventory accent={accent} />}
      </g>
      <g
        fill="#8fa3bf"
        fontSize="8"
        fontFamily="var(--ar-font-mono, monospace)"
        letterSpacing="1.4"
      >
        <text x="20" y="26">
          ARWA / {kind.toUpperCase()}
        </text>
        <text x="20" y="262">
          ILLUSTRATIVE ASSET VIEW
        </text>
        <text x="394" y="262">
          REF. 01
        </text>
      </g>
      <path d="M16 44h22M16 44v22M464 236h-22m22 0v-22" stroke="#7ba6d8" strokeOpacity="0.25" />
    </svg>
  );
}
