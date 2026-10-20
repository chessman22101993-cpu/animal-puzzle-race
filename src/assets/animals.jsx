import React from 'react';

export const ANIMAL_DETAILS = {
  cheetah: {
    id: 'cheetah',
    name: 'Cheetah',
    title: 'Speed King',
    baseColor: '#F59E0B',
    accentColor: '#B45309',
    bgColor: '#FEF3C7',
    tagline: 'Fastest tactician on the plains'
  },
  tiger: {
    id: 'tiger',
    name: 'Tiger',
    title: 'Fierce Striker',
    baseColor: '#EA580C',
    accentColor: '#9A3412',
    bgColor: '#FFEDD5',
    tagline: 'Pounces with razor-sharp forks'
  },
  lion: {
    id: 'lion',
    name: 'Lion',
    title: 'Majestic Ruler',
    baseColor: '#EAB308',
    accentColor: '#A16207',
    bgColor: '#FEF08A',
    tagline: 'Commands the center with pride'
  },
  horse: {
    id: 'horse',
    name: 'Horse',
    title: 'Knight Galloper',
    baseColor: '#854D0E',
    accentColor: '#543007',
    bgColor: '#FDE68A',
    tagline: 'Hops effortlessly over all obstacles'
  },
  falcon: {
    id: 'falcon',
    name: 'Falcon',
    title: 'Sky Dive',
    baseColor: '#2563EB',
    accentColor: '#1E40AF',
    bgColor: '#DBEAFE',
    tagline: 'Swoops from the clouds on back ranks'
  },
  zebra: {
    id: 'zebra',
    name: 'Zebra',
    title: 'Turbo Stripes',
    baseColor: '#0891B2',
    accentColor: '#164E63',
    bgColor: '#CFFAFE',
    tagline: 'Master of diagonal zigzagging'
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    title: 'Pack Hunter',
    baseColor: '#64748B',
    accentColor: '#334155',
    bgColor: '#F1F5F9',
    tagline: 'Calculates every endgame move'
  },
  elephant: {
    id: 'elephant',
    name: 'Elephant',
    title: 'Unstoppable Heavy',
    baseColor: '#7C3AED',
    accentColor: '#5B21B6',
    bgColor: '#EDE9FE',
    tagline: 'Crushes open files like a pair of rooks'
  },
  bear: {
    id: 'bear',
    name: 'Bear',
    title: 'Mighty Crusher',
    baseColor: '#78350F',
    accentColor: '#451A03',
    bgColor: '#FED7AA',
    tagline: 'Powers through closed defenses'
  },
  ostrich: {
    id: 'ostrich',
    name: 'Ostrich',
    title: 'Endurance Sprinter',
    baseColor: '#DB2777',
    accentColor: '#9D174D',
    bgColor: '#FCE7F3',
    tagline: 'Outruns the clock in time scrambles'
  }
};

export const ANIMALS = Object.values(ANIMAL_DETAILS);

// Circular Avatar with transparent animal artwork
export function AnimalAvatar({
  animalId,
  size = 48,
  badgeLevel = 1,
  ringColor = null,
  className = ''
}) {
  const detail = ANIMAL_DETAILS[animalId] || ANIMAL_DETAILS.cheetah;
  const ring = ringColor || (badgeLevel > 1 ? '#8B5CF6' : detail.baseColor);
  const imageSrc = `/animals/${animalId}.png`;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${detail.bgColor} 0%, rgba(15,23,42,0.6) 100%)`,
        boxShadow: `0 0 0 ${Math.max(2, size / 16)}px ${ring}, 0 4px 12px rgba(0,0,0,0.3)`
      }}
      title={`${detail.name} (Badge Level ${badgeLevel})`}
    >
      <img
        src={imageSrc}
        alt={detail.name}
        className="w-[90%] h-[90%] object-contain drop-shadow pointer-events-none"
      />

      {/* Badge Pill if recycled animal or high level */}
      {badgeLevel > 1 && (
        <span
          className="absolute -top-1 -right-1 font-black text-white px-1.5 py-0.5 rounded-full shadow-md z-10"
          style={{
            fontSize: Math.max(9, size * 0.22),
            lineHeight: 1,
            backgroundColor: ring
          }}
        >
          #{badgeLevel}
        </span>
      )}
    </div>
  );
}

// Full-body transparent running sprite for the live racing track & podium
export function AnimalRunner({
  animalId,
  size = 54,
  badgeLevel = 1,
  isLeader = false,
  isRacing = false,
  className = ''
}) {
  const detail = ANIMAL_DETAILS[animalId] || ANIMAL_DETAILS.cheetah;
  const imageSrc = `/animals/${animalId}.png`;

  // Pick animation class based on state
  let animClass = '';
  let shadowClass = '';
  if (isRacing && isLeader) {
    animClass = 'animate-animal-sprint-leader';
    shadowClass = 'animate-running-shadow-leader';
  } else if (isRacing) {
    animClass = 'animate-animal-sprint';
    shadowClass = 'animate-running-shadow';
  } else if (isLeader) {
    animClass = 'animate-bounce-subtle';
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{
        width: size * 1.35,
        height: size
      }}
    >
      {/* Ground contact shadow under paws/feet */}
      <div
        className={`absolute bottom-0 left-1/2 w-10 h-2 rounded-full bg-black/50 filter blur-[1.5px] pointer-events-none transition-opacity ${
          shadowClass || 'opacity-35 -translate-x-1/2'
        }`}
      />

      {/* Trailing speed wind streaks when galloping at high speed */}
      {isRacing && (
        <div className="absolute right-[85%] top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-none z-0">
          <div className="w-7 h-[2px] rounded-full bg-gradient-to-l from-white/90 via-cyan-400/70 to-transparent animate-speed-streak-1" />
          <div className="w-9 h-[2px] rounded-full bg-gradient-to-l from-white/90 via-amber-400/70 to-transparent animate-speed-streak-2 ml-1" />
          <div className="w-6 h-[2px] rounded-full bg-gradient-to-l from-white/90 via-white/50 to-transparent animate-speed-streak-3" />
        </div>
      )}

      {/* The original animal artwork with natural forward sprint drive */}
      <img
        src={imageSrc}
        alt={detail.name}
        className={`w-full h-full object-contain pointer-events-none drop-shadow-md relative z-10 ${animClass}`}
      />

      {badgeLevel > 1 && (
        <span
          className="absolute -top-1 -right-1 font-black text-white px-1.5 py-0.5 rounded-full shadow-md text-[9px] z-20 bg-purple-600 border border-purple-400"
        >
          #{badgeLevel}
        </span>
      )}
    </div>
  );
}
