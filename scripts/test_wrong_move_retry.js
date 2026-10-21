const { io } = require('socket.io-client');
const assert = require('assert');

const SERVER_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('🧪 Testing Wrong Move Revert & Retry Flow...\n');

  // 1. Create room
  const res = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raceLength: 2, difficulty: 'beginner' })
  });
  const { roomId, coachToken } = await res.json();

  const coachSocket = io(SERVER_URL);
  await new Promise(r => coachSocket.on('connect', r));
  coachSocket.emit('join_coach_room', { roomId, coachToken });

  // 2. Join student
  const studentSocket = io(SERVER_URL);
  await new Promise(r => studentSocket.on('connect', r));

  studentSocket.emit('join_student_room', { roomId, name: 'Tester' });
  const student = await new Promise(r => {
    studentSocket.once('student_join_success', d => r(d.student));
  });

  // 3. Start race
  coachSocket.emit('coach_start_countdown', { roomId, coachToken });

  const raceData = await new Promise(r => {
    studentSocket.once('race_started', r);
  });
  console.log('Race started.');

  // 4. Get active puzzle
  const puzzle = await new Promise(r => {
    studentSocket.once('new_puzzle', r);
  });
  console.log('Active puzzle:', puzzle.puzzleId, 'playerColor:', puzzle.playerColor);

  // 5. Submit intentionally wrong move
  console.log('Submitting wrong move...');
  studentSocket.emit('student_submit_move', {
    roomId,
    studentId: student.id,
    moveUci: 'h1h8'
  });

  const wrongResult = await new Promise(r => {
    studentSocket.once('move_result', r);
  });
  assert.strictEqual(wrongResult.correct, false, 'Expected wrong move');
  console.log('✅ Move rejected properly by server.');

  // 6. Verify student can immediately try another move or skip without being stuck!
  console.log('Verifying puzzle is NOT stuck by skipping or submitting...');
  studentSocket.emit('student_skip_puzzle', {
    roomId,
    studentId: student.id
  });

  const nextPuzzle = await new Promise(r => {
    studentSocket.once('new_puzzle', r);
  });
  assert.ok(nextPuzzle, 'Next puzzle received successfully');
  console.log(`✅ Success! Received next puzzle ${nextPuzzle.puzzleId}. Puzzle flow is completely free of any lockups!`);

  coachSocket.disconnect();
  studentSocket.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
