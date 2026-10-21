import React, { useState, useEffect } from 'react';
import RaceTrack from './RaceTrack';
import PodiumModal from './PodiumModal';
import { AnimalAvatar, ANIMAL_DETAILS } from '../assets/animals';
import {
  Trophy,
  Copy,
  Check,
  Play,
  PlusCircle,
  StopCircle,
  Edit2,
  Trash2,
  Users,
  Timer,
  Sliders,
  Sparkles,
  RotateCcw,
  Clock,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  playCountdownTick,
  playGoSound,
  updateTensionMusic,
  stopTensionMusic,
  toggleMute,
  getMuted
} from '../assets/soundEffects';

export default function CoachRoom({
  socket,
  room,
  coachToken,
  standings = [],
  countdownRemaining = null,
  onStartCountdown,
  onAddTime,
  onEndRace,
  onRenameStudent,
  onRemoveStudent,
  onUpdateSettings,
  onStartNextRound
}) {
  const [copied, setCopied] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPodium, setShowPodium] = useState(room.state === 'ended');
  const [isMuted, setIsMuted] = useState(getMuted());

  // Shareable link: current host + /?room=ROOM_ID
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${room.id}`
    : `http://localhost:5173/?room=${room.id}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSoundToggle() {
    const muted = toggleMute();
    setIsMuted(muted);
  }

  // Timer countdown & dynamic tension music
  useEffect(() => {
    if (room.state !== 'racing' || !room.endTime) {
      setTimeLeft(0);
      stopTensionMusic();
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((room.endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      updateTensionMusic(remaining, true);
      if (remaining <= 0) {
        clearInterval(interval);
        stopTensionMusic();
      }
    }, 250);

    return () => {
      clearInterval(interval);
      stopTensionMusic();
    };
  }, [room.state, room.endTime]);

  // Synchronized countdown sound
  useEffect(() => {
    if (countdownRemaining !== null && countdownRemaining > 0) {
      playCountdownTick();
    } else if (countdownRemaining === 0) {
      playGoSound();
    }
  }, [countdownRemaining]);

  // Sync podium modal
  useEffect(() => {
    if (room.state === 'ended') {
      setShowPodium(true);
    } else if (room.state === 'racing') {
      setShowPodium(false);
    }
  }, [room.state]);

  function startRename(student) {
    setEditingStudentId(student.id);
    setEditNameValue(student.name);
  }

  function saveRename(studentId) {
    if (editNameValue.trim()) {
      onRenameStudent(studentId, editNameValue.trim());
    }
    setEditingStudentId(null);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function formatMs(ms) {
    if (!ms) return '0.0s';
    return (ms / 1000).toFixed(1) + 's';
  }

  const isCountdown = room?.state === 'countdown' || (countdownRemaining !== null && countdownRemaining > 0);
  const displayCount = countdownRemaining ?? room?.countdownRemaining ?? 10;

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white select-none">
      {/* Dynamic Final 30-Second Sprint Golden Pulsing Border & Banner */}
      {room.state === 'racing' && timeLeft <= 30 && timeLeft > 0 && (
        <div
          className={`pointer-events-none fixed inset-0 z-40 transition-all duration-300 ${
            timeLeft <= 10 ? 'golden-border-overlay-rapid' : 'golden-border-overlay-slow'
          }`}
        >
          {/* Top Sprint Adrenaline Banner */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-2xl shadow-amber-500/60 uppercase tracking-wider animate-bounce-subtle border-2 border-white/80">
            <Flame className="w-4 h-4 fill-orange-600 text-orange-600 animate-pulse" />
            <span>{timeLeft <= 10 ? `🔥 FINAL ${timeLeft}s ALL-OUT SPRINT! 🔥` : `⚡ FINAL ${timeLeft}s SPRINT! ⚡`}</span>
            <Sparkles className="w-4 h-4 text-amber-950" />
          </div>
        </div>
      )}

      {/* 10-Second Countdown Overlay */}
      {isCountdown && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
          <div className="text-center flex flex-col items-center p-6 max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
              🏁 Round {room?.roundNumber || 1} Starting
            </div>
            <div className="text-9xl font-black font-mono text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.85)] animate-pulse my-2">
              {displayCount}
            </div>
            <p className="text-slate-200 font-bold text-base mt-2">
              Synchronizing all student puzzle boards... 🚀
            </p>
          </div>
        </div>
      )}

      {/* Coach Header Bar */}
      <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-lg">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg text-slate-100">
                Coach Room Dashboard
              </h1>
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                Round {room.roundNumber || 1}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live race control & student management
            </p>
          </div>
        </div>

        {/* Right Header: Sound Toggle & Shareable Link Box */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSoundToggle}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title={isMuted ? 'Unmute Race Audio' : 'Mute Race Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Shareable Link Box */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Room Code:</span>
            <span className="font-mono font-black text-amber-400 text-sm tracking-widest">{room.id}</span>
            <button
              onClick={handleCopyLink}
              className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition-colors border border-amber-500/30"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied Link!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Share Link
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-6">
        {/* Top Control Grid: Settings + Live Timer / Actions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Race Settings Panel */}
          <div className="md:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Race Configuration
                </span>
                {room.state !== 'waiting' && (
                  <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Active in Race
                  </span>
                )}
              </div>

              {/* Race Length Selection (2, 5, 10, 15 mins) */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Race Length:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 5, 10, 15].map((len) => (
                    <button
                      key={len}
                      disabled={room.state !== 'waiting'}
                      onClick={() => onUpdateSettings({ raceLength: len })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 border ${
                        room.raceLength === len
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 disabled:opacity-60'
                      }`}
                    >
                      {len} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Puzzle Difficulty Level:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'beginner', label: 'Beginner', desc: '<1200' },
                    { id: 'intermediate', label: 'Intermediate', desc: '1200-1600' },
                    { id: 'advanced', label: 'Advanced', desc: '1600+' },
                    { id: 'mixed', label: 'Mixed', desc: 'Balanced' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      disabled={room.state !== 'waiting'}
                      onClick={() => onUpdateSettings({ difficulty: d.id })}
                      className={`py-2 px-2.5 rounded-xl text-left transition-all duration-150 border flex flex-col ${
                        room.difficulty === d.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 disabled:opacity-60'
                      }`}
                    >
                      <span className="font-bold text-xs sm:text-sm">{d.label}</span>
                      <span className={`text-[10px] ${room.difficulty === d.id ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                        {d.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coach Race Action Controls & Clock */}
          <div className="md:col-span-5 bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                Race Control
              </span>

              {/* Clock display */}
              <div className="flex items-baseline justify-between mb-4">
                <div className={`text-4xl sm:text-5xl font-black font-mono transition-all ${
                  timeLeft <= 30 && room.state === 'racing'
                    ? timeLeft <= 10
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.9)] animate-pulse'
                      : 'text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
                    : 'text-amber-400'
                }`}>
                  {room.state === 'racing' ? formatTime(timeLeft) : `${room.raceLength}:00`}
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-slate-400 block">
                    Status
                  </span>
                  <span className="text-xs font-black text-amber-300 uppercase">
                    {timeLeft <= 30 && room.state === 'racing' ? '🔥 FINAL SPRINT' : room.state}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {room.state === 'waiting' && (
                <button
                  onClick={onStartCountdown}
                  disabled={standings.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Start Race (10s Countdown)
                </button>
              )}

              {room.state === 'racing' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onAddTime(1)}
                      className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                      +1 Min
                    </button>
                    <button
                      onClick={() => onAddTime(2)}
                      className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                      +2 Min
                    </button>
                    <button
                      onClick={() => onAddTime(5)}
                      className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                      +5 Min
                    </button>
                  </div>

                  <button
                    onClick={onEndRace}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors active:scale-98"
                  >
                    <StopCircle className="w-4 h-4" />
                    End Race Early
                  </button>
                </div>
              )}

              {room.state === 'ended' && (
                <button
                  onClick={onStartNextRound}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl active:scale-98 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Round {room.roundNumber + 1}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Race Track Visualizer */}
        <RaceTrack
          standings={standings}
          raceState={room.state}
        />

        {/* Students Table & Management Panel */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm sm:text-base text-slate-100 uppercase tracking-wide">
                Joined Students ({standings.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Students keep their names & room membership between rounds
            </span>
          </div>

          {standings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              <p className="text-sm">No students have joined yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Share the room code <strong className="text-amber-400">{room.id}</strong> with your students to race!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold">
                    <th className="pb-3 pl-2">Rank</th>
                    <th className="pb-3">Animal</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3 text-center">Solves</th>
                    <th className="pb-3 text-center">Solve Time</th>
                    <th className="pb-3 text-center">Readiness</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {standings.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold text-slate-400">
                        {idx === 0 && student.score > 0 ? (
                          <span className="text-amber-400 font-black">👑 #1</span>
                        ) : (
                          `#${idx + 1}`
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <AnimalAvatar
                            animalId={student.animal?.id}
                            size={32}
                            badgeLevel={student.animal?.badgeLevel || 1}
                            ringColor={student.animal?.ringColor}
                          />
                          <span className="text-xs text-slate-300 font-semibold">
                            {student.animal?.name} #{student.animal?.badgeLevel || 1}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        {editingStudentId === student.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() => saveRename(student.id)}
                              className="px-2 py-1 bg-emerald-600 rounded text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingStudentId(null)}
                              className="px-2 py-1 bg-slate-700 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-100">{student.name}</span>
                        )}
                      </td>
                      <td className="py-3 text-center font-mono font-black text-amber-400 text-sm">
                        {student.score}
                      </td>
                      <td className="py-3 text-center font-mono text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatMs(student.cumulativeSolveTimeMs)}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {student.isReady ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            Ready
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">
                            Waiting
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startRename(student)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Rename Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemoveStudent(student.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300"
                            title="Remove Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Celebratory Podium Modal for coach */}
      {showPodium && (
        <PodiumModal
          standings={standings}
          isCoach={true}
          roundNumber={room.roundNumber || 1}
          onStartNextRound={onStartNextRound}
          onClose={() => setShowPodium(false)}
        />
      )}
    </div>
  );
}
