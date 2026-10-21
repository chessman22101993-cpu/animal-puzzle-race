import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import JoinRoom from './components/JoinRoom';
import StudentRace from './components/StudentRace';
import CoachRoom from './components/CoachRoom';
import { AnimalAvatar, ANIMALS } from './assets/animals';
import { Trophy, Crown, Gamepad2, Sparkles, ArrowRight } from 'lucide-react';

// Connect to current origin or fallback for Vite dev server (port 3001)
const SERVER_URL = window.location.port === '5173' ? 'http://localhost:3001' : window.location.origin;

export default function App() {
  const [socket, setSocket] = useState(null);
  const [view, setView] = useState('home'); // 'home' | 'join' | 'student' | 'coach'
  const [room, setRoom] = useState(null);
  const [student, setStudent] = useState(null);
  const [coachToken, setCoachToken] = useState(null);
  const [standings, setStandings] = useState([]);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [countdownRemaining, setCountdownRemaining] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const s = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('🐾 Connected to Animal Puzzle Race server:', s.id);
    });

    s.on('error_message', ({ message }) => {
      setErrorMessage(message);
      setIsLoading(false);
    });

    // Standings updates
    s.on('standings_updated', ({ standings: newStandings }) => {
      setStandings(newStandings || []);
      setRoom(prev => prev ? { ...prev, standings: newStandings } : null);
    });

    // Race state changed (countdown start, etc.)
    s.on('race_state_changed', ({ state, countdownRemaining: cr, roundNumber: rn }) => {
      setRoom(prev => prev ? { ...prev, state, roundNumber: rn || prev.roundNumber } : null);
      if (state === 'countdown' && cr != null) {
        setCountdownRemaining(cr);
      }
    });

    // Countdown tick
    s.on('countdown_tick', ({ count }) => {
      setCountdownRemaining(count);
      setRoom(prev => prev ? { ...prev, state: 'countdown', countdownRemaining: count } : null);
    });

    // Race started
    s.on('race_started', ({ startTime, endTime, roundNumber }) => {
      setCountdownRemaining(null);
      setRoom(prev => prev ? {
        ...prev,
        state: 'racing',
        startTime,
        endTime,
        roundNumber
      } : null);
    });

    // Race ended
    s.on('race_ended', ({ standings: finalStandings, roundNumber }) => {
      setRoom(prev => prev ? {
        ...prev,
        state: 'ended',
        roundNumber
      } : null);
      setStandings(finalStandings || []);
    });

    // Time added by coach
    s.on('time_added', ({ newEndTime }) => {
      setRoom(prev => prev ? { ...prev, endTime: newEndTime } : null);
    });

    // Settings updated by coach
    s.on('room_settings_updated', ({ raceLength, difficulty }) => {
      setRoom(prev => prev ? { ...prev, raceLength, difficulty } : null);
    });

    // Student renamed
    s.on('student_renamed', ({ student: updatedStudent, standings: newStandings }) => {
      setStandings(newStandings || []);
      setStudent(prev => (prev && prev.id === updatedStudent.id ? updatedStudent : prev));
    });

    // Student removed
    s.on('student_removed', ({ studentId, standings: newStandings }) => {
      setStandings(newStandings || []);
    });

    s.on('student_removed_by_coach', ({ message }) => {
      alert(message);
      setView('home');
      setRoom(null);
      setStudent(null);
    });

    // Readiness updated
    s.on('readiness_updated', ({ standings: newStandings }) => {
      setStandings(newStandings || []);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Check URL parameters on mount (e.g. ?room=ROOM_ID or ?coach=ROOM_ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const coachParam = params.get('coach');

    if (coachParam) {
      const savedToken = localStorage.getItem(`coach_token_${coachParam}`);
      if (savedToken) {
        initCoachSession(coachParam, savedToken);
      } else {
        setView('join');
      }
    } else if (roomParam) {
      const savedStudentId = localStorage.getItem(`student_id_${roomParam}`);
      if (savedStudentId && socket) {
        // Attempt seamless reconnection
        joinAsStudent(roomParam, '', savedStudentId);
      } else {
        setView('join');
      }
    }
  }, [socket]);

  // Create room (Coach)
  async function handleCreateRoom(raceLength = 5, difficulty = 'intermediate') {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const resp = await fetch(`${SERVER_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raceLength, difficulty })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to create room');
      }

      localStorage.setItem(`coach_token_${data.roomId}`, data.coachToken);
      initCoachSession(data.roomId, data.coachToken);
    } catch (err) {
      setErrorMessage(err.message);
      setIsLoading(false);
    }
  }

  // Join coach session
  function initCoachSession(roomId, token) {
    if (!socket) return;
    setIsLoading(true);

    socket.emit('join_coach_room', { roomId, coachToken: token });

    socket.once('coach_init_success', ({ room: roomData }) => {
      setRoom(roomData);
      setCoachToken(token);
      setStandings(roomData.standings || []);
      setView('coach');
      setIsLoading(false);
    });
  }

  // Join as student
  function joinAsStudent(roomId, name = '', existingStudentId = null) {
    if (!socket) return;
    setIsLoading(true);
    setErrorMessage(null);

    const savedId = existingStudentId || localStorage.getItem(`student_id_${roomId}`);

    socket.emit('join_student_room', {
      roomId,
      name,
      studentId: savedId
    });

    socket.once('student_join_success', ({ student: studentData, room: roomData, currentPuzzle: puzzleData }) => {
      localStorage.setItem(`student_id_${roomData.id}`, studentData.id);
      setStudent(studentData);
      setRoom(roomData);
      setStandings(roomData.standings || []);
      setCurrentPuzzle(puzzleData);
      setView('student');
      setIsLoading(false);
    });
  }

  // Coach Actions
  function handleStartCountdown() {
    if (!socket || !room || !coachToken) return;
    socket.emit('coach_start_countdown', { roomId: room.id, coachToken });
  }

  function handleAddTime(minutes) {
    if (!socket || !room || !coachToken) return;
    socket.emit('coach_add_time', { roomId: room.id, coachToken, minutes });
  }

  function handleEndRace() {
    if (!socket || !room || !coachToken) return;
    socket.emit('coach_end_race', { roomId: room.id, coachToken });
  }

  function handleRenameStudent(studentId, newName) {
    if (!socket || !room || !coachToken) return;
    socket.emit('coach_rename_student', { roomId: room.id, coachToken, studentId, newName });
  }

  function handleRemoveStudent(studentId) {
    if (!socket || !room || !coachToken) return;
    socket.emit('coach_remove_student', { roomId: room.id, coachToken, studentId });
  }

  function handleUpdateSettings(settings) {
    if (!socket || !room || !coachToken) return;
    socket.emit('coach_update_settings', {
      roomId: room.id,
      coachToken,
      ...settings
    });
  }

  function handleStartNextRound() {
    if (!socket || !room || !coachToken) return;
    socket.emit('coach_start_next_round', { roomId: room.id, coachToken });
  }

  // Student Actions
  function handleSkipPuzzle() {
    if (!socket || !room || !student) return;
    socket.emit('student_skip_puzzle', { roomId: room.id, studentId: student.id });
  }

  function handleToggleReady() {
    if (!socket || !room || !student) return;
    socket.emit('student_toggle_ready', { roomId: room.id, studentId: student.id });
  }

  // View Routing
  if (view === 'coach' && room) {
    return (
      <CoachRoom
        socket={socket}
        room={room}
        coachToken={coachToken}
        standings={standings}
        countdownRemaining={countdownRemaining}
        onStartCountdown={handleStartCountdown}
        onAddTime={handleAddTime}
        onEndRace={handleEndRace}
        onRenameStudent={handleRenameStudent}
        onRemoveStudent={handleRemoveStudent}
        onUpdateSettings={handleUpdateSettings}
        onStartNextRound={handleStartNextRound}
      />
    );
  }

  if (view === 'student' && room && student) {
    return (
      <StudentRace
        socket={socket}
        room={room}
        student={student}
        currentPuzzle={currentPuzzle}
        standings={standings}
        countdownRemaining={countdownRemaining}
        onSkipPuzzle={handleSkipPuzzle}
        onToggleReady={handleToggleReady}
      />
    );
  }

  if (view === 'join') {
    const params = new URLSearchParams(window.location.search);
    const defaultRoom = params.get('room') || '';
    return (
      <JoinRoom
        defaultRoomId={defaultRoom}
        onJoin={(rId, name) => joinAsStudent(rId, name)}
        isLoading={isLoading}
        error={errorMessage}
      />
    );
  }

  // Welcome / Landing Screen
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white select-none">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 animate-fade-in">
          <Trophy className="w-4 h-4" />
          Interactive Chess Racing for Coaches & Students
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight text-center mb-3">
          Who is the Champion?
        </h1>
        <p className="text-sm sm:text-lg text-slate-300 max-w-xl text-center mb-8">
          A real-time multiplayer chess tactics sprint. Solve puzzles to advance your racing mascot across the track!
        </p>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs sm:text-sm font-medium text-center max-w-md">
            {errorMessage}
          </div>
        )}

        {/* 2 Main Action Cards: Coach vs Student */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-10">
          {/* Coach Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-amber-400 transition-all duration-200 shadow-2xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4">
                <Crown className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-2">
                Coach Room
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Create a persistent room, pick 2-15 min race lengths & difficulty levels, share link with students, and control live racing.
              </p>
            </div>

            <button
              onClick={() => handleCreateRoom(5, 'intermediate')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Create Race Room
            </button>
          </div>

          {/* Student Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-500 transition-all duration-200 shadow-2xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-2">
                Student Racer
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Enter a room code or open your coach's link. No account required! Choose your name and get your team mascot.
              </p>
            </div>

            <button
              onClick={() => setView('join')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-600 active:scale-98 transition-all"
            >
              Join Existing Race
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* 10 Animal Racers Carousel Showcase */}
        <div className="w-full max-w-3xl bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 sm:p-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 block">
            The 10 Racing Mascots
          </span>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 justify-center">
            {ANIMALS.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-1.5" title={`${a.name}: ${a.speed}`}>
                <AnimalAvatar animalId={a.id} size={42} />
                <span className="text-[11px] font-bold text-slate-300 truncate w-full text-center">
                  {a.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
