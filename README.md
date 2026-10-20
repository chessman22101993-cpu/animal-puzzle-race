# 🐾 Animal Puzzle Race

A real-time, responsive multiplayer web app built for chess coaches to run live chess puzzle races with their students.

Inspired by layout principles from tactical puzzle racers (large chessboard, race status sidebar, and live racers along the bottom), **Animal Puzzle Race** features an original wildlife racing theme, vibrant SVG animal avatars, server-synchronized clocks, and an authentic puzzle stream derived directly from official Lichess open database records.

---

## 🚀 Quick Start

### 1. Install & Build
```bash
npm install
npm run build
```

### 2. Start the Server
```bash
npm start
```
The application will be live at: **[http://localhost:3001](http://localhost:3001)**

### 3. Run Automated End-to-End Tests
```bash
node scripts/test_e2e.js
```

---

## 🏆 Core Features & Flow

### 1. Two Distinct Views:
* **Coach Room Dashboard (`/?coach=:roomId` or Home screen)**:
  - Create a room and get an instant shareable student join link (`/?room=:roomId`) with a 1-click copy button.
  - Choose race duration: **2, 5, 10, or 15 minutes**.
  - Choose tactical difficulty: **Beginner (<1200)**, **Intermediate (1200–1600)**, **Advanced (1600+)**, or **Mixed (balanced random sampling)**.
  - Controls:
    - **10-Second Synchronized Countdown**: Triggers an animated `10... 9... 8...` countdown on all coach & student screens simultaneously.
    - **Add Time On-the-Fly**: Add `+1 min`, `+2 min`, or `+5 min` during an active race.
    - **End Race Early**: Freeze scoring and transition immediately to the podium.
    - **Student Management**: Live inline rename and remove/kick controls.
    - **Live Standings Monitor**: Real-time ranking, solve count, accuracy, and cumulative solve time.

* **Student Join & Race (`/?room=:roomId`)**:
  - **Zero friction entry**: Students simply enter a display name (or leave blank to automatically receive a guest name like `Guest Cheetah 42`).
  - No email, password, or account registration required.
  - Automatic collision resolution: If two students enter the same name, a number is appended (e.g., `Alex`, `Alex 2`).
  - **Browser refresh resilience**: Student credentials and session state are persisted in `localStorage`. If a student refreshes their browser or loses connectivity temporarily, they seamlessly reconnect to their active race, score, animal, and puzzle state.

### 2. The 10 Racing Animals & Unique Assignment Rule:
1. **Cheetah** (`cheetah`): Speed King (Gold)
2. **Tiger** (`tiger`): Fierce Striker (Orange)
3. **Lion** (`lion`): Majestic Ruler (Golden Amber)
4. **Horse** (`horse`): Knight Galloper (Chestnut Brown)
5. **Falcon** (`falcon`): Sky Dive (Peregrine Slate Blue)
6. **Zebra** (`zebra`): Turbo Stripes (Neon Cyan)
7. **Wolf** (`wolf`): Pack Hunter (Silver Twilight)
8. **Elephant** (`elephant`): Unstoppable Heavy (Purple-Slate)
9. **Bear** (`bear`): Mighty Crusher (Warm Grizzly Brown)
10. **Ostrich** (`ostrich`): Endurance Sprinter (Rose Pink)

* **Badge Recycling**: No animal is assigned twice until all 10 have been used. When more than 10 students join, animals are recycled with distinctive level badges (`#2 Turbo`, `#3 Nitro`, `#4 Hyper`) and colored halo rings.

### 3. Puzzles and Scoring Engine:
* **Official Lichess Puzzles**:
  - Initial database pre-populated with **608 verified Lichess puzzles** across all rating tiers in SQLite (`data/puzzles.db`).
  - Puzzles are queried and streamed strictly through the backend—students never download a large database file.
  - Each student receives their own independent puzzle stream so no student has to wait for another.
  - **Duplicate Prevention**: The backend maintains `seenPuzzles[studentId]` to guarantee that the same puzzle never repeats for a student in the room.
  - **Lichess Move Sequence Handling**: The displayed position is reached after executing the record's first move (`setup_move` / blunder). The student's solution begins with the second move. If the puzzle continues, the board automatically animates the opponent's reply move, allowing the student to finish the sequence.
  - **Scoring**: Exactly 1 point is awarded only when the complete puzzle sequence is solved. Incorrect moves trigger visual and audio feedback without awarding points. Skipping advances to the next puzzle with 0 points.

### 4. Race End & Next Round:
* When the race clock expires, scoring freezes instantly on the server.
* **Top 3 Olympic Podium**: Gold, Silver, and Bronze celebration with animal avatars, solve counts, and celebratory confetti.
* **Tiebreakers**: Ranked primarily by puzzles solved; ties are automatically broken by the **fastest cumulative solve time**.
* **Rejoin Next Race**: Students click "Rejoin Next Race" to indicate readiness. The coach sees live readiness counts and can start Round 2, 3, etc. All student names, animals, and room memberships are preserved between rounds.

---

## 🛠️ Architecture

* **Backend**: Node.js, Express 5, Socket.IO, `better-sqlite3`, `chess.js`
* **Frontend**: React 19, Vite, Tailwind CSS, Lucide icons, `canvas-confetti`
* **Audio**: Offline Web Audio API synthesizer for zero-latency move snaps, captures, solve chimes, and race fanfares.
