import React from 'react';

/**
 * High-performance 60 FPS Layered Vector Rigged Animal Runners
 * Features:
 * - Scissor-kicking front & hind legs (foreground & background 180° out of phase)
 * - Flapping aerodynamic bird wings (Falcon & Ostrich)
 * - Swishing tails with momentum & bobbing heads
 * - Crisp scalable vector graphics (zero blur at any resolution)
 * - Seamless idle / standing posture when not racing
 */

export default function RiggedAnimal({ animalId, isRacing = false, isLeader = false }) {
  switch (animalId) {
    case 'cheetah':
      return <CheetahRig isRacing={isRacing} isLeader={isLeader} />;
    case 'tiger':
      return <TigerRig isRacing={isRacing} isLeader={isLeader} />;
    case 'lion':
      return <LionRig isRacing={isRacing} isLeader={isLeader} />;
    case 'horse':
      return <HorseRig isRacing={isRacing} isLeader={isLeader} />;
    case 'falcon':
      return <FalconRig isRacing={isRacing} isLeader={isLeader} />;
    case 'zebra':
      return <ZebraRig isRacing={isRacing} isLeader={isLeader} />;
    case 'wolf':
      return <WolfRig isRacing={isRacing} isLeader={isLeader} />;
    case 'elephant':
      return <ElephantRig isRacing={isRacing} isLeader={isLeader} />;
    case 'bear':
      return <BearRig isRacing={isRacing} isLeader={isLeader} />;
    case 'ostrich':
      return <OstrichRig isRacing={isRacing} isLeader={isLeader} />;
    default:
      return <CheetahRig isRacing={isRacing} isLeader={isLeader} />;
  }
}

/* ==========================================================================
   1. CHEETAH — Speed King (Slender, aerodynamic, fast scissor legs)
   ========================================================================== */
function CheetahRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR HIND LEG (Background) */}
      <g style={{ transformOrigin: '40px 52px' }} className={isRacing ? 'rig-animate-hind-far' : ''}>
        <path d="M40 52 Q28 68 20 84 Q22 88 28 88 Q34 82 46 64 Z" fill="#D97706" />
      </g>

      {/* FAR FRONT LEG (Background) */}
      <g style={{ transformOrigin: '110px 50px' }} className={isRacing ? 'rig-animate-front-far' : ''}>
        <path d="M110 50 Q118 68 126 84 Q120 88 114 86 Q106 72 102 56 Z" fill="#D97706" />
      </g>

      {/* TAIL */}
      <g style={{ transformOrigin: '32px 42px' }} className={isRacing ? 'rig-animate-tail' : ''}>
        <path d="M32 42 Q15 35 10 20 Q8 14 14 12 Q20 12 24 22 Q28 32 36 38 Z" fill="#F59E0B" />
        <circle cx="11" cy="16" r="3.5" fill="#78350F" />
      </g>

      {/* TORSO & BODY */}
      <g style={{ transformOrigin: '75px 48px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        {/* Slender arched athletic torso */}
        <path d="M30 46 Q45 34 75 36 Q110 38 122 46 Q115 62 85 58 Q45 60 30 46 Z" fill="#F59E0B" />
        {/* White belly stripe */}
        <path d="M50 56 Q80 58 105 52 Q95 57 75 58 Q55 58 50 56 Z" fill="#FEF3C7" />
        {/* Spots */}
        <circle cx="55" cy="44" r="2" fill="#78350F" />
        <circle cx="70" cy="42" r="2.2" fill="#78350F" />
        <circle cx="85" cy="45" r="2" fill="#78350F" />
        <circle cx="98" cy="46" r="1.8" fill="#78350F" />
        <circle cx="62" cy="50" r="1.8" fill="#78350F" />
        <circle cx="78" cy="51" r="2.2" fill="#78350F" />

        {/* HEAD & NECK */}
        <g style={{ transformOrigin: '122px 40px' }} className={isRacing ? 'rig-animate-head' : ''}>
          {/* Aerodynamic neck & head */}
          <path d="M112 44 L125 32 Q136 28 144 32 Q148 38 142 44 L124 50 Z" fill="#F59E0B" />
          {/* Pinned back ears */}
          <polygon points="126,28 132,18 136,28" fill="#B45309" />
          {/* Tear line & sharp eye */}
          <circle cx="136" cy="34" r="2.5" fill="#1F2937" />
          <circle cx="137" cy="33.2" r="0.8" fill="#FFF" />
          <path d="M136 36 L140 42" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />
          {/* Nose */}
          <polygon points="144,35 147,38 143,39" fill="#1F2937" />
        </g>
      </g>

      {/* NEAR HIND LEG (Foreground) */}
      <g style={{ transformOrigin: '38px 48px' }} className={isRacing ? 'rig-animate-hind-near' : ''}>
        <path d="M38 48 Q22 62 14 82 Q18 86 24 85 Q34 72 46 56 Z" fill="#F59E0B" />
        <circle cx="28" cy="62" r="2" fill="#78350F" />
        {/* Black paw pads */}
        <ellipse cx="18" cy="84" rx="3.5" ry="2" fill="#1F2937" />
      </g>

      {/* NEAR FRONT LEG (Foreground) */}
      <g style={{ transformOrigin: '112px 46px' }} className={isRacing ? 'rig-animate-front-near' : ''}>
        <path d="M112 46 Q122 64 134 82 Q128 86 122 84 Q112 70 106 54 Z" fill="#F59E0B" />
        <circle cx="116" cy="62" r="1.8" fill="#78350F" />
        {/* Black paw pads */}
        <ellipse cx="130" cy="83" rx="3.5" ry="2" fill="#1F2937" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   2. TIGER — Fierce Striker (Muscular orange body, bold black stripes)
   ========================================================================== */
function TigerRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR HIND LEG */}
      <g style={{ transformOrigin: '42px 52px' }} className={isRacing ? 'rig-animate-hind-far' : ''}>
        <path d="M42 52 Q30 68 22 85 Q28 89 34 88 Q44 74 52 58 Z" fill="#C2410C" />
      </g>

      {/* FAR FRONT LEG */}
      <g style={{ transformOrigin: '108px 50px' }} className={isRacing ? 'rig-animate-front-far' : ''}>
        <path d="M108 50 Q116 68 126 85 Q120 89 114 87 Q104 72 100 56 Z" fill="#C2410C" />
      </g>

      {/* STRIPED TAIL */}
      <g style={{ transformOrigin: '32px 44px' }} className={isRacing ? 'rig-animate-tail' : ''}>
        <path d="M32 44 Q14 36 8 20 Q14 18 20 28 Q26 38 34 42 Z" fill="#EA580C" />
        <path d="M18 24 L22 28 M12 20 L16 23 M24 33 L28 37" stroke="#1F2937" strokeWidth="2.5" />
      </g>

      {/* TORSO & BODY */}
      <g style={{ transformOrigin: '75px 50px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        <path d="M30 48 Q45 36 80 38 Q112 40 124 48 Q118 64 85 62 Q45 62 30 48 Z" fill="#EA580C" />
        {/* Tiger Stripes */}
        <path d="M48 38 L54 48 M62 38 L67 49 M76 38 L80 50 M90 39 L93 49 M104 40 L107 48" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
        <path d="M52 58 Q80 62 108 56 Q98 62 78 62 Q58 62 52 58 Z" fill="#FFEDD5" />

        {/* HEAD */}
        <g style={{ transformOrigin: '124px 42px' }} className={isRacing ? 'rig-animate-head' : ''}>
          <path d="M114 46 L126 34 Q138 30 146 35 Q150 42 144 48 L126 52 Z" fill="#EA580C" />
          <polygon points="128,30 134,20 138,30" fill="#9A3412" />
          <path d="M136 32 L138 38 M142 34 L143 38" stroke="#1F2937" strokeWidth="2" />
          <circle cx="138" cy="37" r="2.5" fill="#1F2937" />
          <circle cx="139" cy="36" r="0.8" fill="#FFF" />
          <polygon points="146,39 149,42 145,43" fill="#1F2937" />
        </g>
      </g>

      {/* NEAR HIND LEG */}
      <g style={{ transformOrigin: '40px 50px' }} className={isRacing ? 'rig-animate-hind-near' : ''}>
        <path d="M40 50 Q24 64 16 83 Q22 87 28 86 Q38 72 50 56 Z" fill="#EA580C" />
        <path d="M28 64 L34 70 M36 56 L42 62" stroke="#1F2937" strokeWidth="2.5" />
        <ellipse cx="20" cy="85" rx="4" ry="2" fill="#1F2937" />
      </g>

      {/* NEAR FRONT LEG */}
      <g style={{ transformOrigin: '110px 48px' }} className={isRacing ? 'rig-animate-front-near' : ''}>
        <path d="M110 48 Q120 66 132 83 Q126 87 120 85 Q110 70 104 54 Z" fill="#EA580C" />
        <path d="M116 62 L120 68" stroke="#1F2937" strokeWidth="2.5" />
        <ellipse cx="128" cy="85" rx="4" ry="2" fill="#1F2937" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   3. LION — Majestic Ruler (Golden coat, magnificent dark mane, tufted tail)
   ========================================================================== */
function LionRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR HIND LEG */}
      <g style={{ transformOrigin: '42px 52px' }} className={isRacing ? 'rig-animate-hind-far' : ''}>
        <path d="M42 52 Q30 68 22 85 Q28 89 34 88 Q44 74 52 58 Z" fill="#CA8A04" />
      </g>
      {/* FAR FRONT LEG */}
      <g style={{ transformOrigin: '106px 50px' }} className={isRacing ? 'rig-animate-front-far' : ''}>
        <path d="M106 50 Q114 68 124 85 Q118 89 112 87 Q102 72 98 56 Z" fill="#CA8A04" />
      </g>

      {/* TUFTED TAIL */}
      <g style={{ transformOrigin: '32px 44px' }} className={isRacing ? 'rig-animate-tail' : ''}>
        <path d="M32 44 Q14 36 8 20 Q14 18 20 28 Q26 38 34 42 Z" fill="#EAB308" />
        <ellipse cx="9" cy="18" rx="5" ry="3.5" fill="#78350F" />
      </g>

      {/* TORSO */}
      <g style={{ transformOrigin: '75px 50px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        <path d="M30 48 Q45 36 80 38 Q110 40 120 48 Q114 64 85 62 Q45 62 30 48 Z" fill="#EAB308" />

        {/* HEAD & MAGNIFICENT MANE */}
        <g style={{ transformOrigin: '120px 42px' }} className={isRacing ? 'rig-animate-head' : ''}>
          {/* Big fluffy mane */}
          <circle cx="124" cy="38" r="18" fill="#92400E" />
          <circle cx="116" cy="46" r="12" fill="#92400E" />
          <circle cx="132" cy="48" r="10" fill="#92400E" />
          {/* Golden face */}
          <ellipse cx="134" cy="38" rx="10" ry="8" fill="#EAB308" />
          <circle cx="136" cy="36" r="2.5" fill="#1F2937" />
          <circle cx="137" cy="35" r="0.8" fill="#FFF" />
          <polygon points="142,38 145,41 141,42" fill="#78350F" />
        </g>
      </g>

      {/* NEAR HIND LEG */}
      <g style={{ transformOrigin: '40px 50px' }} className={isRacing ? 'rig-animate-hind-near' : ''}>
        <path d="M40 50 Q24 64 16 83 Q22 87 28 86 Q38 72 50 56 Z" fill="#EAB308" />
        <ellipse cx="20" cy="85" rx="4" ry="2" fill="#1F2937" />
      </g>
      {/* NEAR FRONT LEG */}
      <g style={{ transformOrigin: '108px 48px' }} className={isRacing ? 'rig-animate-front-near' : ''}>
        <path d="M108 48 Q118 66 130 83 Q124 87 118 85 Q108 70 102 54 Z" fill="#EAB308" />
        <ellipse cx="126" cy="85" rx="4" ry="2" fill="#1F2937" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   4. HORSE — Knight Galloper (Chestnut coat, flowing black mane, galloping hooves)
   ========================================================================== */
function HorseRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR HIND LEG */}
      <g style={{ transformOrigin: '44px 50px' }} className={isRacing ? 'rig-animate-hind-far' : ''}>
        <path d="M44 50 L30 68 L24 86 L30 88 L38 72 L52 56 Z" fill="#713F12" />
        <polygon points="22,84 30,86 28,90 20,88" fill="#1F2937" />
      </g>
      {/* FAR FRONT LEG */}
      <g style={{ transformOrigin: '104px 48px' }} className={isRacing ? 'rig-animate-front-far' : ''}>
        <path d="M104 48 L112 68 L122 86 L116 88 L106 72 L100 54 Z" fill="#713F12" />
        <polygon points="120,84 126,86 124,90 118,88" fill="#1F2937" />
      </g>

      {/* STREAMING TAIL */}
      <g style={{ transformOrigin: '32px 42px' }} className={isRacing ? 'rig-animate-tail' : ''}>
        <path d="M32 42 Q15 36 6 25 Q12 28 22 36 Q10 40 4 48 Q15 46 32 44 Z" fill="#1F2937" />
      </g>

      {/* TORSO */}
      <g style={{ transformOrigin: '75px 48px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        <path d="M32 46 Q46 36 82 38 Q108 40 118 48 Q112 62 82 60 Q46 60 32 46 Z" fill="#854D0E" />

        {/* HEAD & ARCHED NECK */}
        <g style={{ transformOrigin: '114px 42px' }} className={isRacing ? 'rig-animate-head' : ''}>
          <path d="M104 44 L122 24 L138 28 L142 38 L126 48 Z" fill="#854D0E" />
          {/* Flowing Mane */}
          <path d="M106 42 Q114 26 122 22 Q120 28 116 36 Z" fill="#1F2937" />
          <polygon points="124,22 128,14 132,22" fill="#854D0E" />
          {/* Eye & Snout */}
          <circle cx="132" cy="28" r="2.5" fill="#1F2937" />
          <circle cx="133" cy="27" r="0.8" fill="#FFF" />
          <ellipse cx="140" cy="35" rx="2" ry="1.5" fill="#1F2937" />
        </g>
      </g>

      {/* NEAR HIND LEG */}
      <g style={{ transformOrigin: '42px 48px' }} className={isRacing ? 'rig-animate-hind-near' : ''}>
        <path d="M42 48 L26 66 L18 84 L24 86 L34 70 L48 54 Z" fill="#854D0E" />
        <polygon points="16,82 24,84 22,88 14,86" fill="#1F2937" />
      </g>
      {/* NEAR FRONT LEG */}
      <g style={{ transformOrigin: '106px 46px' }} className={isRacing ? 'rig-animate-front-near' : ''}>
        <path d="M106 46 L116 66 L128 84 L122 86 L110 70 L102 52 Z" fill="#854D0E" />
        <polygon points="126,82 132,84 130,88 124,86" fill="#1F2937" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   5. FALCON — Sky Dive (Peregrine slate blue, flapping wings, sleek dive)
   ========================================================================== */
function FalconRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR WING (Background flapping) */}
      <g style={{ transformOrigin: '72px 42px' }} className={isRacing ? 'rig-animate-wing-far' : ''}>
        <path d="M72 42 L60 15 L80 18 L105 32 Z" fill="#1E40AF" />
        <polygon points="60,15 65,8 72,16" fill="#1E3A8A" />
      </g>

      {/* TAIL FEATHERS */}
      <g style={{ transformOrigin: '40px 48px' }} className={isRacing ? 'rig-animate-tail' : ''}>
        <polygon points="40,48 10,44 14,54 42,52" fill="#1E3A8A" />
      </g>

      {/* SLEEK BODY & HEAD */}
      <g style={{ transformOrigin: '80px 48px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        {/* Aerodynamic bird body */}
        <ellipse cx="80" cy="48" rx="42" ry="14" fill="#2563EB" />
        {/* White chest barred feathers */}
        <ellipse cx="90" cy="50" rx="24" ry="8" fill="#DBEAFE" />

        {/* Falcon Head */}
        <circle cx="120" cy="44" r="13" fill="#2563EB" />
        {/* Yellow eye ring & black pupil */}
        <circle cx="124" cy="42" r="4.5" fill="#FBBF24" />
        <circle cx="124" cy="42" r="2.5" fill="#1F2937" />
        <circle cx="125" cy="41" r="0.8" fill="#FFF" />
        {/* Sharp hooked beak */}
        <polygon points="131,40 144,45 131,48" fill="#F59E0B" />
        {/* Black tear stripe */}
        <path d="M124 46 L122 54" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />

        {/* Tucked Talons */}
        <ellipse cx="65" cy="62" rx="6" ry="3" fill="#F59E0B" />
      </g>

      {/* NEAR WING (Foreground flapping) */}
      <g style={{ transformOrigin: '75px 46px' }} className={isRacing ? 'rig-animate-wing-near' : ''}>
        <path d="M75 46 L50 20 L76 24 L108 42 Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
        <polygon points="50,20 54,10 62,22" fill="#2563EB" />
        <polygon points="62,22 68,12 76,24" fill="#2563EB" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   6. ZEBRA — Turbo Stripes (Bold black & neon cyan striped galloper)
   ========================================================================== */
function ZebraRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR HIND LEG */}
      <g style={{ transformOrigin: '44px 50px' }} className={isRacing ? 'rig-animate-hind-far' : ''}>
        <path d="M44 50 L30 68 L24 86 L30 88 L38 72 L52 56 Z" fill="#94A3B8" />
        <polygon points="22,84 30,86 28,90 20,88" fill="#0891B2" />
      </g>
      {/* FAR FRONT LEG */}
      <g style={{ transformOrigin: '104px 48px' }} className={isRacing ? 'rig-animate-front-far' : ''}>
        <path d="M104 48 L112 68 L122 86 L116 88 L106 72 L100 54 Z" fill="#94A3B8" />
        <polygon points="120,84 126,86 124,90 118,88" fill="#0891B2" />
      </g>

      {/* TAIL */}
      <g style={{ transformOrigin: '32px 42px' }} className={isRacing ? 'rig-animate-tail' : ''}>
        <path d="M32 42 Q15 36 6 25 Q12 28 22 36 Q10 40 4 48 Q15 46 32 44 Z" fill="#0891B2" />
      </g>

      {/* TORSO */}
      <g style={{ transformOrigin: '75px 48px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        <path d="M32 46 Q46 36 82 38 Q108 40 118 48 Q112 62 82 60 Q46 60 32 46 Z" fill="#F8FAFC" />
        {/* Bold zebra stripes */}
        <path d="M45 38 L50 60 M58 37 L62 61 M72 38 L75 60 M86 39 L88 59 M100 40 L102 58" stroke="#0F172A" strokeWidth="3.5" />
        <path d="M52 38 L55 52 M66 38 L68 50 M80 38 L82 50" stroke="#0891B2" strokeWidth="2" />

        {/* HEAD */}
        <g style={{ transformOrigin: '114px 42px' }} className={isRacing ? 'rig-animate-head' : ''}>
          <path d="M104 44 L122 24 L138 28 L142 38 L126 48 Z" fill="#F8FAFC" />
          <path d="M112 36 L120 28 M124 38 L130 30" stroke="#0F172A" strokeWidth="3" />
          {/* Mohawk mane */}
          <path d="M106 40 L122 20" stroke="#0891B2" strokeWidth="4" strokeLinecap="round" />
          <polygon points="124,22 128,14 132,22" fill="#0F172A" />
          <circle cx="132" cy="28" r="2.5" fill="#0F172A" />
          <circle cx="133" cy="27" r="0.8" fill="#FFF" />
          <ellipse cx="140" cy="35" rx="2" ry="1.5" fill="#0891B2" />
        </g>
      </g>

      {/* NEAR HIND LEG */}
      <g style={{ transformOrigin: '42px 48px' }} className={isRacing ? 'rig-animate-hind-near' : ''}>
        <path d="M42 48 L26 66 L18 84 L24 86 L34 70 L48 54 Z" fill="#F8FAFC" />
        <path d="M30 60 L36 66 M24 74 L28 80" stroke="#0F172A" strokeWidth="2.5" />
        <polygon points="16,82 24,84 22,88 14,86" fill="#0891B2" />
      </g>
      {/* NEAR FRONT LEG */}
      <g style={{ transformOrigin: '106px 46px' }} className={isRacing ? 'rig-animate-front-near' : ''}>
        <path d="M106 46 L116 66 L128 84 L122 86 L110 70 L102 52 Z" fill="#F8FAFC" />
        <path d="M112 58 L116 64 M120 72 L124 78" stroke="#0F172A" strokeWidth="2.5" />
        <polygon points="126,82 132,84 130,88 124,86" fill="#0891B2" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   7. WOLF — Pack Hunter (Twilight silver coat, bushy tail, pointed ears)
   ========================================================================== */
function WolfRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR HIND LEG */}
      <g style={{ transformOrigin: '42px 52px' }} className={isRacing ? 'rig-animate-hind-far' : ''}>
        <path d="M42 52 Q30 68 22 85 Q28 89 34 88 Q44 74 52 58 Z" fill="#475569" />
      </g>
      {/* FAR FRONT LEG */}
      <g style={{ transformOrigin: '108px 50px' }} className={isRacing ? 'rig-animate-front-far' : ''}>
        <path d="M108 50 Q116 68 126 85 Q120 89 114 87 Q104 72 100 56 Z" fill="#475569" />
      </g>

      {/* BUSHY TAIL */}
      <g style={{ transformOrigin: '34px 44px' }} className={isRacing ? 'rig-animate-tail' : ''}>
        <path d="M34 44 Q15 36 6 22 Q12 18 24 28 Q30 38 36 42 Z" fill="#64748B" />
        <polygon points="6,22 14,18 10,28" fill="#334155" />
      </g>

      {/* TORSO */}
      <g style={{ transformOrigin: '75px 50px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        <path d="M30 48 Q45 36 80 38 Q112 40 124 48 Q118 64 85 62 Q45 62 30 48 Z" fill="#64748B" />
        {/* Dark mantle back */}
        <path d="M40 38 Q75 36 110 42 Q90 46 60 46 Z" fill="#334155" />
        {/* Light chest */}
        <path d="M95 46 Q115 50 118 58 Q100 62 85 58 Z" fill="#F1F5F9" />

        {/* HEAD */}
        <g style={{ transformOrigin: '124px 42px' }} className={isRacing ? 'rig-animate-head' : ''}>
          <path d="M114 46 L126 34 Q138 30 148 36 Q150 42 144 48 L126 52 Z" fill="#64748B" />
          {/* Pointed ears */}
          <polygon points="126,30 132,16 138,28" fill="#334155" />
          <polygon points="132,30 136,18 140,28" fill="#475569" />
          <circle cx="138" cy="36" r="2.5" fill="#F59E0B" />
          <circle cx="138" cy="36" r="1.5" fill="#1F2937" />
          <circle cx="139" cy="35" r="0.6" fill="#FFF" />
          <polygon points="146,38 150,40 146,42" fill="#1F2937" />
        </g>
      </g>

      {/* NEAR HIND LEG */}
      <g style={{ transformOrigin: '40px 50px' }} className={isRacing ? 'rig-animate-hind-near' : ''}>
        <path d="M40 50 Q24 64 16 83 Q22 87 28 86 Q38 72 50 56 Z" fill="#64748B" />
        <ellipse cx="20" cy="85" rx="4" ry="2" fill="#1F2937" />
      </g>
      {/* NEAR FRONT LEG */}
      <g style={{ transformOrigin: '110px 48px' }} className={isRacing ? 'rig-animate-front-near' : ''}>
        <path d="M110 48 Q120 66 132 83 Q126 87 120 85 Q110 70 104 54 Z" fill="#64748B" />
        <ellipse cx="128" cy="85" rx="4" ry="2" fill="#1F2937" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   8. ELEPHANT — Unstoppable Heavy (Curved raised trunk, floppy ear, pillars)
   ========================================================================== */
function ElephantRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR HIND LEG */}
      <g style={{ transformOrigin: '48px 54px' }} className={isRacing ? 'rig-animate-hind-far' : ''}>
        <path d="M48 54 L36 84 L46 86 L56 60 Z" fill="#5B21B6" />
      </g>
      {/* FAR FRONT LEG */}
      <g style={{ transformOrigin: '100px 54px' }} className={isRacing ? 'rig-animate-front-far' : ''}>
        <path d="M100 54 L110 84 L102 86 L92 60 Z" fill="#5B21B6" />
      </g>

      {/* LITTLE TAIL */}
      <g style={{ transformOrigin: '32px 46px' }} className={isRacing ? 'rig-animate-tail' : ''}>
        <path d="M32 46 Q18 42 16 52 Q20 54 26 48 Z" fill="#7C3AED" />
      </g>

      {/* TORSO & BODY */}
      <g style={{ transformOrigin: '75px 50px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        {/* Sturdy rounded body */}
        <ellipse cx="74" cy="50" rx="42" ry="24" fill="#7C3AED" />
        <ellipse cx="78" cy="54" rx="28" ry="14" fill="#8B5CF6" />

        {/* HEAD & RAISED TRUNK */}
        <g style={{ transformOrigin: '116px 44px' }} className={isRacing ? 'rig-animate-head' : ''}>
          <circle cx="116" cy="44" r="18" fill="#7C3AED" />
          {/* Joyful raised trunk */}
          <path d="M126 46 Q142 48 146 36 Q150 24 140 22 Q132 20 132 28 Q132 34 124 38" fill="none" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" />
          {/* Ivory tusk */}
          <path d="M122 50 Q134 52 136 44" fill="none" stroke="#FFFBEB" strokeWidth="3" strokeLinecap="round" />
          {/* Big floppy ear */}
          <ellipse cx="106" cy="42" rx="12" ry="16" fill="#6D28D9" />
          <ellipse cx="106" cy="42" rx="8" ry="12" fill="#FBCFE8" />
          {/* Cheerful eye */}
          <circle cx="122" cy="38" r="2.5" fill="#1F2937" />
          <circle cx="123" cy="37" r="0.8" fill="#FFF" />
        </g>
      </g>

      {/* NEAR HIND LEG */}
      <g style={{ transformOrigin: '44px 52px' }} className={isRacing ? 'rig-animate-hind-near' : ''}>
        <path d="M44 52 L32 84 L44 86 L54 58 Z" fill="#7C3AED" />
        <circle cx="36" cy="84" r="2" fill="#EDE9FE" />
        <circle cx="41" cy="84" r="2" fill="#EDE9FE" />
      </g>
      {/* NEAR FRONT LEG */}
      <g style={{ transformOrigin: '104px 52px' }} className={isRacing ? 'rig-animate-front-near' : ''}>
        <path d="M104 52 L116 84 L106 86 L96 58 Z" fill="#7C3AED" />
        <circle cx="112" cy="84" r="2" fill="#EDE9FE" />
        <circle cx="107" cy="84" r="2" fill="#EDE9FE" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   9. BEAR — Mighty Crusher (Warm grizzly brown, heavy muscular paws)
   ========================================================================== */
function BearRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR HIND LEG */}
      <g style={{ transformOrigin: '44px 54px' }} className={isRacing ? 'rig-animate-hind-far' : ''}>
        <path d="M44 54 Q32 70 24 85 Q32 89 38 88 Q48 72 56 58 Z" fill="#451A03" />
      </g>
      {/* FAR FRONT LEG */}
      <g style={{ transformOrigin: '106px 52px' }} className={isRacing ? 'rig-animate-front-far' : ''}>
        <path d="M106 52 Q114 70 124 85 Q118 89 110 87 Q100 70 96 56 Z" fill="#451A03" />
      </g>

      {/* LITTLE BEAR TAIL */}
      <circle cx="30" cy="46" r="4" fill="#78350F" />

      {/* HEAVY MUSCULAR TORSO */}
      <g style={{ transformOrigin: '75px 50px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        {/* Massive grizzly body */}
        <ellipse cx="75" cy="50" rx="44" ry="22" fill="#78350F" />
        {/* Shoulder hump */}
        <circle cx="95" cy="40" r="16" fill="#78350F" />

        {/* HEAD */}
        <g style={{ transformOrigin: '120px 44px' }} className={isRacing ? 'rig-animate-head' : ''}>
          <circle cx="120" cy="44" r="15" fill="#78350F" />
          <ellipse cx="130" cy="47" rx="8" ry="6" fill="#FED7AA" />
          <polygon points="135,46 138,48 135,50" fill="#1F2937" />
          <circle cx="116" cy="34" r="4.5" fill="#451A03" />
          <circle cx="126" cy="40" r="2.5" fill="#1F2937" />
          <circle cx="127" cy="39" r="0.8" fill="#FFF" />
        </g>
      </g>

      {/* NEAR HIND LEG */}
      <g style={{ transformOrigin: '40px 52px' }} className={isRacing ? 'rig-animate-hind-near' : ''}>
        <path d="M40 52 Q26 66 18 84 Q26 88 32 86 Q42 70 52 56 Z" fill="#78350F" />
        <ellipse cx="22" cy="85" rx="5" ry="2.5" fill="#1F2937" />
      </g>
      {/* NEAR FRONT LEG */}
      <g style={{ transformOrigin: '108px 50px' }} className={isRacing ? 'rig-animate-front-near' : ''}>
        <path d="M108 50 Q118 68 130 84 Q124 88 116 86 Q106 68 100 54 Z" fill="#78350F" />
        <ellipse cx="124" cy="85" rx="5" ry="2.5" fill="#1F2937" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   10. OSTRICH — Endurance Sprinter (Long S-neck, pumping piston legs)
   ========================================================================== */
function OstrichRig({ isRacing }) {
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible">
      {/* FAR PUMPING LEG (Background) */}
      <g style={{ transformOrigin: '68px 55px' }} className={isRacing ? 'rig-animate-ostrich-2' : ''}>
        <path d="M68 55 L58 72 L42 88 L34 92" fill="none" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="32,90 40,92 34,94" fill="#1F2937" />
      </g>

      {/* FEATHERED BODY & WINGS */}
      <g style={{ transformOrigin: '70px 50px' }} className={isRacing ? 'rig-animate-torso' : ''}>
        {/* Fluffy body */}
        <ellipse cx="70" cy="52" rx="24" ry="16" fill="#1F2937" />
        {/* White wing plume */}
        <path d="M55 48 Q70 40 86 48 Q88 56 72 58 Q58 58 55 48 Z" fill="#F8FAFC" />
        {/* Fluffy tail plumes */}
        <path d="M48 48 Q35 44 32 52 Q42 58 48 54" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />

        {/* LONG S-CURVE NECK & HEAD */}
        <g style={{ transformOrigin: '86px 50px' }} className={isRacing ? 'rig-animate-head' : ''}>
          <path d="M84 48 Q98 42 100 24 Q102 12 114 10" fill="none" stroke="#F472B6" strokeWidth="6" strokeLinecap="round" />
          {/* Head & Beak */}
          <ellipse cx="118" cy="10" rx="8" ry="6" fill="#FBCFE8" />
          <polygon points="124,8 136,11 124,14" fill="#FBBF24" />
          {/* Fluttery Eye */}
          <circle cx="117" cy="9" r="2.5" fill="#1F2937" />
          <circle cx="118" cy="8.2" r="0.8" fill="#FFF" />
          <path d="M115 6 L113 4 M118 5 L118 3" stroke="#1F2937" strokeWidth="1" strokeLinecap="round" />
        </g>
      </g>

      {/* NEAR PUMPING LEG (Foreground) */}
      <g style={{ transformOrigin: '74px 55px' }} className={isRacing ? 'rig-animate-ostrich-1' : ''}>
        <path d="M74 55 L84 72 L102 88 L110 92" fill="none" stroke="#F97316" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="108,90 116,92 110,94" fill="#1F2937" />
      </g>
    </svg>
  );
}
