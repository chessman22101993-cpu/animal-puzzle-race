const { getPuzzlesByDifficulty } = require('./db');

class PuzzleManager {
  constructor() {
    // Cache of puzzle batches by difficulty to avoid constant DB disk reads
    this.cache = {
      beginner: [],
      intermediate: [],
      advanced: [],
      mixed: []
    };
    this.refreshCache();
  }

  refreshCache() {
    this.cache.beginner = getPuzzlesByDifficulty('beginner', 150);
    this.cache.intermediate = getPuzzlesByDifficulty('intermediate', 150);
    this.cache.advanced = getPuzzlesByDifficulty('advanced', 150);
    this.cache.mixed = getPuzzlesByDifficulty('mixed', 200);
  }

  /**
   * Fetch the next puzzle for a specific student, ensuring:
   * 1. Matches coach-selected difficulty
   * 2. Has not been seen by this student in this room
   */
  getNextPuzzle(difficulty, seenSet) {
    let pool = this.cache[difficulty] || this.cache.intermediate;
    if (pool.length === 0) {
      this.refreshCache();
      pool = this.cache[difficulty] || this.cache.intermediate;
    }

    // Filter out already seen puzzles
    const unseen = pool.filter(p => !seenSet.has(p.id));

    let chosen;
    if (unseen.length > 0) {
      chosen = unseen[Math.floor(Math.random() * unseen.length)];
    } else {
      // If student has solved all cached puzzles, refresh cache or pick random
      this.refreshCache();
      chosen = pool[Math.floor(Math.random() * pool.length)];
    }

    if (!chosen) {
      // Fallback query directly from database
      const dbPuzzles = getPuzzlesByDifficulty(difficulty, 10);
      chosen = dbPuzzles[0];
    }

    seenSet.add(chosen.id);

    const solutionMoves = JSON.parse(chosen.solution_moves);

    return {
      id: chosen.id,
      fen: chosen.fen,
      setupMove: chosen.setup_move,
      playerColor: chosen.player_color,
      rating: chosen.rating,
      themes: chosen.themes ? chosen.themes.split(',') : [],
      totalPlies: solutionMoves.length,
      // Internal solution moves kept on server for verification
      _solutionMoves: solutionMoves
    };
  }

  /**
   * Initializes or gets the active puzzle state for a student
   */
  initStudentPuzzle(room, studentId) {
    if (!room.seenPuzzles[studentId]) {
      room.seenPuzzles[studentId] = new Set();
    }
    // Convert array/set if reloaded from DB
    if (!(room.seenPuzzles[studentId] instanceof Set)) {
      room.seenPuzzles[studentId] = new Set(room.seenPuzzles[studentId]);
    }

    const puzzle = this.getNextPuzzle(room.difficulty, room.seenPuzzles[studentId]);
    
    room.studentPuzzleStates[studentId] = {
      puzzleId: puzzle.id,
      fen: puzzle.fen,
      playerColor: puzzle.playerColor,
      setupMove: puzzle.setupMove,
      rating: puzzle.rating,
      themes: puzzle.themes,
      currentStep: 0, // index into _solutionMoves
      solutionMoves: puzzle._solutionMoves,
      startedAt: Date.now()
    };

    return this.getPublicPuzzlePayload(room.studentPuzzleStates[studentId]);
  }

  getPublicPuzzlePayload(state) {
    return {
      puzzleId: state.puzzleId,
      fen: state.fen,
      playerColor: state.playerColor,
      setupMove: state.setupMove,
      rating: state.rating,
      themes: state.themes,
      totalMoves: state.solutionMoves.length,
      currentMoveIndex: state.currentStep
    };
  }

  /**
   * Processes a move submitted by student:
   * Returns:
   * - { correct: false }
   * - { correct: true, completed: false, opponentMove }
   * - { correct: true, completed: true, nextPuzzle }
   */
  processMove(room, studentId, moveUci) {
    const state = room.studentPuzzleStates[studentId];
    if (!state) {
      return { error: 'No active puzzle for student' };
    }

    const expectedMove = state.solutionMoves[state.currentStep];

    // Check if move matches (case-insensitive UCI string, e.g. "e2e4" or "e7e8q")
    if (!moveUci || moveUci.toLowerCase() !== (expectedMove || '').toLowerCase()) {
      return {
        correct: false,
        message: 'Incorrect move'
      };
    }

    // Move was correct! Advance student step
    const { Chess } = require('chess.js');
    const chess = new Chess(state.fen);

    function parseUci(str) {
      if (!str || str.length < 4) return null;
      return {
        from: str.slice(0, 2),
        to: str.slice(2, 4),
        promotion: str.length > 4 ? str.slice(4, 5) : undefined
      };
    }

    // Apply student's move
    const studentParsed = parseUci(expectedMove);
    if (studentParsed) {
      chess.move(studentParsed);
    }
    state.currentStep++;

    // Did student complete the entire solution sequence?
    if (state.currentStep >= state.solutionMoves.length) {
      // Puzzle completed!
      const solveTimeMs = Date.now() - state.startedAt;
      const nextPuzzle = this.initStudentPuzzle(room, studentId);

      return {
        correct: true,
        completed: true,
        solveTimeMs,
        nextPuzzle
      };
    }

    // If there is an opponent response move next:
    const opponentMove = state.solutionMoves[state.currentStep];
    const opponentParsed = parseUci(opponentMove);
    if (opponentParsed) {
      chess.move(opponentParsed);
    }
    state.currentStep++; // Auto-advance past opponent move

    // Updated position FEN after opponent reply
    const newFen = chess.fen();
    state.fen = newFen;

    // Check if opponent move finished the sequence
    const completedAfterOpponent = state.currentStep >= state.solutionMoves.length;
    let nextPuzzle = null;
    let solveTimeMs = 0;

    if (completedAfterOpponent) {
      solveTimeMs = Date.now() - state.startedAt;
      nextPuzzle = this.initStudentPuzzle(room, studentId);
    }

    return {
      correct: true,
      completed: completedAfterOpponent,
      opponentMove,
      newFen,
      solveTimeMs,
      nextPuzzle
    };
  }

  /**
   * Student skips puzzle: advances to next puzzle with 0 points awarded
   */
  skipPuzzle(room, studentId) {
    return this.initStudentPuzzle(room, studentId);
  }
}

module.exports = new PuzzleManager();
