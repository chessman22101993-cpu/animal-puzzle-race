import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AnimalAvatar } from '../assets/animals';
import { Trophy, Medal, RotateCcw, CheckCircle2, Clock, X } from 'lucide-react';
import { playPodiumFanfare } from '../assets/soundEffects';

export default function PodiumModal({
  standings = [],
  currentStudentId = null,
  isCoach = false,
  roundNumber = 1,
  onToggleReady,
  onStartNextRound,
  onClose
}) {
  const top3 = standings.slice(0, 3);
  const remaining = standings.slice(3);
  const currentStudent = standings.find(s => s.id === currentStudentId);

  useEffect(() => {
    playPodiumFanfare();
    try {
      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 350);
    } catch (e) {}
  }, []);

  function formatTime(ms) {
    if (!ms) return '0.0s';
    return (ms / 1000).toFixed(1) + 's';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-amber-500/30 p-5 sm:p-8 shadow-2xl text-white my-auto">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all duration-150 active:scale-95"
            title="Close podium"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Race Complete • Round {roundNumber}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
            Champions Podium
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tiebreakers resolved by fastest cumulative solve time
          </p>
        </div>

        {/* 3-Tier Olympic Podium */}
        <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 pt-4 px-2 min-h-[220px]">
          {/* 2nd Place (Silver) */}
          {top3[1] ? (
            <div className="flex flex-col items-center flex-1 max-w-[150px] animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="relative mb-2">
                <AnimalAvatar
                  animalId={top3[1].animal?.id}
                  size={52}
                  badgeLevel={top3[1].animal?.badgeLevel || 1}
                  ringColor={top3[1].animal?.ringColor}
                />
                <span className="absolute -top-2 -right-2 text-xl" title="Silver Medal">🥈</span>
              </div>
              <div className="text-center font-bold text-xs sm:text-sm truncate w-full px-1">
                {top3[1].name}
              </div>
              <div className="text-[11px] text-amber-300 font-mono font-bold">
                {top3[1].score} solves
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> {formatTime(top3[1].cumulativeSolveTimeMs)}
              </div>
              {/* Podium Column */}
              <div className="w-full h-24 sm:h-28 mt-2 rounded-t-xl bg-gradient-to-b from-slate-400/40 to-slate-700/50 border-t-2 border-slate-300 flex items-center justify-center font-black text-2xl text-slate-300 shadow-lg">
                2
              </div>
            </div>
          ) : (
            <div className="flex-1 max-w-[150px] h-24" />
          )}

          {/* 1st Place (Gold) */}
          {top3[0] ? (
            <div className="flex flex-col items-center flex-1 max-w-[160px] animate-slide-up" style={{ animationDelay: '0ms' }}>
              <div className="relative mb-2">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                  👑
                </div>
                <AnimalAvatar
                  animalId={top3[0].animal?.id}
                  size={64}
                  badgeLevel={top3[0].animal?.badgeLevel || 1}
                  ringColor="#F59E0B"
                  className="ring-4 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                />
                <span className="absolute -top-1 -right-2 text-2xl" title="Gold Champion">🥇</span>
              </div>
              <div className="text-center font-black text-sm sm:text-base text-amber-300 truncate w-full px-1">
                {top3[0].name}
              </div>
              <div className="text-xs text-amber-400 font-mono font-black">
                {top3[0].score} solves
              </div>
              <div className="text-[10px] text-slate-300 font-mono flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> {formatTime(top3[0].cumulativeSolveTimeMs)}
              </div>
              {/* Podium Column */}
              <div className="w-full h-32 sm:h-36 mt-2 rounded-t-xl bg-gradient-to-b from-amber-500/50 to-amber-800/60 border-t-4 border-amber-400 flex items-center justify-center font-black text-3xl text-amber-300 shadow-xl">
                1
              </div>
            </div>
          ) : (
            <div className="flex-1 max-w-[160px] h-32" />
          )}

          {/* 3rd Place (Bronze) */}
          {top3[2] ? (
            <div className="flex flex-col items-center flex-1 max-w-[150px] animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="relative mb-2">
                <AnimalAvatar
                  animalId={top3[2].animal?.id}
                  size={48}
                  badgeLevel={top3[2].animal?.badgeLevel || 1}
                  ringColor={top3[2].animal?.ringColor}
                />
                <span className="absolute -top-2 -right-2 text-xl" title="Bronze Medal">🥉</span>
              </div>
              <div className="text-center font-bold text-xs sm:text-sm truncate w-full px-1">
                {top3[2].name}
              </div>
              <div className="text-[11px] text-amber-300 font-mono font-bold">
                {top3[2].score} solves
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> {formatTime(top3[2].cumulativeSolveTimeMs)}
              </div>
              {/* Podium Column */}
              <div className="w-full h-20 sm:h-22 mt-2 rounded-t-xl bg-gradient-to-b from-amber-700/40 to-amber-950/60 border-t-2 border-amber-600 flex items-center justify-center font-black text-2xl text-amber-600 shadow-lg">
                3
              </div>
            </div>
          ) : (
            <div className="flex-1 max-w-[150px] h-20" />
          )}
        </div>

        {/* Full Standings List (4th onwards) */}
        {remaining.length > 0 && (
          <div className="mb-6 bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50 max-h-40 overflow-y-auto custom-scrollbar">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Full Standings
            </h4>
            <div className="flex flex-col gap-1.5 text-xs">
              {remaining.map(s => (
                <div key={s.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-5">#{s.rank}</span>
                    <AnimalAvatar animalId={s.animal?.id} size={24} badgeLevel={s.animal?.badgeLevel || 1} />
                    <span className="font-semibold text-slate-200">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="font-bold text-amber-400">{s.score} solves</span>
                    <span className="text-[10px] text-slate-400">{formatTime(s.cumulativeSolveTimeMs)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls for Next Round */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          {/* Student "Rejoin / Ready" Button */}
          {!isCoach && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (onToggleReady && !currentStudent?.isReady) {
                    onToggleReady();
                  }
                  if (onClose) {
                    onClose();
                  }
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-200 shadow-lg active:scale-95 ${
                  currentStudent?.isReady
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-300'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                {currentStudent?.isReady ? 'Return to Lobby (Ready)' : 'Rejoin Next Race (Lobby)'}
              </button>

              <span className="text-xs text-slate-300 font-medium">
                <strong className="text-emerald-400">{standings.filter(s => s.isReady).length}</strong> / {standings.length} Ready
              </span>
            </div>
          )}

          {/* Coach "Start New Round" Button */}
          {isCoach && (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-400">
                <strong className="text-amber-400 font-bold">{standings.filter(s => s.isReady).length}</strong> of {standings.length} racers ready
              </div>

              <button
                onClick={onStartNextRound}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl transition-transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Start Round {roundNumber + 1}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
