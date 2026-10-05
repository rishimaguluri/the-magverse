// PlannerCompanion.jsx
// The character: a small geometric Navigator creature — a squircle body, simple expressive
// eyes, a subtle Magverse-accent glow, and two tiny tool-arm ticks that animate while sorting.
// Pass B: grows from 8 to the spec's 10 states (adds `sorting`, `waiting`), redesigned to read
// as "tiny AI operator" rather than a plain circle-face avatar. Still pure CSS + inline SVG, no
// animation library. Every animation is wrapped in `@media (prefers-reduced-motion: no-preference)`
// so motion is opt-out by the OS, not opt-in here, and the character's meaning is always also
// stated in text (aria-label here, plus the caller's own companionMessage) — never conveyed
// only visually. Character state must never drive business logic — it is purely reactive.

const COMPANION_STATE_LABELS = {
  idle: 'idle', listening: 'listening', thinking: 'thinking', sorting: 'sorting tasks',
  planning: 'building a plan', concerned: 'a little concerned about the workload',
  ready: 'ready with a plan', working: 'calm, focused on your current session',
  celebrating: 'celebrating a finished task', waiting: 'waiting',
};

function PlannerCompanion({ state = 'idle', size = 96 }){
  const s = COMPANION_STATES.includes(state) ? state : 'idle';
  const eyeY = s === 'concerned' ? 2 : 0;
  const eyeScaleY = s === 'concerned' ? 0.55 : (s === 'celebrating' ? 1.15 : (s === 'waiting' ? 0.75 : 1));
  const bodyGlow = s === 'working' ? 0.35 : (s === 'concerned' ? 0.5 : (s === 'waiting' ? 0.45 : 0.85));
  const showArms = s === 'sorting' || s === 'planning';
  const showOrbit = s === 'thinking' || s === 'sorting' || s === 'planning';

  return (
    <div
      aria-label={'Navigator companion: ' + (COMPANION_STATE_LABELS[s] || s)}
      role="img"
      className={'planner-companion planner-companion--' + s}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <style>{`
        .planner-companion { display:flex; align-items:center; justify-content:center; }
        .planner-companion svg { width:100%; height:100%; display:block; overflow:visible; }
        .planner-companion-particle, .planner-companion-arm { opacity:0; }
        @media (prefers-reduced-motion: no-preference){
          .planner-companion--idle .planner-companion-body { animation: pcBreathe 4s ease-in-out infinite; }
          .planner-companion--waiting .planner-companion-body { animation: pcBreatheSlow 5s ease-in-out infinite; }
          .planner-companion--listening .planner-companion-body { animation: pcLeanPulse 1.4s ease-in-out infinite; }
          .planner-companion--thinking .planner-companion-body,
          .planner-companion--sorting .planner-companion-body,
          .planner-companion--planning .planner-companion-body { animation: pcSway 2.2s ease-in-out infinite; }
          .planner-companion--thinking .planner-companion-particle,
          .planner-companion--sorting .planner-companion-particle,
          .planner-companion--planning .planner-companion-particle { opacity:1; animation: pcOrbit 2.4s linear infinite; }
          .planner-companion--sorting .planner-companion-particle { animation-duration: 1.3s; }
          .planner-companion--sorting .planner-companion-arm,
          .planner-companion--planning .planner-companion-arm { opacity:1; animation: pcArmSwing 1s ease-in-out infinite; }
          .planner-companion--ready .planner-companion-body { animation: pcBounce 0.6s cubic-bezier(.3,1.5,.4,1) 1; }
          .planner-companion--celebrating .planner-companion-body { animation: pcBounce 0.7s cubic-bezier(.3,1.7,.4,1) 1; }
          .planner-companion--celebrating .planner-companion-particle { opacity:1; animation: pcBurst 0.7s ease-out 1; }
          .planner-companion--working .planner-companion-body { animation: pcBreatheSlow 6s ease-in-out infinite; }
        }
        @keyframes pcBreathe { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.035); } }
        @keyframes pcBreatheSlow { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.015); } }
        @keyframes pcLeanPulse { 0%,100%{ transform:rotate(0deg) scale(1); } 50%{ transform:rotate(4deg) scale(1.05); } }
        @keyframes pcSway { 0%,100%{ transform:rotate(-2deg); } 50%{ transform:rotate(2deg); } }
        @keyframes pcBounce { 0%{ transform:translateY(0) scale(1); } 35%{ transform:translateY(-10%) scale(1.06); } 60%{ transform:translateY(2%) scale(0.98); } 100%{ transform:translateY(0) scale(1); } }
        @keyframes pcOrbit { from{ transform:rotate(0deg) translateX(38px) rotate(0deg); } to{ transform:rotate(360deg) translateX(38px) rotate(-360deg); } }
        @keyframes pcBurst { 0%{ opacity:1; transform:translate(0,0) scale(0.4); } 100%{ opacity:0; transform:translate(var(--bx,14px),var(--by,-14px)) scale(1); } }
        @keyframes pcArmSwing { 0%,100%{ transform:rotate(-8deg); } 50%{ transform:rotate(10deg); } }
      `}</style>
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="pcGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <g className="planner-companion-body" style={{ transformOrigin: '50px 55px' }}>
          {/* squircle body — a rounded-square path reads more "geometric creature" than a plain circle */}
          <path d="M50 21 C68 21 79 32 79 50 C79 68 68 79 50 79 C32 79 21 68 21 50 C21 32 32 21 50 21 Z"
            fill="url(#pcGlow)" opacity={bodyGlow} />
          <path d="M50 21 C68 21 79 32 79 50 C79 68 68 79 50 79 C32 79 21 68 21 50 C21 32 32 21 50 21 Z"
            fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          {/* tiny tool arms — only visible while sorting/planning */}
          <line className="planner-companion-arm" x1="24" y1="56" x2="14" y2="62" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: '24px 56px' }} />
          <line className="planner-companion-arm" x1="76" y1="56" x2="86" y2="62" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: '76px 56px' }} />
          {/* eyes */}
          <ellipse cx="39" cy={48 + eyeY} rx="4.2" ry={5 * eyeScaleY} fill="#0a0a0f" />
          <ellipse cx="61" cy={48 + eyeY} rx="4.2" ry={5 * eyeScaleY} fill="#0a0a0f" />
          {s === 'concerned' && (
            <>
              <path d="M32 40 Q 39 35 46 39" stroke="#0a0a0f" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55" />
              <path d="M54 39 Q 61 35 68 40" stroke="#0a0a0f" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55" />
            </>
          )}
          {(s === 'ready' || s === 'celebrating') && (
            <path d="M40 64 Q 50 72 60 64" stroke="#0a0a0f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
        </g>
        {/* orbiting particles (thinking/sorting/planning) or bursting particles (celebrating) */}
        <circle className="planner-companion-particle" cx="50" cy="55" r="3" fill="#a5b4fc" style={{ transformOrigin: '50px 55px' }} />
        <circle className="planner-companion-particle" cx="50" cy="55" r="2.2" fill="#c4b5fd" style={{ transformOrigin: '50px 55px', animationDelay: '0.3s' }} />
        {s === 'celebrating' && (
          <>
            <circle className="planner-companion-particle" cx="50" cy="55" r="2.4" fill="#34d399" style={{ '--bx': '20px', '--by': '-18px' }} />
            <circle className="planner-companion-particle" cx="50" cy="55" r="2.4" fill="#f59e0b" style={{ '--bx': '-20px', '--by': '-16px', animationDelay: '0.08s' }} />
          </>
        )}
      </svg>
    </div>
  );
}
