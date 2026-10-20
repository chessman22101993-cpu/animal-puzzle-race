const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PUZZLES_DB_PATH = path.join(DATA_DIR, 'puzzles.db');
const ROOMS_DB_PATH = path.join(DATA_DIR, 'rooms.db');

const puzzlesDb = new Database(PUZZLES_DB_PATH);
const roomsDb = new Database(ROOMS_DB_PATH);

// Initialize rooms schema
roomsDb.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    coach_token TEXT NOT NULL,
    race_length INTEGER NOT NULL DEFAULT 5,
    difficulty TEXT NOT NULL DEFAULT 'intermediate',
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    state TEXT NOT NULL DEFAULT 'waiting',
    round_number INTEGER NOT NULL DEFAULT 1,
    start_time INTEGER,
    end_time INTEGER,
    data_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rooms_expires ON rooms(expires_at);
`);

// Clean up expired rooms older than 24 hours
function cleanupExpiredRooms() {
  const now = Date.now();
  roomsDb.prepare(`DELETE FROM rooms WHERE expires_at < ?`).run(now);
}

// Save or update room state
function saveRoom(room) {
  const stmt = roomsDb.prepare(`
    INSERT OR REPLACE INTO rooms (
      id, coach_token, race_length, difficulty, created_at, expires_at, state, round_number, start_time, end_time, data_json
    ) VALUES (
      @id, @coach_token, @race_length, @difficulty, @created_at, @expires_at, @state, @round_number, @start_time, @end_time, @data_json
    )
  `);

  const serializedData = JSON.stringify({
    students: room.students,
    seenPuzzles: room.seenPuzzles || {},
    studentPuzzleStates: room.studentPuzzleStates || {}
  });

  stmt.run({
    id: room.id,
    coach_token: room.coachToken,
    race_length: room.raceLength,
    difficulty: room.difficulty,
    created_at: room.createdAt,
    expires_at: room.expiresAt,
    state: room.state,
    round_number: room.roundNumber,
    start_time: room.startTime || null,
    end_time: room.endTime || null,
    data_json: serializedData
  });
}

// Load room by ID
function loadRoom(id) {
  cleanupExpiredRooms();
  const row = roomsDb.prepare(`SELECT * FROM rooms WHERE id = ?`).get(id);
  if (!row) return null;

  let parsed = { students: {}, seenPuzzles: {}, studentPuzzleStates: {} };
  try {
    parsed = JSON.parse(row.data_json);
  } catch (e) {}

  return {
    id: row.id,
    coachToken: row.coach_token,
    raceLength: row.race_length,
    difficulty: row.difficulty,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    state: row.state,
    roundNumber: row.round_number,
    startTime: row.start_time,
    endTime: row.end_time,
    students: parsed.students || {},
    seenPuzzles: parsed.seenPuzzles || {},
    studentPuzzleStates: parsed.studentPuzzleStates || {}
  };
}

// Get puzzle queries
function getPuzzlesByDifficulty(difficulty, limit = 50) {
  if (difficulty === 'mixed') {
    // Return balanced mix: 33% beginner, 34% intermediate, 33% advanced
    const bLimit = Math.ceil(limit / 3);
    const iLimit = Math.ceil(limit / 3);
    const aLimit = limit - bLimit - iLimit;

    const b = puzzlesDb.prepare(`SELECT * FROM puzzles WHERE difficulty = 'beginner' ORDER BY RANDOM() LIMIT ?`).all(bLimit);
    const i = puzzlesDb.prepare(`SELECT * FROM puzzles WHERE difficulty = 'intermediate' ORDER BY RANDOM() LIMIT ?`).all(iLimit);
    const a = puzzlesDb.prepare(`SELECT * FROM puzzles WHERE difficulty = 'advanced' ORDER BY RANDOM() LIMIT ?`).all(aLimit);
    
    // Shuffle combined
    const combined = [...b, ...i, ...a];
    for (let idx = combined.length - 1; idx > 0; idx--) {
      const j = Math.floor(Math.random() * (idx + 1));
      [combined[idx], combined[j]] = [combined[j], combined[idx]];
    }
    return combined;
  }

  return puzzlesDb.prepare(`SELECT * FROM puzzles WHERE difficulty = ? ORDER BY RANDOM() LIMIT ?`).all(difficulty, limit);
}

function getPuzzleById(id) {
  return puzzlesDb.prepare(`SELECT * FROM puzzles WHERE id = ?`).get(id);
}

module.exports = {
  puzzlesDb,
  roomsDb,
  saveRoom,
  loadRoom,
  getPuzzlesByDifficulty,
  getPuzzleById,
  cleanupExpiredRooms
};
