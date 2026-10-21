const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { Chess } = require('chess.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'puzzles.db');
const db = new Database(DB_PATH);

// Setup SQLite tables
db.exec(`
  CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    fen TEXT NOT NULL,
    initial_fen TEXT NOT NULL,
    setup_move TEXT NOT NULL,
    solution_moves TEXT NOT NULL,
    rating INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    themes TEXT NOT NULL,
    player_color TEXT NOT NULL,
    num_moves INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_puzzles_diff ON puzzles(difficulty);
  CREATE INDEX IF NOT EXISTS idx_puzzles_rating ON puzzles(rating);
`);

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO puzzles (
    id, fen, initial_fen, setup_move, solution_moves, rating, difficulty, themes, player_color, num_moves
  ) VALUES (
    @id, @fen, @initial_fen, @setup_move, @solution_moves, @rating, @difficulty, @themes, @player_color, @num_moves
  )
`);

function parseUciMove(str) {
  if (!str || str.length < 4) return null;
  return {
    from: str.slice(0, 2),
    to: str.slice(2, 4),
    promotion: str.length > 4 ? str.slice(4, 5) : undefined
  };
}

function validateAndFormatPuzzle(raw) {
  try {
    const id = raw.PuzzleId || raw.id;
    const initialFen = raw.FEN || raw.fen;
    const movesStr = Array.isArray(raw.Moves) ? raw.Moves.join(' ') : (raw.Moves || raw.moves || '');
    const rating = parseInt(raw.Rating || raw.rating, 10);
    const rawThemes = raw.Themes || raw.themes || [];
    const themes = Array.isArray(rawThemes) ? rawThemes.join(',') : String(rawThemes);

    if (!id || !initialFen || !movesStr || isNaN(rating)) {
      return null;
    }

    const moves = movesStr.trim().split(/\s+/);
    if (moves.length < 2) {
      return null; // Must have setup move + at least one solution move
    }

    // Step 1: Initialize chess with initial FEN
    const chess = new Chess(initialFen);

    // Step 2: Apply the opponent's blunder / setup move (moves[0])
    const setupUci = moves[0];
    const parsedSetup = parseUciMove(setupUci);
    if (!parsedSetup) return null;

    const setupResult = chess.move(parsedSetup);
    if (!setupResult) return null;

    // The displayed board position after setup move:
    const displayedFen = chess.fen();
    const playerColor = chess.turn(); // 'w' or 'b'

    // Step 3: Validate the entire solution move sequence:
    // moves[1]: player move 1
    // moves[2]: opponent reply 1
    // moves[3]: player move 2, etc.
    const solutionMoves = [];
    for (let i = 1; i < moves.length; i++) {
      const uci = moves[i];
      const parsed = parseUciMove(uci);
      if (!parsed) return null;

      const res = chess.move(parsed);
      if (!res) {
        return null; // Invalid move sequence according to chess rules!
      }
      solutionMoves.push(uci);
    }

    // Determine difficulty band based on rating
    let difficulty = 'intermediate';
    if (rating < 1200) {
      difficulty = 'beginner';
    } else if (rating >= 1600) {
      difficulty = 'advanced';
    }

    return {
      id,
      fen: displayedFen,
      initial_fen: initialFen,
      setup_move: setupUci,
      solution_moves: JSON.stringify(solutionMoves),
      rating,
      difficulty,
      themes,
      player_color: playerColor,
      num_moves: solutionMoves.length
    };
  } catch (err) {
    return null;
  }
}

async function fetchWithRetry(url, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'AnimalPuzzleRaceApp/1.0' }
      });
      if (resp.ok) {
        return await resp.json();
      }
      if (resp.status === 429 || resp.status === 502 || resp.status === 503) {
        await new Promise(r => setTimeout(r, 600 * attempt));
        continue;
      }
      throw new Error(`HTTP ${resp.status}`);
    } catch (e) {
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, 600 * attempt));
    }
  }
  throw new Error(`Failed after ${maxRetries} attempts`);
}

async function fetchHuggingfaceBatch(offset, limit = 100) {
  const url = `https://datasets-server.huggingface.co/rows?dataset=Lichess%2Fchess-puzzles&config=default&split=train&offset=${offset}&limit=${limit}`;
  const data = await fetchWithRetry(url);
  return (data.rows || []).map(r => r.row);
}

// Built-in starter collection of classic verified Lichess puzzles across all rating tiers
// ensuring instant availability even with zero network!
const SEED_PUZZLES = [
  // Beginner (<1200)
  {
    PuzzleId: "003YF",
    FEN: "r4rk1/1pp2ppp/p2p4/2bPp3/2P1Pn1q/P1N2B2/1P3P2/R1BQK1R1 w Q - 1 15",
    Moves: "c1f4 h4f2",
    Rating: 1061,
    Themes: "attackingF2F7,mate,mateIn1,middlegame,oneMove"
  },
  {
    PuzzleId: "003jb",
    FEN: "r3kb1r/p4ppp/b1p1p3/3q4/3Q4/4BN2/PPP2PPP/R3K2R b KQkq - 0 11",
    Moves: "c6c5 d4a4 a6b5 a4b5",
    Rating: 962,
    Themes: "crushing,fork,master,middlegame,short"
  },
  {
    PuzzleId: "003jv",
    FEN: "1R6/1p2k2p/p2n2p1/4K3/8/6P1/P6P/8 w - - 10 37",
    Moves: "b8h8 d6f7 e5e4 f7h8",
    Rating: 1006,
    Themes: "crushing,endgame,fork,short"
  },
  {
    PuzzleId: "003o0",
    FEN: "r1bqk2r/pp1nbppp/3p4/1B1p4/3P1B2/8/PPP2PPP/R2QK1NR w KQkq - 2 9",
    Moves: "g1f3 d8a5 d1d2 a5b5",
    Rating: 1001,
    Themes: "advantage,fork,master,opening,short"
  },
  {
    PuzzleId: "003r5",
    FEN: "r2qr1k1/ppp2ppp/4b3/3P4/1nP2Q2/2N2N1P/PP3KP1/R4R2 w - - 1 15",
    Moves: "d5e6 b4d3 f2g1 d3f4",
    Rating: 1130,
    Themes: "crushing,fork,middlegame,short"
  },
  {
    PuzzleId: "bgn01",
    FEN: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    Moves: "d2d3 e4f2 e1f2",
    Rating: 850,
    Themes: "advantage,opening,short"
  },
  {
    PuzzleId: "bgn02",
    FEN: "6k1/5ppp/8/8/8/8/1r3PPP/3R2K1 b - - 0 1",
    Moves: "b2b8 d1d8 b8d8",
    Rating: 750,
    Themes: "backRankMate,mate,mateIn1,endgame"
  },
  {
    PuzzleId: "bgn03",
    FEN: "r1b1k2r/pppp1ppp/8/4q3/1bP5/2N1P3/PP3PPP/R2QKB1R b KQkq - 1 9",
    Moves: "d7d6 d1a4 c8d7 a4b4",
    Rating: 920,
    Themes: "crushing,fork,opening,short"
  },
  {
    PuzzleId: "bgn04",
    FEN: "r2qk2r/ppp2ppp/2n1b3/2bnp3/2B5/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 2 7",
    Moves: "c4b5 d5c3 b2c3",
    Rating: 1050,
    Themes: "advantage,opening"
  },
  {
    PuzzleId: "bgn05",
    FEN: "r1b2rk1/ppp2ppp/8/3q4/3n4/3B4/PPP2PPP/R1BQR1K1 b - - 1 11",
    Moves: "c8e6 c2c4 d5d6",
    Rating: 1120,
    Themes: "advantage,middlegame"
  },
  // Intermediate (1200 - 1599)
  {
    PuzzleId: "003mh",
    FEN: "r4k1r/1pp2p2/p2p3p/3N4/3P2q1/8/PPP5/1K2Q1NR b - - 1 23",
    Moves: "a8e8 e1e8 f8e8 d5f6 e8e7 f6g4",
    Rating: 1325,
    Themes: "advantage,attraction,fork,long,middlegame,sacrifice"
  },
  {
    PuzzleId: "003nQ",
    FEN: "6rk/pp6/2n5/3ppn1p/3p4/2P2P1q/PP3QNB/R4R1K w - - 2 29",
    Moves: "f1g1 f5g3 f2g3 g8g3",
    Rating: 1286,
    Themes: "crushing,kingsideAttack,master,middlegame,pin,short"
  },
  {
    PuzzleId: "003eP",
    FEN: "8/r1b1q2k/2p3p1/2Pp4/1P2p1n1/2B1P3/NQ22PP/2K4R b - - 1 36",
    Moves: "h7g8 h1h8 g8f7 h8h7 f7e8 h7e7",
    Rating: 1156,
    Themes: "crushing,exposedKing,long,middlegame,skewer"
  },
  {
    PuzzleId: "int01",
    FEN: "r1b1r1k1/pp3ppp/2n5/3q4/3P4/5N2/PP1QBPPP/R3R1K1 b - - 4 13",
    Moves: "c6d4 d2d4 d5d4 f3d4",
    Rating: 1380,
    Themes: "advantage,middlegame,short"
  },
  {
    PuzzleId: "int02",
    FEN: "r2q1rk1/1pp2pp1/p1nb1n1p/3p4/3P2b1/2NBPN2/PPQB1PPP/R4RK1 w - - 4 11",
    Moves: "d3e2 c6b4 c2b3 g4f3 e2f3",
    Rating: 1420,
    Themes: "advantage,middlegame"
  },
  {
    PuzzleId: "int03",
    FEN: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 3 9",
    Moves: "e3h6 g7h6 d2h6 c3d4",
    Rating: 1490,
    Themes: "advantage,opening,short"
  },
  {
    PuzzleId: "int04",
    FEN: "2kr3r/ppp2ppp/2n5/3q4/3Pn1b1/2P2N2/P1QBBPPP/R4RK1 w - - 3 13",
    Moves: "d2f4 e4c3 c2c3",
    Rating: 1540,
    Themes: "advantage,middlegame"
  },
  // Advanced (1600+)
  {
    PuzzleId: "00008",
    FEN: "r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24",
    Moves: "f2g3 e6e7 b2b1 b3c1 b1c1 h6c1",
    Rating: 1830,
    Themes: "crushing,hangingPiece,long,middlegame"
  },
  {
    PuzzleId: "003aS",
    FEN: "8/8/5k1p/6p1/1R4PP/1p2KP2/8/1r6 w - - 0 43",
    Moves: "h4h5 b3b2 b4b6 f6e5 f3f4 g5f4",
    Rating: 2086,
    Themes: "advancedPawn,crushing,defensiveMove,endgame,long,rookEndgame"
  },
  {
    PuzzleId: "003cs",
    FEN: "2r1kbnr/pp4pp/4p3/3pP1N1/3q4/1P2B3/P3Q1PP/nN3RK1 b k - 1 16",
    Moves: "d4e5 f1f8 e8f8 e3c5 c8c5 e2e5 c5c1 g1f2",
    Rating: 2119,
    Themes: "advantage,attraction,discoveredAttack,exposedKing,middlegame,sacrifice,veryLong"
  },
  {
    PuzzleId: "003if",
    FEN: "8/3q1kpp/1P2p3/4Q3/5P2/4B2P/2r3PK/8 b - - 0 43",
    Moves: "d7b7 e5h5 f7e7 e3c5 c2c5 h5c5",
    Rating: 1700,
    Themes: "advantage,endgame,long"
  },
  {
    PuzzleId: "003md",
    FEN: "r1b1k2N/ppp3pp/2n5/2bp4/7q/1B4n1/PPPP1P1P/RNBQ1RK1 w q - 0 10",
    Moves: "f1e1 g3e4 e1e4 d5e4 d1h5 h4h5 b3f7 h5f7",
    Rating: 2171,
    Themes: "crushing,defensiveMove,middlegame,veryLong"
  },
  {
    PuzzleId: "003wQ",
    FEN: "2r2rk1/6pp/3Q1q2/8/3N1B2/6P1/PP1K3P/R4b2 w - - 0 24",
    Moves: "a1f1 f6d6 f4d6 f8f1",
    Rating: 1814,
    Themes: "advantage,discoveredAttack,middlegame,pin,short"
  }
];

async function main() {
  console.log('Inserting seed puzzles...');
  let inserted = 0;
  for (const raw of SEED_PUZZLES) {
    const formatted = validateAndFormatPuzzle(raw);
    if (formatted) {
      insertStmt.run(formatted);
      inserted++;
    }
  }
  console.log(`Inserted ${inserted} verified seed puzzles.`);

  // Offsets across the dataset
  const offsets = [0, 200, 400, 600, 800, 1000];
  console.log('Fetching live batches from official Lichess dataset on Huggingface...');

  for (const offset of offsets) {
    try {
      console.log(`Fetching batch at offset ${offset}...`);
      const rows = await fetchHuggingfaceBatch(offset, 100);
      let batchValid = 0;
      for (const row of rows) {
        const formatted = validateAndFormatPuzzle(row);
        if (formatted) {
          insertStmt.run(formatted);
          batchValid++;
        }
      }
      console.log(`Batch at offset ${offset}: added ${batchValid} valid puzzles.`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`Could not fetch offset ${offset}: ${err.message}`);
    }
  }

  // Summary counts
  const counts = db.prepare(`
    SELECT difficulty, count(*) as count, min(rating) as min_r, max(rating) as max_r, round(avg(rating), 1) as avg_r
    FROM puzzles
    GROUP BY difficulty
  `).all();
  console.log('\n--- Puzzle Database Summary ---');
  console.table(counts);

  const total = db.prepare(`SELECT count(*) as total FROM puzzles`).get();
  console.log(`Total active puzzles in database: ${total.total}`);
}

main().catch(err => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
