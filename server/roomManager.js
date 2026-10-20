const crypto = require('crypto');
const { saveRoom, loadRoom } = require('./db');
const { assignAnimal, resolveStudentName } = require('./animalManager');
const puzzleManager = require('./puzzleManager');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // In-memory active rooms
    this.countdownIntervals = new Map();
    this.raceIntervals = new Map();
  }

  generateRoomId() {
    // Human-friendly 6-character room code, e.g. "RACE-7A" or alphanumeric
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  createRoom({ raceLength = 5, difficulty = 'intermediate' }) {
    const validLengths = [2, 5, 10, 15];
    const finalRaceLength = validLengths.includes(Number(raceLength)) ? Number(raceLength) : 5;

    const validDiffs = ['beginner', 'intermediate', 'advanced', 'mixed'];
    const finalDiff = validDiffs.includes(difficulty) ? difficulty : 'intermediate';

    let roomId = this.generateRoomId();
    while (this.rooms.has(roomId) || loadRoom(roomId)) {
      roomId = this.generateRoomId();
    }

    const coachToken = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // Room stays available for that day (24h)

    const room = {
      id: roomId,
      coachToken,
      raceLength: finalRaceLength, // in minutes
      difficulty: finalDiff,
      createdAt: now,
      expiresAt,
      state: 'waiting', // 'waiting' | 'countdown' | 'racing' | 'ended'
      countdownRemaining: 10,
      roundNumber: 1,
      startTime: null,
      endTime: null,
      students: {}, // studentId -> student record
      seenPuzzles: {}, // studentId -> Set(puzzleIds)
      studentPuzzleStates: {}
    };

    this.rooms.set(roomId, room);
    saveRoom(room);

    return room;
  }

  getRoom(roomId) {
    if (!roomId) return null;
    const cleanId = roomId.toUpperCase().trim();
    if (this.rooms.has(cleanId)) {
      return this.rooms.get(cleanId);
    }
    const dbRoom = loadRoom(cleanId);
    if (dbRoom) {
      // Re-hydrate Sets
      for (const sId of Object.keys(dbRoom.seenPuzzles || {})) {
        dbRoom.seenPuzzles[sId] = new Set(dbRoom.seenPuzzles[sId]);
      }
      this.rooms.set(cleanId, dbRoom);
      return dbRoom;
    }
    return null;
  }

  joinRoom(roomId, desiredName, existingStudentId = null) {
    const room = this.getRoom(roomId);
    if (!room) {
      return { error: 'Room not found or has expired' };
    }

    // Reconnection of existing student
    if (existingStudentId && room.students[existingStudentId]) {
      const student = room.students[existingStudentId];
      student.connected = true;
      saveRoom(room);
      return {
        room: this.getRoomSnapshot(room),
        student,
        isReconnection: true
      };
    }

    const studentId = 's_' + crypto.randomBytes(8).toString('hex');
    const animal = assignAnimal(room.students);
    const resolvedName = resolveStudentName(desiredName, animal, room.students);

    const student = {
      id: studentId,
      name: resolvedName,
      animal,
      score: 0,
      cumulativeSolveTimeMs: 0,
      attempts: 0,
      streak: 0,
      isReady: false,
      connected: true,
      joinedAt: Date.now()
    };

    room.students[studentId] = student;
    room.seenPuzzles[studentId] = new Set();

    // If race is already running, initialize their puzzle immediately!
    if (room.state === 'racing') {
      puzzleManager.initStudentPuzzle(room, studentId);
    }

    saveRoom(room);

    return {
      room: this.getRoomSnapshot(room),
      student,
      isReconnection: false
    };
  }

  renameStudent(roomId, studentId, newName) {
    const room = this.getRoom(roomId);
    if (!room || !room.students[studentId]) return null;

    const trimmed = (newName || '').trim();
    if (!trimmed) return null;

    // Resolve uniqueness
    const resolved = resolveStudentName(trimmed, room.students[studentId].animal, {
      ...room.students,
      [studentId]: { name: '' } // exclude self from collision check
    });

    room.students[studentId].name = resolved;
    saveRoom(room);
    return room.students[studentId];
  }

  removeStudent(roomId, studentId) {
    const room = this.getRoom(roomId);
    if (!room || !room.students[studentId]) return null;

    const removedStudent = room.students[studentId];
    delete room.students[studentId];
    delete room.seenPuzzles[studentId];
    delete room.studentPuzzleStates[studentId];

    saveRoom(room);
    return removedStudent;
  }

  updateSettings(roomId, { raceLength, difficulty }) {
    const room = this.getRoom(roomId);
    if (!room || room.state === 'racing' || room.state === 'countdown') return null;

    if (raceLength) {
      const validLengths = [2, 5, 10, 15];
      if (validLengths.includes(Number(raceLength))) {
        room.raceLength = Number(raceLength);
      }
    }

    if (difficulty) {
      const validDiffs = ['beginner', 'intermediate', 'advanced', 'mixed'];
      if (validDiffs.includes(difficulty)) {
        room.difficulty = difficulty;
      }
    }

    saveRoom(room);
    return room;
  }

  startCountdown(roomId, onTick, onRaceStart, onComplete) {
    const room = this.getRoom(roomId);
    if (!room || room.state === 'racing') return false;

    // Clear any existing countdown
    if (this.countdownIntervals.has(roomId)) {
      clearInterval(this.countdownIntervals.get(roomId));
    }

    room.state = 'countdown';
    room.countdownRemaining = 10;
    saveRoom(room);

    onTick(10);

    const timer = setInterval(() => {
      room.countdownRemaining--;
      if (room.countdownRemaining <= 0) {
        clearInterval(timer);
        this.countdownIntervals.delete(roomId);
        this.startRace(roomId, onComplete);
        if (onRaceStart) onRaceStart(room);
      } else {
        onTick(room.countdownRemaining);
      }
    }, 1000);

    this.countdownIntervals.set(roomId, timer);
    return true;
  }

  startRace(roomId, onRaceEndCallback) {
    const room = this.getRoom(roomId);
    if (!room) return;

    room.state = 'racing';
    const now = Date.now();
    room.startTime = now;
    room.endTime = now + room.raceLength * 60 * 1000;

    // Initialize individual puzzle streams for all joined students
    for (const studentId of Object.keys(room.students)) {
      room.students[studentId].score = 0;
      room.students[studentId].cumulativeSolveTimeMs = 0;
      room.students[studentId].attempts = 0;
      room.students[studentId].streak = 0;
      room.students[studentId].isReady = false;
      puzzleManager.initStudentPuzzle(room, studentId);
    }

    saveRoom(room);

    // Set server timeout for race completion
    if (this.raceIntervals.has(roomId)) {
      clearTimeout(this.raceIntervals.get(roomId));
    }

    const durationMs = Math.max(0, room.endTime - Date.now());
    const raceTimer = setTimeout(() => {
      this.endRace(roomId, onRaceEndCallback);
    }, durationMs);

    this.raceIntervals.set(roomId, raceTimer);
  }

  addTime(roomId, minutesToAdd, onTimerAdjusted) {
    const room = this.getRoom(roomId);
    if (!room || room.state !== 'racing') return false;

    const msToAdd = minutesToAdd * 60 * 1000;
    room.endTime += msToAdd;
    saveRoom(room);

    // Reschedule timer
    if (this.raceIntervals.has(roomId)) {
      clearTimeout(this.raceIntervals.get(roomId));
    }

    const remainingMs = Math.max(0, room.endTime - Date.now());
    const raceTimer = setTimeout(() => {
      this.endRace(roomId, onTimerAdjusted);
    }, remainingMs);

    this.raceIntervals.set(roomId, raceTimer);

    if (onTimerAdjusted) {
      onTimerAdjusted(room.endTime);
    }
    return true;
  }

  endRace(roomId, onComplete) {
    const room = this.getRoom(roomId);
    if (!room || room.state === 'ended') return;

    if (this.raceIntervals.has(roomId)) {
      clearTimeout(this.raceIntervals.get(roomId));
      this.raceIntervals.delete(roomId);
    }
    if (this.countdownIntervals.has(roomId)) {
      clearInterval(this.countdownIntervals.get(roomId));
      this.countdownIntervals.delete(roomId);
    }

    room.state = 'ended';
    saveRoom(room);

    const standings = this.calculateStandings(room);
    if (onComplete) {
      onComplete(standings);
    }
    return standings;
  }

  toggleReady(roomId, studentId) {
    const room = this.getRoom(roomId);
    if (!room || !room.students[studentId]) return null;

    room.students[studentId].isReady = !room.students[studentId].isReady;
    saveRoom(room);
    return room.students[studentId];
  }

  startNextRound(roomId, onTick, onRaceStart, onComplete) {
    const room = this.getRoom(roomId);
    if (!room) return false;

    room.roundNumber++;
    room.state = 'waiting';
    // Clear readiness for new round, preserve names & animals
    for (const s of Object.values(room.students)) {
      s.isReady = false;
      s.score = 0;
      s.cumulativeSolveTimeMs = 0;
      s.attempts = 0;
      s.streak = 0;
    }

    saveRoom(room);
    return this.startCountdown(roomId, onTick, onRaceStart, onComplete);
  }

  /**
   * Standings rule:
   * Rank students by puzzles solved (primary, descending);
   * if tied, use fastest cumulative solve time as tiebreaker (ascending)!
   */
  calculateStandings(room) {
    const studentList = Object.values(room.students || {});

    studentList.sort((a, b) => {
      // 1. Puzzles solved (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 2. Tiebreaker: Fastest cumulative solve time (ascending)
      if (a.cumulativeSolveTimeMs !== b.cumulativeSolveTimeMs) {
        return a.cumulativeSolveTimeMs - b.cumulativeSolveTimeMs;
      }
      // 3. Fallback: Joined earlier
      return a.joinedAt - b.joinedAt;
    });

    return studentList.map((s, index) => ({
      rank: index + 1,
      id: s.id,
      name: s.name,
      animal: s.animal,
      score: s.score,
      cumulativeSolveTimeMs: s.cumulativeSolveTimeMs,
      streak: s.streak,
      isReady: s.isReady,
      connected: s.connected
    }));
  }

  getRoomSnapshot(room) {
    return {
      id: room.id,
      raceLength: room.raceLength,
      difficulty: room.difficulty,
      state: room.state,
      countdownRemaining: room.countdownRemaining,
      roundNumber: room.roundNumber,
      startTime: room.startTime,
      endTime: room.endTime,
      studentsCount: Object.keys(room.students).length,
      standings: this.calculateStandings(room)
    };
  }
}

module.exports = new RoomManager();
