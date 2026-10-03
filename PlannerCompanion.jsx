// PlannerCompanion.jsx
// The character: a small soft orb with two expressive eyes and a subtle Magverse-accent glow.
// One visual metaphor for the whole feature (a journey/path — see PlannerTimeline.jsx) and one
// simple state model (COMPANION_STATES from plannerTypes.js) drives everything here — no
// tangled animation booleans. Pure CSS + inline SVG, no animation library. Every animation is
// wrapped in `@media (prefers-reduced-motion: no-preference)` so motion is opt-out by the OS,
// not opt-in by this component, and the character's meaning is always also stated in text
// (via aria-label + the caller's own companionMessage) — never conveyed only visually.

const COMPANION_STATE_LABELS = {
  idle: 'idle', listening: 'listening', thinking: 'thinking', organizing: 'organizing plans',
  concerned: 'a little concerned about the workload', ready: 'ready with a plan',
  working: 'calm, focused on your current session', celebrating: 'celebrating a finished task',
};

function PlannerCompanion({ state = 'idle', size = 96 }){
  const s = COMPANION_STATES.includes(state) ? state : 'idle';
  const eyeY = s === 'concerned' ? 2 : 0;
  const eyeScaleY = s === 'concerned' ? 0.55 : (s === 'celebrating' ? 1.15 : 1);
  const bodyGlow = s === 'working' ? 0.35 : (s === 'concerned' ? 0.55 : 0.85);

  return (
    <div
      aria-label={'Navigator companion: ' + (COMPANION_STATE_LABELS[s] || s)}
      role="img"
      className={'planner-companion planner-companion--' + s}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <style>{`
        .planner-companion { display:flex; align-items:center; justify-content:center; }
        .planner-companion svg { width:100%; height:100%; display:block; }
        .planner-companion-particle { opacity:0; }
        @media (prefers-reduced-motion: no-preference){
          .planner-companion--idle .planner-companion-body { animation: pcBreathe 4s ease-in-out infinite; }
          .planner-companion--listening .planner-companion-body { animation: pcLeanPulse 1.4s ease-in-out infinite; }
          .planner-companion--thinking .planner-companion-body,
          .planner-companion--organizing .planner-companion-body { animation: pcSway 2.2s ease-in-out infinite; }
          .planner-companion--thinking .planner-companion-particle,
          .planner-companion--organizing .planner-companion-particle { opacity:1; animation: pcOrbit 2.4s linear infinite; }
          .planner-companion--organizing .planner-companion-particle { animation-duration: 1.5s; }
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
      `}</style>
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="pcGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <g className="planner-companion-body" style={{ transformOrigin: '50px 55px' }}>
          <circle cx="50" cy="55" r="34" fill="url(#pcGlow)" opacity={bodyGlow} />
          <circle cx="50" cy="55" r="34" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
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
        {/* orbiting / bursting particles */}
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
