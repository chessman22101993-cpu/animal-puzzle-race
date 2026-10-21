import React, { useRef, useEffect } from 'react';
import { AnimalAvatar, AnimalRunner, ANIMAL_DETAILS } from '../assets/animals';
import { Trophy, Flag, Flame, ArrowDownCircle } from 'lucide-react';

export default function RaceTrack({
  standings = [],
  currentStudentId = null,
  raceState = 'racing', // 'waiting' | 'countdown' | 'racing' | 'ended'
  className = ''
}) {
  const containerRef = useRef(null);

  // Determine highest score in room to dynamically scale race track progression
  const maxScore = Math.max(...standings.map(s => s.score || 0), 10);
  // Target points for 100% track length (at least 15 points or 1.25x the current leader)
  const targetPoints = Math.max(15, Math.ceil(maxScore * 1.25));

  // Find current user's racer
  const myRacerIndex = standings.findIndex(s => s.id === currentStudentId);

  return (
    <div className={`w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/60 p-3 sm:p-5 shadow-xl ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="font-black text-sm sm:text-base text-slate-100 tracking-wide uppercase">
            Live Race Tracks
          </span>
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold font-mono">
            {standings.length} {standings.length === 1 ? 'Racer' : 'Racers'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          {standings.length > 4 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 font-medium">
              <ArrowDownCircle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              Scroll down to view all tracks
            </span>
          )}
          <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target: <strong className="text-slate-200">{targetPoints} Solves</strong></span>
          </div>
        </div>
      </div>

      {/* Race Lanes Container - Generous scrollable vertical area where lanes NEVER shrink or merge! */}
      <div
        ref={containerRef}
        className="flex flex-col gap-2.5 max-h-[460px] sm:max-h-[560px] overflow-y-auto pr-1 select-none custom-scrollbar"
      >
        {standings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            Waiting for racers to join the track...
          </div>
        ) : (
          standings.map((racer, index) => {
            const isMe = currentStudentId && racer.id === currentStudentId;
            const progressPercent = Math.min(92, Math.max(4, ((racer.score || 0) / targetPoints) * 88 + 4));
            const isLeader = index === 0 && (racer.score || 0) > 0;
            const animalDetail = ANIMAL_DETAILS[racer.animal?.id] || {};

            return (
              <div
                key={racer.id}
                className={`relative flex items-center h-14 sm:h-16 shrink-0 rounded-2xl border transition-all duration-200 overflow-hidden shadow-md ${
                  isMe
                    ? 'bg-amber-950/40 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/50 z-10'
                    : 'bg-slate-900/90 border-slate-700/60 hover:border-slate-500'
                }`}
              >
                {/* Lane Track asphalt background & animated white road dashes */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    raceState === 'racing'
                      ? 'animate-track-road-scroll'
                      : 'track-road-static'
                  }`}
                />
                {/* Upper and lower lane edge guides */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-slate-700/50 pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-[1px] bg-slate-700/50 pointer-events-none" />

                {/* Left Rank Badge Column */}
                <div className="relative z-10 flex items-center justify-center w-9 sm:w-12 pl-2 sm:pl-3 text-xs sm:text-sm font-black">
                  {index === 0 ? (
                    <span className="text-amber-400 flex items-center gap-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="1st Place">
                      👑 1
                    </span>
                  ) : index === 1 ? (
                    <span className="text-slate-300 font-bold" title="2nd Place">
                      🥈 2
                    </span>
                  ) : index === 2 ? (
                    <span className="text-amber-600 font-bold" title="3rd Place">
                      🥉 3
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">#{index + 1}</span>
                  )}
                </div>

                {/* Track Running Area */}
                <div className="relative flex-1 h-full mx-2 sm:mx-3">
                  {/* Moving Animal Avatar with Name & Score */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center transition-[left] duration-700 ease-out z-20 will-change-[left]"
                    style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="relative">
                        <AnimalRunner
                          animalId={racer.animal?.id}
                          size={40}
                          badgeLevel={racer.animal?.badgeLevel || 1}
                          isLeader={isLeader}
                          isRacing={raceState === 'racing'}
                        />
                        {isMe && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping" />
                        )}
                      </div>

                      {/* Name pill */}
                      <div className="flex flex-col bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-slate-700/60 shadow-md">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs sm:text-sm font-black truncate max-w-[90px] sm:max-w-[150px] ${
                              isMe ? 'text-amber-300 font-black' : 'text-slate-100'
                            }`}
                          >
                            {racer.name} {isMe && '(You)'}
                          </span>
                          {racer.streak >= 3 && (
                            <span className="flex items-center text-[10px] text-orange-400 font-black animate-pulse" title={`${racer.streak} streak!`}>
                              <Flame className="w-3 h-3 fill-orange-500 text-orange-400" />
                              {racer.streak}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[90px] sm:max-w-[150px]">
                          {racer.animal?.name || 'Racer'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Finish Line Flag Column */}
                <div className="relative z-10 flex items-center justify-center w-16 sm:w-20 pr-3 sm:pr-4 bg-gradient-to-l from-slate-950 via-slate-950/90 to-transparent h-full text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-base sm:text-lg font-black text-amber-400 font-mono leading-none">
                      {racer.score || 0}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      solves
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint if many racers */}
      {standings.length > 4 && (
        <div className="mt-2 text-center sm:hidden text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ArrowDownCircle className="w-3 h-3 text-amber-400" />
          <span>Scroll down to see all {standings.length} racers</span>
        </div>
      )}
    </div>
  );
}
