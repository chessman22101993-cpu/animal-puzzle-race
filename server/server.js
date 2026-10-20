const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const roomManager = require('./roomManager');
const puzzleManager = require('./puzzleManager');
const { getPuzzleById } = require('./db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Serve static build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// REST Endpoints
app.post('/api/rooms', (req, res) => {
  try {
    const { raceLength, difficulty } = req.body || {};
    const room = roomManager.createRoom({ raceLength, difficulty });
    res.json({
      success: true,
      roomId: room.id,
      coachToken: room.coachToken,
      raceLength: room.raceLength,
      difficulty: room.difficulty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found or expired' });
  }
  res.json({
    success: true,
    room: roomManager.getRoomSnapshot(room)
  });
});

app.get('/api/rooms/:roomId/coach-check', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  const token = req.query.token;
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  if (room.coachToken !== token) {
    return res.status(403).json({ error: 'Unauthorized coach token' });
  }
  res.json({ success: true, authorized: true });
});

// Map of socketId -> { roomId, role, studentId, coachToken }
const socketMeta = new Map();
// Map of studentId -> socketId
const studentSockets = new Map();

io.on('connection', (socket) => {
  // COACH: Join room
  socket.on('join_coach_room', ({ roomId, coachToken }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return socket.emit('error_message', { message: 'Room not found or expired' });
    }
    if (room.coachToken !== coachToken) {
      return socket.emit('error_message', { message: 'Invalid coach credentials' });
    }

    socket.join(`room_${room.id}`);
    socket.join(`coach_${room.id}`);
    socketMeta.set(socket.id, { roomId: room.id, role: 'coach', coachToken });

    socket.emit('coach_init_success', {
      room: roomManager.getRoomSnapshot(room)
    });
  });

  // STUDENT: Join or Reconnect
  socket.on('join_student_room', ({ roomId, name, studentId }) => {
    const result = roomManager.joinRoom(roomId, name, studentId);
    if (result.error) {
      return socket.emit('error_message', { message: result.error });
    }

    const { room, student } = result;
    const cleanRoomId = room.id;

    socket.join(`room_${cleanRoomId}`);
    socketMeta.set(socket.id, {
      roomId: cleanRoomId,
      role: 'student',
      studentId: student.id
    });
    studentSockets.set(student.id, socket.id);

    // If race is already running, grab their puzzle payload
    let currentPuzzle = null;
    const liveRoom = roomManager.getRoom(cleanRoomId);
    if (liveRoom && liveRoom.state === 'racing') {
      const state = liveRoom.studentPuzzleStates[student.id];
      if (state) {
        currentPuzzle = puzzleManager.getPublicPuzzlePayload(state);
      }
    }

    socket.emit('student_join_success', {
      student,
      room,
      currentPuzzle
    });

    // Notify coach and others that student joined/updated
    io.to(`room_${cleanRoomId}`).emit('standings_updated', {
      standings: room.standings,
      studentsCount: room.studentsCount
    });
  });

  // COACH: Update settings (raceLength, difficulty)
  socket.on('coach_update_settings', ({ roomId, coachToken, raceLength, difficulty }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.coachToken !== coachToken) return;

    roomManager.updateSettings(roomId, { raceLength, difficulty });
    io.to(`room_${room.id}`).emit('room_settings_updated', {
      raceLength: room.raceLength,
      difficulty: room.difficulty
    });
  });

  // COACH: Start 10-second countdown
  socket.on('coach_start_countdown', ({ roomId, coachToken }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.coachToken !== coachToken) return;

    roomManager.startCountdown(
      roomId,
      (count) => {
        io.to(`room_${room.id}`).emit('countdown_tick', { count });
      },
      (currentRoom) => {
        // Race started immediately when countdown completes!
        io.to(`room_${room.id}`).emit('race_started', {
          startTime: currentRoom.startTime,
          endTime: currentRoom.endTime,
          roundNumber: currentRoom.roundNumber
        });

        // Send each student their starting puzzle
        for (const [studentId, state] of Object.entries(currentRoom.studentPuzzleStates)) {
          const socketId = studentSockets.get(studentId);
          if (socketId) {
            io.to(socketId).emit('new_puzzle', puzzleManager.getPublicPuzzlePayload(state));
          }
        }
      },
      (finalStandings) => {
        io.to(`room_${room.id}`).emit('race_ended', {
          standings: finalStandings,
          roundNumber: room.roundNumber
        });
      }
    );

    // After starting countdown, broadcast state
    io.to(`room_${room.id}`).emit('race_state_changed', {
      state: 'countdown',
      countdownRemaining: 10
    });
  });

  // COACH: Add time during race (+1, +2, +5 mins)
  socket.on('coach_add_time', ({ roomId, coachToken, minutes }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.coachToken !== coachToken) return;

    roomManager.addTime(roomId, Number(minutes), (finalStandings) => {
      io.to(`room_${room.id}`).emit('race_ended', {
        standings: finalStandings,
        roundNumber: room.roundNumber
      });
    });

    io.to(`room_${room.id}`).emit('time_added', {
      minutesAdded: Number(minutes),
      newEndTime: room.endTime
    });
  });

  // COACH: End race early
  socket.on('coach_end_race', ({ roomId, coachToken }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.coachToken !== coachToken) return;

    const finalStandings = roomManager.endRace(roomId, () => {});
    io.to(`room_${room.id}`).emit('race_ended', {
      standings: finalStandings,
      roundNumber: room.roundNumber
    });
  });

  // COACH: Rename student
  socket.on('coach_rename_student', ({ roomId, coachToken, studentId, newName }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.coachToken !== coachToken) return;

    const updatedStudent = roomManager.renameStudent(roomId, studentId, newName);
    if (updatedStudent) {
      const standings = roomManager.calculateStandings(room);
      io.to(`room_${room.id}`).emit('student_renamed', {
        student: updatedStudent,
        standings
      });
    }
  });

  // COACH: Remove student
  socket.on('coach_remove_student', ({ roomId, coachToken, studentId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.coachToken !== coachToken) return;

    const removedStudent = roomManager.removeStudent(roomId, studentId);
    if (removedStudent) {
      const removedSocketId = studentSockets.get(studentId);
      if (removedSocketId) {
        io.to(removedSocketId).emit('student_removed_by_coach', {
          message: 'You have been removed from the race room by the coach.'
        });
      }

      const standings = roomManager.calculateStandings(room);
      io.to(`room_${room.id}`).emit('student_removed', {
        studentId,
        standings
      });
    }
  });

  // COACH: Start next round
  socket.on('coach_start_next_round', ({ roomId, coachToken }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.coachToken !== coachToken) return;

    roomManager.startNextRound(
      roomId,
      (count) => {
        io.to(`room_${room.id}`).emit('countdown_tick', { count });
      },
      (currentRoom) => {
        io.to(`room_${room.id}`).emit('race_started', {
          startTime: currentRoom.startTime,
          endTime: currentRoom.endTime,
          roundNumber: currentRoom.roundNumber
        });

        for (const [studentId, state] of Object.entries(currentRoom.studentPuzzleStates)) {
          const socketId = studentSockets.get(studentId);
          if (socketId) {
            io.to(socketId).emit('new_puzzle', puzzleManager.getPublicPuzzlePayload(state));
          }
        }
      },
      (finalStandings) => {
        io.to(`room_${room.id}`).emit('race_ended', {
          standings: finalStandings,
          roundNumber: room.roundNumber
        });
      }
    );

    io.to(`room_${room.id}`).emit('race_state_changed', {
      state: 'countdown',
      countdownRemaining: 10,
      roundNumber: room.roundNumber
    });
  });

  // STUDENT: Submit move
  socket.on('student_submit_move', ({ roomId, studentId, moveUci }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.state !== 'racing') {
      return socket.emit('move_result', { correct: false, message: 'Race is not active' });
    }

    const student = room.students[studentId];
    if (!student) return;

    student.attempts = (student.attempts || 0) + 1;

    const result = puzzleManager.processMove(room, studentId, moveUci);

    if (!result.correct) {
      student.streak = 0;
      return socket.emit('move_result', {
        correct: false,
        message: result.message
      });
    }

    // Correct move!
    if (result.completed) {
      student.score += 1;
      student.streak = (student.streak || 0) + 1;
      student.cumulativeSolveTimeMs += (result.solveTimeMs || 0);

      socket.emit('move_result', {
        correct: true,
        completed: true,
        score: student.score,
        streak: student.streak,
        nextPuzzle: result.nextPuzzle
      });

      // Broadcast updated standings immediately to coach & students
      const standings = roomManager.calculateStandings(room);
      io.to(`room_${room.id}`).emit('standings_updated', {
        standings,
        lastSolverId: studentId
      });
    } else {
      // Opponent response move returned
      socket.emit('move_result', {
        correct: true,
        completed: false,
        opponentMove: result.opponentMove,
        newFen: result.newFen
      });
    }
  });

  // STUDENT: Skip puzzle
  socket.on('student_skip_puzzle', ({ roomId, studentId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room || room.state !== 'racing') return;

    const student = room.students[studentId];
    if (student) {
      student.streak = 0;
    }

    const nextPuzzle = puzzleManager.skipPuzzle(room, studentId);
    socket.emit('new_puzzle', nextPuzzle);
  });

  // STUDENT: Toggle Ready for next round
  socket.on('student_toggle_ready', ({ roomId, studentId }) => {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const student = roomManager.toggleReady(roomId, studentId);
    if (student) {
      const standings = roomManager.calculateStandings(room);
      io.to(`room_${room.id}`).emit('readiness_updated', {
        standings
      });
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (meta && meta.role === 'student' && meta.studentId) {
      const room = roomManager.getRoom(meta.roomId);
      if (room && room.students[meta.studentId]) {
        room.students[meta.studentId].connected = false;
        io.to(`room_${room.id}`).emit('standings_updated', {
          standings: roomManager.calculateStandings(room)
        });
      }
      studentSockets.delete(meta.studentId);
    }
    socketMeta.delete(socket.id);
  });
});

// Fallback route for SPA client routing (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Animal Puzzle Race</title></head>
          <body style="font-family:sans-serif;text-align:center;padding:50px;">
            <h2>Animal Puzzle Race Backend Active</h2>
            <p>Vite frontend dev server runs at <a href="http://localhost:5173">http://localhost:5173</a> or build dist folder.</p>
          </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🐾 Animal Puzzle Race server running on http://localhost:${PORT}`);
});
