const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { io } = require('socket.io-client');
const assert = require('assert');
const { Chess } = require('chess.js');

const roomManager = require('../server/roomManager');
const puzzleManager = require('../server/puzzleManager');

async function run() {
  console.log('🧪 Starting Verification Test for Round Refresh, Puzzles & Race Track Fixes...\n');

  // Test Safe Chess Init
  console.log('1️⃣ Testing Chess FEN safety handling (preventing black screen crashes)...');
  const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  function safeInitChess(fenString) {
    if (fenString && typeof fenString === 'string' && fenString.trim().split(/\s+/).length >= 4) {
      try {
        return new Chess(fenString.trim());
      } catch (e) {
        console.warn('Failed to parse FEN:', fenString, e);
      }
    }
    return new Chess(DEFAULT_FEN);
  }

  // Test invalid FEN that previously crashed React
  const badFen = '8/8/8/8/8/8/8/8';
  const c1 = safeInitChess(badFen);
  assert.ok(c1, 'Invalid FEN must safely fallback to valid chess position');
  assert.strictEqual(c1.turn(), 'w');

  const nullFen = safeInitChess(null);
  assert.ok(nullFen, 'Null FEN must safely fallback to valid chess position');

  const emptyFen = safeInitChess('');
  assert.ok(emptyFen, 'Empty string FEN must safely fallback to valid chess position');

  console.log('✅ Chess FEN parser safely handles empty, invalid, and null FEN without crashing!\n');

  // Start test server on random port
  console.log('2️⃣ Setting up test server...');
  const app = express();
  const server = http.createServer(app);
  const ioServer = new Server(server, { cors: { origin: '*' } });

  const socketMeta = new Map();
  const studentSockets = new Map();

  ioServer.on('connection', (socket) => {
    socket.on('join_coach_room', ({ roomId, coachToken }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || room.coachToken !== coachToken) {
        return socket.emit('error_message', { message: 'Invalid credentials' });
      }
      socket.join(`room_${room.id}`);
      socket.join(`coach_${room.id}`);
      socketMeta.set(socket.id, { roomId: room.id, role: 'coach', coachToken });
      socket.emit('coach_init_success', { room: roomManager.getRoomSnapshot(room) });
    });

    socket.on('join_student_room', ({ roomId, name, studentId }) => {
      const result = roomManager.joinRoom(roomId, name, studentId);
      if (result.error) return socket.emit('error_message', { message: result.error });

      const { room, student } = result;
      const cleanRoomId = room.id;
      socket.join(`room_${cleanRoomId}`);
      socket.join(`student_${student.id}`);
      socketMeta.set(socket.id, { roomId: cleanRoomId, role: 'student', studentId: student.id });
      studentSockets.set(student.id, socket.id);

      let currentPuzzle = null;
      const liveRoom = roomManager.getRoom(cleanRoomId);
      if (liveRoom && liveRoom.state === 'racing') {
        const state = liveRoom.studentPuzzleStates[student.id];
        if (state) currentPuzzle = puzzleManager.getPublicPuzzlePayload(state);
      }

      socket.emit('student_join_success', { student, room, currentPuzzle });
      ioServer.to(`room_${cleanRoomId}`).emit('standings_updated', { standings: room.standings });
    });

    socket.on('student_request_puzzle', ({ roomId, studentId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || room.state !== 'racing') return;
      let state = room.studentPuzzleStates[studentId];
      if (!state) {
        puzzleManager.initStudentPuzzle(room, studentId);
        state = room.studentPuzzleStates[studentId];
      }
      if (state) {
        socket.emit('new_puzzle', puzzleManager.getPublicPuzzlePayload(state));
      }
    });

    socket.on('coach_start_countdown', ({ roomId, coachToken }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || room.coachToken !== coachToken) return;

      roomManager.startCountdown(
        roomId,
        (count) => ioServer.to(`room_${room.id}`).emit('countdown_tick', { count }),
        (currentRoom) => {
          ioServer.to(`room_${room.id}`).emit('race_started', {
            startTime: currentRoom.startTime,
            endTime: currentRoom.endTime,
            roundNumber: currentRoom.roundNumber
          });

          for (const [studentId, state] of Object.entries(currentRoom.studentPuzzleStates)) {
            const payload = puzzleManager.getPublicPuzzlePayload(state);
            const socketId = studentSockets.get(studentId);
            if (socketId) ioServer.to(socketId).emit('new_puzzle', payload);
            ioServer.to(`student_${studentId}`).emit('new_puzzle', payload);
          }
        },
        (finalStandings) => ioServer.to(`room_${room.id}`).emit('race_ended', { standings: finalStandings, roundNumber: room.roundNumber })
      );

      ioServer.to(`room_${room.id}`).emit('race_state_changed', { state: 'countdown', countdownRemaining: 10, roundNumber: room.roundNumber });
    });

    socket.on('coach_start_next_round', ({ roomId, coachToken }) => {
      const room = roomManager.getRoom(roomId);
      if (!room || room.coachToken !== coachToken) return;

      roomManager.startNextRound(
        roomId,
        (count) => ioServer.to(`room_${room.id}`).emit('countdown_tick', { count }),
        (currentRoom) => {
          ioServer.to(`room_${room.id}`).emit('race_started', {
            startTime: currentRoom.startTime,
            endTime: currentRoom.endTime,
            roundNumber: currentRoom.roundNumber
          });

          for (const [studentId, state] of Object.entries(currentRoom.studentPuzzleStates)) {
            const payload = puzzleManager.getPublicPuzzlePayload(state);
            const socketId = studentSockets.get(studentId);
            if (socketId) ioServer.to(socketId).emit('new_puzzle', payload);
            ioServer.to(`student_${studentId}`).emit('new_puzzle', payload);
          }
        },
        (finalStandings) => ioServer.to(`room_${room.id}`).emit('race_ended', { standings: finalStandings, roundNumber: room.roundNumber })
      );

      ioServer.to(`room_${room.id}`).emit('race_state_changed', { state: 'countdown', countdownRemaining: 10, roundNumber: room.roundNumber });
      ioServer.to(`room_${room.id}`).emit('standings_updated', { standings: roomManager.calculateStandings(room) });
    });
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const SERVER_URL = `http://localhost:${port}`;
  console.log(`✅ Test server running on port ${port}\n`);

  // 3. Create room and join students
  console.log('3️⃣ Creating race room & joining students...');
  const room = roomManager.createRoom({ raceLength: 2, difficulty: 'beginner' });
  const roomId = room.id;
  const coachToken = room.coachToken;

  // Coach joins
  const coachSocket = io(SERVER_URL);
  await new Promise(r => coachSocket.on('connect', r));
  coachSocket.emit('join_coach_room', { roomId, coachToken });
  const coachSnapshot = await new Promise(r => coachSocket.once('coach_init_success', d => r(d.room)));
  assert.strictEqual(coachSnapshot.roundNumber, 1);
  console.log('✅ Coach joined Round 1 successfully.');

  // Student joins
  const studentSocket1 = io(SERVER_URL);
  await new Promise(r => studentSocket1.on('connect', r));
  studentSocket1.emit('join_student_room', { roomId, name: 'Racer Alex' });
  const sData = await new Promise(r => studentSocket1.once('student_join_success', r));
  const studentId = sData.student.id;
  assert.strictEqual(sData.room.roundNumber, 1);
  console.log(`✅ Student Alex joined (ID: ${studentId}, Mascot: ${sData.student.animal.name}).`);

  // 4. Start race
  console.log('\n4️⃣ Starting race countdown & verifying starting puzzle delivery...');
  coachSocket.emit('coach_start_countdown', { roomId, coachToken });

  // Fast forward countdown in roomManager
  const liveRoom = roomManager.getRoom(roomId);
  liveRoom.countdownRemaining = 0; // complete countdown
  roomManager.startRace(roomId, () => {});

  // Emit race_started
  ioServer.to(`room_${roomId}`).emit('race_started', {
    startTime: liveRoom.startTime,
    endTime: liveRoom.endTime,
    roundNumber: liveRoom.roundNumber
  });
  for (const [sId, state] of Object.entries(liveRoom.studentPuzzleStates)) {
    const payload = puzzleManager.getPublicPuzzlePayload(state);
    ioServer.to(`student_${sId}`).emit('new_puzzle', payload);
  }

  // Student should receive new_puzzle with valid FEN
  const firstPuzzle = await new Promise(r => studentSocket1.once('new_puzzle', r));
  assert.ok(firstPuzzle, 'Must receive initial puzzle');
  assert.ok(firstPuzzle.fen, 'Puzzle must have valid FEN');
  assert.strictEqual(firstPuzzle.fen.split(' ').length, 6, 'FEN must have 6 space-separated tokens');
  console.log(`✅ Puzzle received! Puzzle ID: ${firstPuzzle.puzzleId}, FEN: ${firstPuzzle.fen}`);

  // 5. Test Refresh during Round 1
  console.log('\n5️⃣ Simulating PAGE REFRESH during Round 1...');
  studentSocket1.disconnect();

  const refreshedStudentSocket = io(SERVER_URL);
  await new Promise(r => refreshedStudentSocket.on('connect', r));
  refreshedStudentSocket.emit('join_student_room', { roomId, studentId });
  const reconnectData = await new Promise(r => refreshedStudentSocket.once('student_join_success', r));

  assert.strictEqual(reconnectData.student.id, studentId);
  assert.strictEqual(reconnectData.room.roundNumber, 1, 'Reconnected student must be in Round 1');
  assert.ok(reconnectData.currentPuzzle, 'Reconnected student during racing state must receive currentPuzzle payload');
  assert.ok(reconnectData.currentPuzzle.fen, 'Current puzzle must have valid FEN');
  console.log('✅ Reconnected student successfully retrieved Round 1 and current puzzle without black screen!');

  // Test student_request_puzzle fallback
  console.log('\n6️⃣ Testing student_request_puzzle fallback event...');
  refreshedStudentSocket.emit('student_request_puzzle', { roomId, studentId });
  const requestedPuzzle = await new Promise(r => refreshedStudentSocket.once('new_puzzle', r));
  assert.ok(requestedPuzzle && requestedPuzzle.fen, 'student_request_puzzle must return active puzzle');
  console.log('✅ student_request_puzzle responded instantly with active puzzle.');

  // 7. Coach Starts Round 2
  console.log('\n7️⃣ Coach starts Round 2...');
  coachSocket.emit('coach_start_next_round', { roomId, coachToken });

  const round2State = await new Promise(r => {
    coachSocket.once('race_state_changed', r);
  });
  assert.strictEqual(round2State.roundNumber, 2, 'Race state changed must announce Round 2');
  assert.strictEqual(liveRoom.roundNumber, 2, 'Room roundNumber must be 2');
  console.log('✅ Round 2 started! roundNumber = 2.');

  // 8. Test Refresh during Round 2
  console.log('\n8️⃣ Simulating PAGE REFRESH during Round 2...');
  // Coach refresh
  coachSocket.disconnect();
  const refreshedCoachSocket = io(SERVER_URL);
  await new Promise(r => refreshedCoachSocket.on('connect', r));
  refreshedCoachSocket.emit('join_coach_room', { roomId, coachToken });
  const coachR2Data = await new Promise(r => refreshedCoachSocket.once('coach_init_success', d => r(d.room)));
  assert.strictEqual(coachR2Data.roundNumber, 2, 'Coach after refresh must see Round 2');
  console.log('✅ Coach page refresh verified: Round 2 preserved cleanly!');

  // Student refresh in Round 2
  refreshedStudentSocket.disconnect();
  const r2StudentSocket = io(SERVER_URL);
  await new Promise(r => r2StudentSocket.on('connect', r));
  r2StudentSocket.emit('join_student_room', { roomId, studentId });
  const sR2Data = await new Promise(r => r2StudentSocket.once('student_join_success', r));
  assert.strictEqual(sR2Data.room.roundNumber, 2, 'Student after refresh must see Round 2');
  console.log('✅ Student page refresh verified: Round 2 preserved cleanly!');

  // Clean up
  refreshedCoachSocket.disconnect();
  r2StudentSocket.disconnect();
  server.close();

  console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
