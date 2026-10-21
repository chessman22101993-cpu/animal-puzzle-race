import React, { useState } from 'react';
import { AnimalAvatar, ANIMALS } from '../assets/animals';
import { Sparkles, Trophy, ArrowRight, ShieldCheck, Gamepad2, ArrowLeft } from 'lucide-react';

export default function JoinRoom({
  defaultRoomId = '',
  onJoin,
  onBack,
  isLoading = false,
  error = null
}) {
  const [roomId, setRoomId] = useState(defaultRoomId || '');
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!roomId.trim()) return;
    onJoin(roomId.trim().toUpperCase(), name.trim());
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Trophy className="w-3.5 h-3.5" />
            Live Chess Puzzle Race
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight">
            Who is the Champion?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Solve tactical puzzles fast to propel your team mascot to victory!
          </p>
        </div>

        {/* 10 Animals Preview Strip */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            10 Racing Mascots
          </div>
          <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 custom-scrollbar">
            {ANIMALS.map((a) => (
              <div key={a.id} className="flex flex-col items-center flex-shrink-0" title={a.name}>
                <AnimalAvatar animalId={a.id} size={30} />
              </div>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Join Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Only show room code input if not pre-filled from a shared link */}
          {!defaultRoomId && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Race Room Code
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="e.g. 7X8Y9Z"
                maxLength={8}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 font-mono text-center text-lg font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase transition-all"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Your Racer Name
              </label>
              <span className="text-[10px] text-amber-400/80">Optional</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leave blank for an animal guest name"
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !roomId.trim()}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Joining Race...
              </span>
            ) : (
              <>
                <Gamepad2 className="w-5 h-5" />
                Join Race
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          No account needed. Just tap Join!
        </div>
      </div>
    </div>
  );
}
