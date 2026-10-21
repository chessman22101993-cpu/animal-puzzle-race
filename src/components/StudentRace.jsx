import React, { useState, useEffect } from 'react';
import ChessBoard from './ChessBoard';
import RaceTrack from './RaceTrack';
import PodiumModal from './PodiumModal';
import { AnimalAvatar, ANIMAL_DETAILS } from '../assets/animals';
import {
  Timer,
  Trophy,
  FastForward,
  Flame,
  Volume2,
  VolumeX,
  Target,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  playCorrectSound,
  playWrongSound,
  playCountdownTick,
  playGoSound,
  toggleMute,
  getMuted,
  updateTensionMusic,
  stopTensionMusic
} from '../assets/soundEffects';

export default function StudentRace({
  socket,
  room,
  student,
  currentPuzzle,
  standings = [],
  countdownRemaining = null,
  onSkipPuzzle,
  onToggleReady
}) {
  const [activePuzzle, setActivePuzzle] = useState(currentPuzzle);
  const [boardFen, setBoardFen] = useState(currentPuzzle?.fen || '8/8/8/8/8/8/8/8');
  const [playerColor, setPlayerColor] = useState(currentPuzzle?.playerColor || 'w');
  const [lastMoveUci, setLastMoveUci] = useState(currentPuzzle?.setupMove || null);
  const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'wrong' | null
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMuted, setIsMuted] = useState(getMuted());
  const [comboStreak, setComboStreak] = useState(student?.streak || 0);
  const [showPodium, setShowPodium] = useState(room.state === 'ended');

  // Sync active puzzle when prop updates
  useEffect(() => {
    if (currentPuzzle) {
      setActivePuzzle(currentPuzzle);
      setBoardFen(currentPuzzle.fen);
      setPlayerColor(currentPuzzle.playerColor);
      setLastMoveUci(currentPuzzle.setupMove || null);
      setFeedbackState(null);
    }
  }, [currentPuzzle]);

  // Synchronized countdown ticks sound
  useEffect(() => {
    if (countdownRemaining !== null && countdownRemaining > 0) {
      playCountdownTick();
    } else if (countdownRemaining === 0) {
      playGoSound();
    }
  }, [countdownRemaining]);

  // Synchronized Race Clock & Dynamic 30-Second Escalating Tension Music
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

  // Sync podium modal with room state
  useEffect(() => {
    if (room.state === 'ended') {
      setShowPodium(true);
    } else if (room.state === 'racing') {
      setShowPodium(false);
    }
  }, [room.state]);

  // Listen to socket move results
  useEffect(() => {
    if (!socket) return;

    function handleMoveResult(data) {
      if (data.correct) {
        if (data.completed) {
          // Success! Complete solution
          setFeedbackState('correct');
          playCorrectSound();
          setComboStreak(data.streak || 0);

          setTimeout(() => {
            if (data.nextPuzzle) {
              setActivePuzzle(data.nextPuzzle);
              setBoardFen(data.nextPuzzle.fen);
              setPlayerColor(data.nextPuzzle.playerColor);
              setLastMoveUci(data.nextPuzzle.setupMove || null);
              setFeedbackState(null);
            }
          }, 350);
        } else if (data.opponentMove) {
          // Play opponent response move
          setTimeout(() => {
            if (data.newFen) {
              setBoardFen(data.newFen);
            }
            setLastMoveUci(data.opponentMove);
            setFeedbackState(null);
          }, 250);
        }
      } else {
        // Wrong move: trigger feedback and shake
        setFeedbackState('wrong');
        playWrongSound();
        setComboStreak(0);

        setTimeout(() => {
          setFeedbackState(null);
        }, 400);
      }
    }

    function handleNewPuzzle(puzzle) {
      setActivePuzzle(puzzle);
      setBoardFen(puzzle.fen);
      setPlayerColor(puzzle.playerColor);
      setLastMoveUci(puzzle.setupMove || null);
      setFeedbackState(null);
    }

    socket.on('move_result', handleMoveResult);
    socket.on('new_puzzle', handleNewPuzzle);

    return () => {
      socket.off('move_result', handleMoveResult);
      socket.off('new_puzzle', handleNewPuzzle);
    };
  }, [socket]);

  function handleMoveSubmit(moveUci) {
    if (room.state !== 'racing') return;
    socket.emit('student_submit_move', {
      roomId: room.id,
      studentId: student.id,
      moveUci
    });
  }

  function handleSkip() {
    if (room.state !== 'racing') return;
    setComboStreak(0);
    onSkipPuzzle();
  }

  function handleSoundToggle() {
    const muted = toggleMute();
    setIsMuted(muted);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  const currentRacer = standings.find(s => s.id === student?.id) || student;
  const animalDetail = ANIMAL_DETAILS[student?.animal?.id] || {};

  const isCountdown = room?.state === 'countdown' || (countdownRemaining !== null && countdownRemaining > 0);
  const displayCount = countdownRemaining ?? room?.countdownRemaining ?? 10;
  const readyCount = standings.filter(s => s.isReady).length;

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
              Get ready with your {animalDetail.name || 'animal'}! 🏁
            </p>
          </div>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AnimalAvatar
            animalId={student?.animal?.id}
            size={38}
            badgeLevel={student?.animal?.badgeLevel || 1}
            ringColor={student?.animal?.ringColor}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-slate-100">
                {student?.name}
              </span>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                {animalDetail.name} #{student?.animal?.badgeLevel || 1}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Room: <strong className="text-slate-200">{room.id}</strong> • Round {room.roundNumber || 1}
            </span>
          </div>
        </div>

        {/* Action icons & Sound Toggle */}
        <div className="flex items-center gap-2">
          {room.state === 'ended' && !showPodium && (
            <button
              onClick={() => setShowPodium(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              View Podium
            </button>
          )}
          <button
            onClick={handleSoundToggle}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Race Arena (Layout Inspired by Screenshot: Large Chessboard, Side Info, Bottom Track) */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 max-w-7xl mx-auto w-full gap-4">
        {/* Upper Stage: Large Chessboard + Side Race Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left/Center: Large Interactive Chessboard OR Lobby Screen */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center">
            {room.state === 'racing' ? (
              <ChessBoard
                fen={boardFen}
                playerColor={playerColor}
                lastMoveUci={lastMoveUci}
                onMoveSubmit={handleMoveSubmit}
                disabled={room.state !== 'racing'}
                feedbackState={feedbackState}
              />
            ) : room.state === 'ended' ? (
              /* Post-Race Lobby Card */
              <div className="w-full max-w-[540px] aspect-square rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col items-center justify-center p-6 sm:p-8 text-center shadow-2xl">
                <AnimalAvatar
                  animalId={student?.animal?.id}
                  size={96}
                  badgeLevel={student?.animal?.badgeLevel || 1}
                  className="mb-3 ring-4 ring-amber-400/50 shadow-xl"
                />
                <h3 className="text-xl sm:text-2xl font-black text-amber-400 mb-1">
                  You are the {animalDetail.name}!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-4">
                  Round {room.roundNumber || 1} Complete! Your score: <strong className="text-amber-400 font-mono font-black">{currentRacer?.score || 0} solves</strong>
                </p>

                {/* Readiness status */}
                {currentRacer?.isReady ? (
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Ready for Round {(room.roundNumber || 1) + 1}!
                    </div>
                    <p className="text-xs text-slate-400 animate-pulse">
                      Waiting for coach to start Round {(room.roundNumber || 1) + 1}...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <button
                      onClick={onToggleReady}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all"
                    >
                      Ready for Next Round!
                    </button>
                    <p className="text-xs text-slate-400">
                      Click to mark yourself ready
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span>Racers ready: <strong className="text-amber-400 font-mono font-bold">{readyCount} / {standings.length}</strong></span>
                  <span>•</span>
                  <button
                    onClick={() => setShowPodium(true)}
                    className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    View Champions Podium
                  </button>
                </div>
              </div>
            ) : (
              /* Pre-Race Lobby Card (waiting or countdown) */
              <div className="w-full max-w-[540px] aspect-square rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center p-8 text-center shadow-xl">
                <AnimalAvatar
                  animalId={student?.animal?.id}
                  size={96}
                  badgeLevel={student?.animal?.badgeLevel || 1}
                  className="mb-4"
                />
                <h3 className="text-xl sm:text-2xl font-black text-amber-400 mb-1">
                  You are the {animalDetail.name}!
                </h3>
                <p className="text-sm text-slate-300 max-w-sm mb-4">
                  {animalDetail.tagline}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold animate-pulse">
                  {isCountdown ? `Race starting in ${displayCount}s...` : 'Waiting for coach to start the countdown...'}
                </div>
              </div>
            )}
          </div>

          {/* Right: Race Information & Control Panel (beside the board) */}
          <div className="lg:col-span-4 flex flex-col gap-3.5 w-full max-w-md mx-auto">
            {/* Digital Timer Card */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
              timeLeft <= 30 && room.state === 'racing'
                ? timeLeft <= 10
                  ? 'bg-amber-950/70 border-amber-400 ring-4 ring-amber-400/50 shadow-2xl shadow-amber-500/40 animate-pulse'
                  : 'bg-amber-950/40 border-amber-500/70 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/90 border-slate-700/60'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Timer className={`w-3.5 h-3.5 ${
                    timeLeft <= 30 && room.state === 'racing' ? 'text-amber-400 animate-spin' : 'text-amber-400'
                  }`} />
                  Race Clock
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {room.state === 'racing' ? (
                    timeLeft <= 30 ? (
                      <span className="text-amber-400 font-black animate-pulse flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                        Final Sprint!
                      </span>
                    ) : 'Live Racing'
                  ) : room.state === 'ended' ? 'Time Expired' : 'Ready'}
                </span>
              </div>
              <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                timeLeft <= 30 && room.state === 'racing'
                  ? timeLeft <= 10
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.9)] animate-pulse'
                    : 'text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  : 'text-amber-400'
              }`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Score & Combo Streak Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mb-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  Solved
                </span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {currentRacer?.score || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex flex-col">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mb-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  Streak
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-black text-orange-400 font-mono">
                    {comboStreak}
                  </span>
                  {comboStreak >= 3 && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 font-bold px-1.5 py-0.5 rounded-full border border-orange-500/30">
                      ON FIRE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Turn & Tactical Details Card */}
            {activePuzzle && room.state === 'racing' && (
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border ${
                        playerColor === 'w' ? 'bg-white border-slate-400' : 'bg-slate-950 border-slate-700'
                      }`}
                    />
                    <strong className="text-slate-100 font-bold">
                      {playerColor === 'w' ? 'White to move' : 'Black to move'}
                    </strong>
                  </div>
                  <span className="text-slate-400 font-mono">
                    Rating {activePuzzle.rating || 1200}
                  </span>
                </div>

                {/* Tactical Themes */}
                {activePuzzle.themes && activePuzzle.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activePuzzle.themes.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Skip Button */}
            {room.state === 'racing' && (
              <button
                onClick={handleSkip}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-150 border border-slate-700 active:scale-98 shadow-md"
              >
                <FastForward className="w-4 h-4 text-amber-400" />
                Skip Puzzle (No Penalty)
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section: Live Multi-Lane Race Track */}
        <div className="w-full mt-auto">
          <RaceTrack
            standings={standings}
            currentStudentId={student?.id}
            raceState={room.state}
          />
        </div>
      </main>

      {/* Celebratory Olympic Podium Modal when race ends */}
      {showPodium && (
        <PodiumModal
          standings={standings}
          currentStudentId={student?.id}
          isCoach={false}
          roundNumber={room.roundNumber || 1}
          onToggleReady={onToggleReady}
          onClose={() => setShowPodium(false)}
        />
      )}
    </div>
  );
}
