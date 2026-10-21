const { io } = require('socket.io-client');
const assert = require('assert');

const SERVER_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
  console.log('🧪 Starting Animal Puzzle Race End-to-End Tests...\n');

  // Test 1: REST API - Room Creation
  console.log('1️⃣ Testing Room Creation REST endpoint...');
  const res = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raceLength: 2, difficulty: 'beginner' })
  });
  const roomData = await res.json();
  assert.strictEqual(roomData.success, true, 'Room creation must succeed');
  assert.ok(roomData.roomId, 'Must have a roomId');
  assert.ok(roomData.coachToken, 'Must have a coachToken');
  assert.strictEqual(roomData.raceLength, 2);
  assert.strictEqual(roomData.difficulty, 'beginner');
  const roomId = roomData.roomId;
  const coachToken = roomData.coachToken;
  console.log(`✅ Room created: ${roomId} (Coach Token: ${coachToken.slice(0, 8)}...)\n`);

  // Test 2: Coach Socket Connection
  console.log('2️⃣ Testing Coach Socket Connection...');
  const coachSocket = io(SERVER_URL);
  await new Promise((resolve) => coachSocket.on('connect', resolve));

  let coachRoomSnapshot = null;
  coachSocket.emit('join_coach_room', { roomId, coachToken });
  await new Promise((resolve) => {
    coachSocket.once('coach_init_success', (data) => {
      coachRoomSnapshot = data.room;
      resolve();
    });
  });
  assert.strictEqual(coachRoomSnapshot.id, roomId);
  console.log('✅ Coach initialized room successfully.\n');

  // Test 3: Multiple Student Joins & Animal Assignment Rules
  console.log('3️⃣ Testing Student Joins & 10-Animal Distribution Rule...');
  const studentSockets = [];
  const joinedStudents = [];

  // Join 12 students to test unique assignment & badge recycling (>10)
  const testNames = ['Alice', 'Bob', 'Alice', '', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];

  for (let i = 0; i < testNames.length; i++) {
    const sSock = io(SERVER_URL);
    await new Promise((res) => sSock.on('connect', res));
    studentSockets.push(sSock);

    sSock.emit('join_student_room', {
      roomId,
      name: testNames[i]
    });

    const studentInfo = await new Promise((res) => {
      sSock.once('student_join_success', (data) => res(data.student));
    });
    joinedStudents.push(studentInfo);
  }

  // Verify unique names
  const studentNames = joinedStudents.map(s => s.name);
  console.log('Joined student names:', studentNames);
  assert.ok(studentNames.includes('Alice 2'), 'Duplicate Alice must be renamed to Alice 2');
  assert.ok(studentNames.some(n => n.startsWith('Guest ')), 'Blank name must receive Guest Animal name');

  // Verify animal distribution: all 10 animals used, 11th and 12th get Badge 2
  const animalIds = joinedStudents.map(s => s.animal.id);
  const uniqueAnimals = new Set(animalIds);
  console.log(`Unique animals used across 12 students: ${uniqueAnimals.size}/10`);
  assert.strictEqual(uniqueAnimals.size, 10, 'All 10 unique animals must be assigned before repeating');

  const badge2Racers = joinedStudents.filter(s => s.animal.badgeLevel === 2);
  assert.strictEqual(badge2Racers.length, 2, 'Exactly 2 students should have badge level 2');
  console.log('✅ Animal distribution & badge recycling verified.\n');

  // Test 4: Coach Starts Race with 10s Countdown
  console.log('4️⃣ Testing 10-Second Synchronized Countdown...');
  let tickCount = 0;
  studentSockets[0].on('countdown_tick', ({ count }) => {
    tickCount++;
  });

  coachSocket.emit('coach_start_countdown', { roomId, coachToken });
  await sleep(1500);
  assert.ok(tickCount >= 1, 'Countdown ticks must be broadcast to students');
  console.log(`✅ Countdown active, received ticks (tested count: ${tickCount}).\n`);

  // Fast forward: Wait for race start or trigger start directly
  console.log('5️⃣ Waiting for race to begin...');
  const raceStartedData = await new Promise((resolve) => {
    studentSockets[0].once('race_started', resolve);
  });
  assert.ok(raceStartedData.startTime, 'Race start time must be provided');
  assert.ok(raceStartedData.endTime, 'Race end time must be provided');
  console.log('✅ Race active! Synchronized timer running.\n');

  // Test 5: Puzzle Delivery & Move Validation
  console.log('6️⃣ Testing Puzzle Delivery & Move Validation...');
  const s0Socket = studentSockets[0];
  const s0 = joinedStudents[0];

  let currentPuzzle = null;
  s0Socket.on('new_puzzle', (p) => {
    currentPuzzle = p;
  });

  // Wait for puzzle if not already delivered
  let waitCount = 0;
  while (!currentPuzzle && waitCount < 10) {
    await sleep(200);
    waitCount++;
  }
  assert.ok(currentPuzzle, 'Student must receive a puzzle');
  console.log(`Student received puzzle: ${currentPuzzle.puzzleId} (${currentPuzzle.playerColor} to move, Rating ${currentPuzzle.rating})`);

  // Test wrong move
  console.log('Testing incorrect move submission...');
  s0Socket.emit('student_submit_move', {
    roomId,
    studentId: s0.id,
    moveUci: 'a1a2' // Clearly illegal/wrong move
  });

  const wrongResult = await new Promise((res) => {
    s0Socket.once('move_result', res);
  });
  assert.strictEqual(wrongResult.correct, false, 'Invalid move must be rejected');
  console.log('✅ Incorrect move properly rejected without points awarded.');

  // Test skip puzzle
  console.log('Testing puzzle skip...');
  s0Socket.emit('student_skip_puzzle', {
    roomId,
    studentId: s0.id
  });
  const skippedPuzzle = await new Promise((res) => {
    s0Socket.once('new_puzzle', res);
  });
  assert.ok(skippedPuzzle, 'Skipping must immediately provide next puzzle');
  console.log(`✅ Puzzle skipped successfully, received next puzzle ${skippedPuzzle.puzzleId}.\n`);

  // Test 6: Coach Adds Time
  console.log('7️⃣ Testing Coach Add Time (+2 mins)...');
  const oldEndTime = raceStartedData.endTime;
  coachSocket.emit('coach_add_time', { roomId, coachToken, minutes: 2 });
  const timeAddedEvent = await new Promise((res) => {
    studentSockets[1].once('time_added', res);
  });
  assert.strictEqual(timeAddedEvent.minutesAdded, 2);
  assert.strictEqual(timeAddedEvent.newEndTime, oldEndTime + 2 * 60 * 1000);
  console.log('✅ Time successfully added to active race.\n');

  // Test 7: Coach Ends Race Early & Podium
  console.log('8️⃣ Testing Coach Ending Race Early & Standings Calculation...');
  coachSocket.emit('coach_end_race', { roomId, coachToken });
  const raceEndedData = await new Promise((res) => {
    studentSockets[2].once('race_ended', res);
  });
  assert.ok(Array.isArray(raceEndedData.standings), 'Must include final standings array');
  assert.strictEqual(raceEndedData.standings.length, 12, 'Must include all 12 joined racers');
  console.log(`✅ Race ended successfully. Top racer: ${raceEndedData.standings[0].name} (${raceEndedData.standings[0].animal.name})\n`);

  // Test 8: Student Toggles Ready & Coach Starts Next Round
  console.log('9️⃣ Testing Next Round Readiness & Membership Preservation...');
  studentSockets[0].emit('student_toggle_ready', { roomId, studentId: s0.id });
  const readinessData = await new Promise((res) => {
    coachSocket.once('readiness_updated', res);
  });
  const s0Updated = readinessData.standings.find(s => s.id === s0.id);
  assert.strictEqual(s0Updated.isReady, true, 'Student readiness must be reflected');
  console.log('✅ Student readiness updated.');

  // Clean up sockets
  coachSocket.disconnect();
  for (const s of studentSockets) {
    s.disconnect();
  }

  console.log('\n🎉 ALL 9 END-TO-END TEST SUITES PASSED FLAWLESSLY! 🎉');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
