import React from 'react';
import { AnimalAvatar, AnimalRunner, ANIMAL_DETAILS } from '../assets/animals';
import { Trophy, Flag, Flame } from 'lucide-react';

export default function RaceTrack({
  standings = [],
  currentStudentId = null,
  raceState = 'racing', // 'waiting' | 'countdown' | 'racing' | 'ended'
  className = ''
}) {
  // Determine highest score in room to dynamically scale race track progression
  const maxScore = Math.max(...standings.map(s => s.score || 0), 10);
  // Target points for 100% track length (at least 15 points or 1.25x the current leader)
  const targetPoints = Math.max(15, Math.ceil(maxScore * 1.25));

  return (
    <div className={`w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/60 p-3 sm:p-4 shadow-xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm sm:text-base text-slate-100 tracking-wide uppercase">
            Live Race Track
          </span>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
            {standings.length} {standings.length === 1 ? 'Racer' : 'Racers'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Flag className="w-3.5 h-3.5 text-emerald-400" />
          <span>Finish Target: <strong className="text-slate-200">{targetPoints} Solves</strong></span>
        </div>
      </div>

      {/* Race Lanes Container */}
      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1 select-none custom-scrollbar">
        {standings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            Waiting for racers to join the track...
          </div>
        ) : (
          standings.map((racer, index) => {
            const isMe = currentStudentId && racer.id === currentStudentId;
            const progressPercent = Math.min(94, Math.max(3, ((racer.score || 0) / targetPoints) * 92 + 3));
            const isLeader = index === 0 && (racer.score || 0) > 0;
            const animalDetail = ANIMAL_DETAILS[racer.animal?.id] || {};

            return (
              <div
                key={racer.id}
                className={`relative flex items-center h-12 sm:h-14 rounded-xl border transition-all duration-200 overflow-hidden ${
                  isMe
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                    : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
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
                <div className="absolute top-0 inset-x-0 h-[1px] bg-slate-700/40 pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-[1px] bg-slate-700/40 pointer-events-none" />

                {/* Left Rank Badge */}
                <div className="relative z-10 flex items-center justify-center w-8 sm:w-10 pl-2 text-xs font-black">
                  {index === 0 ? (
                    <span className="text-amber-400 flex items-center gap-0.5" title="1st Place">
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
                    <span className="text-slate-500">#{index + 1}</span>
                  )}
                </div>

                {/* Track Running Area */}
                <div className="relative flex-1 h-full mx-2">
                  {/* Moving Animal Avatar with Name & Score */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center transition-all duration-500 ease-out z-20"
                    style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="relative">
                        <AnimalRunner
                          animalId={racer.animal?.id}
                          size={38}
                          badgeLevel={racer.animal?.badgeLevel || 1}
                          isLeader={isLeader}
                          isRacing={raceState === 'racing'}
                          className="transition-transform"
                        />
                        {isMe && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                        )}
                      </div>

                      {/* Name pill */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs font-bold truncate max-w-[90px] sm:max-w-[130px] ${
                              isMe ? 'text-amber-300' : 'text-slate-200'
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
                        <span className="text-[10px] text-slate-400 font-medium">
                          {racer.animal?.name || 'Racer'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Finish Line Flag Column */}
                <div className="relative z-10 flex items-center justify-center w-14 sm:w-16 pr-3 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent h-full text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm sm:text-base font-black text-amber-400 font-mono leading-none">
                      {racer.score || 0}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                      pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
