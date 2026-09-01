const SKIN = {
  warm: '#F4C2A1',
  cool: '#C9D8E8',
  cartoon: '#FFE066',
};

const FEATURES = {
  warm: {
    hair: '#5c3d2e',
    eye: '#3a2a28',
    brow: '#4a3228',
    blush: '#e8a090',
    lip: '#c97b7b',
    halo: 'rgba(244, 194, 161, 0.28)',
  },
  cool: {
    hair: '#4a5d73',
    eye: '#2c3d52',
    brow: '#3d5166',
    blush: '#b7c4d4',
    lip: '#8fa3b8',
    halo: 'rgba(201, 216, 232, 0.28)',
  },
  cartoon: {
    hair: '#f0a500',
    eye: '#2b2b2b',
    brow: '#2b2b2b',
    blush: '#ffb3c1',
    lip: '#e85d75',
    halo: 'rgba(255, 224, 102, 0.32)',
  },
};

export default function Avatar({
  isSpeaking = false,
  isListening = false,
  style = 'warm',
  size = 200,
}) {
  const variant = FEATURES[style] ? style : 'warm';
  const skin = SKIN[variant];
  const f = FEATURES[variant];
  const cartoon = variant === 'cartoon';

  const classes = [
    'avatar',
    isSpeaking ? 'is-speaking' : '',
    isListening ? 'is-listening' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={{ '--avatar-halo': f.halo, width: size, height: size }}>
      <svg
        viewBox="0 0 200 220"
        width={size}
        height={size}
        role="img"
        aria-label={`${variant} companion face${isSpeaking ? ', speaking' : isListening ? ', listening' : ''}`}
      >
        <defs>
          <radialGradient id={`bg-${variant}`} cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor={f.halo} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <circle cx="100" cy="108" r="92" fill={`url(#bg-${variant})`} />
        <circle cx="100" cy="108" r="78" fill="rgba(255,255,255,0.04)" />

        <g className="avatar-body">
          <ellipse cx="100" cy="48" rx="54" ry="28" fill={f.hair} />
          <path
            d={
              cartoon
                ? 'M48 88 C48 44 152 44 152 88 L148 58 C130 28 70 28 52 58 Z'
                : 'M46 92 C50 42 150 42 154 92 C148 58 128 36 100 34 C72 36 52 58 46 92 Z'
            }
            fill={f.hair}
          />

          <ellipse cx="48" cy="118" rx="10" ry="16" fill={skin} />
          <ellipse cx="152" cy="118" rx="10" ry="16" fill={skin} />

          <ellipse cx="100" cy="118" rx="58" ry="68" fill={skin} />

          <ellipse cx="72" cy="128" rx="10" ry="6" fill={f.blush} opacity="0.45" />
          <ellipse cx="128" cy="128" rx="10" ry="6" fill={f.blush} opacity="0.45" />

          <g className="avatar-brows">
            <path
              d="M68 86 Q80 78 92 86"
              fill="none"
              stroke={f.brow}
              strokeWidth={cartoon ? 3.5 : 2.6}
              strokeLinecap="round"
            />
            <path
              d="M108 86 Q120 78 132 86"
              fill="none"
              stroke={f.brow}
              strokeWidth={cartoon ? 3.5 : 2.6}
              strokeLinecap="round"
            />
          </g>

          <g className="avatar-eyes">
            <ellipse cx="80" cy="102" rx={cartoon ? 10 : 8} ry={cartoon ? 12 : 9} fill="#fff" />
            <ellipse cx="120" cy="102" rx={cartoon ? 10 : 8} ry={cartoon ? 12 : 9} fill="#fff" />
            <circle cx="80" cy="103" r={cartoon ? 5.5 : 4.2} fill={f.eye} />
            <circle cx="120" cy="103" r={cartoon ? 5.5 : 4.2} fill={f.eye} />
            <circle cx="82.5" cy="100.5" r="1.5" fill="#fff" />
            <circle cx="122.5" cy="100.5" r="1.5" fill="#fff" />
          </g>

          <path
            d="M100 114 L96 128 Q100 132 104 128 Z"
            fill={skin}
            stroke={f.brow}
            strokeWidth="1.1"
            strokeLinejoin="round"
            opacity="0.7"
          />

          <g className="avatar-mouth" transform="translate(100 152)">
            <ellipse className="avatar-mouth-shape" cx="0" cy="0" rx="16" ry="10" fill={f.lip} />
            <ellipse className="avatar-mouth-inner" cx="0" cy="2" rx="10" ry="5" fill="#6b3040" />
          </g>
        </g>
      </svg>
    </div>
  );
}
