import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { playMoveSound, playCaptureSound } from '../assets/soundEffects';
import { RotateCcw } from 'lucide-react';

const PIECE_IMAGES = {
  wp: '/pieces/wp.svg',
  wn: '/pieces/wn.svg',
  wb: '/pieces/wb.svg',
  wr: '/pieces/wr.svg',
  wq: '/pieces/wq.svg',
  wk: '/pieces/wk.svg',
  bp: '/pieces/bp.svg',
  bn: '/pieces/bn.svg',
  bb: '/pieces/bb.svg',
  br: '/pieces/br.svg',
  bq: '/pieces/bq.svg',
  bk: '/pieces/bk.svg'
};

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function safeInitChess(fenString) {
  if (fenString && typeof fenString === 'string' && fenString.trim().split(/\s+/).length >= 4) {
    try {
      return new Chess(fenString.trim());
    } catch (e) {
      console.warn('Failed to parse FEN in safeInitChess:', fenString, e);
    }
  }
  return new Chess(DEFAULT_FEN);
}

export default function ChessBoard({
  fen,
  playerColor = 'w',
  lastMoveUci = null,
  onMoveSubmit,
  disabled = false,
  feedbackState = null // 'correct' | 'wrong' | null
}) {
  const [chess, setChess] = useState(() => safeInitChess(fen));
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [highlightSquares, setHighlightSquares] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Touch drag tracking for tablets and touch screens
  const touchDragRef = useRef(null);

  // Track the authoritative pre-move position so we can instantly revert on wrong answer or timeout
  const baseFenRef = useRef(fen || DEFAULT_FEN);
  const baseHighlightRef = useRef([]);

  // Sync internal chess instance when authoritative FEN updates
  useEffect(() => {
    if (!fen) return;
    try {
      const c = safeInitChess(fen);
      setChess(c);
      baseFenRef.current = fen;
      setSelectedSquare(null);
      setLegalMoves([]);
      setIsSubmitting(false);
    } catch (e) {
      console.error('Failed to load FEN:', fen, e);
    }
  }, [fen]);

  // Update highlight squares when lastMoveUci changes
  useEffect(() => {
    if (lastMoveUci && lastMoveUci.length >= 4) {
      const from = lastMoveUci.slice(0, 2);
      const to = lastMoveUci.slice(2, 4);
      setHighlightSquares([from, to]);
      baseHighlightRef.current = [from, to];
    } else {
      setHighlightSquares([]);
      baseHighlightRef.current = [];
    }
  }, [lastMoveUci]);

  // When feedbackState becomes 'wrong', REVERT board back to base FEN immediately!
  useEffect(() => {
    if (feedbackState === 'wrong') {
      try {
        const revertedChess = safeInitChess(baseFenRef.current);
        setChess(revertedChess);
        setHighlightSquares(baseHighlightRef.current);
        setSelectedSquare(null);
        setLegalMoves([]);
        setIsSubmitting(false);
      } catch (e) {
        console.error('Failed to revert chess position:', e);
      }
    } else if (feedbackState === 'correct') {
      setIsSubmitting(false);
    }
  }, [feedbackState]);

  // Watchdog: If a move was submitted but no server response after 3.5s, auto-revert
  useEffect(() => {
    if (isSubmitting) {
      const timer = setTimeout(() => {
        try {
          console.warn('Watchdog: No response received for move, auto-reverting board');
          const revertedChess = safeInitChess(baseFenRef.current);
          setChess(revertedChess);
          setHighlightSquares(baseHighlightRef.current);
          setSelectedSquare(null);
          setLegalMoves([]);
          setIsSubmitting(false);
        } catch (e) {}
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isSubmitting]);

  const isFlipped = playerColor === 'b';
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];

  function selectPiece(square) {
    setSelectedSquare(square);
    try {
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves || []);
    } catch (e) {
      setLegalMoves([]);
    }
  }

  function handleSquareClick(square) {
    if (disabled || isSubmitting || feedbackState === 'wrong') return;

    let piece = null;
    try {
      piece = chess.get(square);
    } catch (e) {
      return;
    }

    const isPlayerTurn = chess.turn() === playerColor;

    // If a piece was already selected
    if (selectedSquare) {
      // If clicking the same square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if clicked square is a legal move
      const isLegal = legalMoves.some(m => m.to === square);
      if (isLegal) {
        attemptMove(selectedSquare, square);
        return;
      }

      // If clicking another own piece, switch selection
      if (piece && piece.color === playerColor && isPlayerTurn) {
        selectPiece(square);
        return;
      }

      // Otherwise deselect
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // No piece currently selected: select if own piece on player turn
    if (piece && piece.color === playerColor && isPlayerTurn) {
      selectPiece(square);
    }
  }

  function attemptMove(from, to) {
    if (disabled || isSubmitting) return;

    // Check for pawn promotion (auto-promote to Queen for speed racing)
    const piece = chess.get(from);
    let promotion = undefined;
    if (piece && piece.type === 'p') {
      if ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1')) {
        promotion = 'q';
      }
    }

    const uci = `${from}${to}${promotion || ''}`;

    try {
      const isCapture = !!chess.get(to);
      const testChess = safeInitChess(chess.fen());
      const moveResult = testChess.move({ from, to, promotion });

      if (moveResult) {
        // Sound feedback
        if (isCapture) {
          playCaptureSound();
        } else {
          playMoveSound();
        }

        // Optimistically apply move to board
        setChess(testChess);
        setHighlightSquares([from, to]);
        setSelectedSquare(null);
        setLegalMoves([]);
        setIsSubmitting(true);

        // Send to server
        if (onMoveSubmit) {
          onMoveSubmit(uci);
        }
      }
    } catch (err) {
      setSelectedSquare(null);
      setLegalMoves([]);
      setIsSubmitting(false);
    }
  }

  // Desktop Drag and Drop handlers (HTML5 native)
  function handleDragStart(e, square) {
    if (disabled || isSubmitting || feedbackState === 'wrong' || chess.turn() !== playerColor) {
      e.preventDefault();
      return;
    }
    const piece = chess.get(square);
    if (!piece || piece.color !== playerColor) {
      e.preventDefault();
      return;
    }

    selectPiece(square);
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', square);
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(e, targetSquare) {
    e.preventDefault();
    if (e.dataTransfer) {
      const sourceSquare = e.dataTransfer.getData('text/plain');
      if (sourceSquare && sourceSquare !== targetSquare) {
        attemptMove(sourceSquare, targetSquare);
      }
    }
  }

  // Touch handlers for tablet drag-and-drop
  function handleTouchStart(e, square) {
    if (disabled || isSubmitting || feedbackState === 'wrong') return;
    const piece = chess.get(square);
    if (piece && piece.color === playerColor && chess.turn() === playerColor) {
      const touch = e.touches[0];
      touchDragRef.current = {
        fromSquare: square,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY
      };
      selectPiece(square);
    }
  }

  function handleTouchMove(e) {
    if (!touchDragRef.current) return;
    const touch = e.touches[0];
    touchDragRef.current.currentX = touch.clientX;
    touchDragRef.current.currentY = touch.clientY;
  }

  function handleTouchEnd(e) {
    if (!touchDragRef.current) return;
    const { fromSquare, startX, startY, currentX, currentY } = touchDragRef.current;
    touchDragRef.current = null;

    const dist = Math.hypot(currentX - startX, currentY - startY);
    // If dragged with touch more than 15px, attempt drop move on destination square
    if (dist > 15) {
      const el = document.elementFromPoint(currentX, currentY);
      const targetDiv = el ? el.closest('[data-square]') : null;
      const targetSquare = targetDiv ? targetDiv.getAttribute('data-square') : null;
      if (targetSquare && targetSquare !== fromSquare) {
        attemptMove(fromSquare, targetSquare);
      }
    }
  }

  // Manual board unstick / reset handler
  function handleForceReset() {
    try {
      const revertedChess = safeInitChess(baseFenRef.current);
      setChess(revertedChess);
      setHighlightSquares(baseHighlightRef.current);
      setSelectedSquare(null);
      setLegalMoves([]);
      setIsSubmitting(false);
    } catch (e) {}
  }

  // Feedback container border animation
  let feedbackClass = '';
  if (feedbackState === 'correct') {
    feedbackClass = 'ring-4 ring-emerald-500 shadow-emerald-500/40 transition-transform scale-[1.01]';
  } else if (feedbackState === 'wrong') {
    feedbackClass = 'ring-4 ring-rose-500 animate-shake';
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] select-none mx-auto relative">
      {/* Board Container */}
      <div
        className={`relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl transition-all duration-150 ${feedbackClass}`}
        style={{
          boxShadow: '0 15px 35px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        <div className="grid grid-rows-8 w-full h-full select-none">
          {ranks.map((rank, rankIdx) => (
            <div key={rank} className="grid grid-cols-8 w-full h-full select-none">
              {files.map((file, fileIdx) => {
                const square = `${file}${rank}`;
                const isLight = (rankIdx + fileIdx) % 2 === 0;
                let piece = null;
                try {
                  piece = chess.get(square);
                } catch (e) {}

                const isSelected = selectedSquare === square;
                const isHighlighted = highlightSquares.includes(square);
                const legalMove = legalMoves.find(m => m.to === square);
                const isCapture = legalMove && !!piece;

                // Authentic Lichess Palette
                let bgColor = isLight ? '#dee3e6' : '#8ca2ad';
                if (isHighlighted) {
                  bgColor = isLight ? '#cdd26a' : '#aaa23a';
                }
                if (isSelected) {
                  bgColor = '#7ea5c2';
                }

                return (
                  <div
                    key={square}
                    data-square={square}
                    onClick={() => handleSquareClick(square)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, square)}
                    onTouchStart={(e) => handleTouchStart(e, square)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="relative flex items-center justify-center cursor-pointer transition-colors duration-75 select-none"
                    style={{
                      backgroundColor: bgColor,
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none'
                    }}
                  >
                    {/* Rank Coordinate (Top Right of square on rank column) */}
                    {fileIdx === 7 && (
                      <span
                        className="absolute top-0.5 right-1 text-[11px] font-black leading-none pointer-events-none select-none"
                        style={{ color: isLight ? '#8ca2ad' : '#dee3e6' }}
                      >
                        {rank}
                      </span>
                    )}

                    {/* File Coordinate (Bottom Left of square on bottom rank) */}
                    {rankIdx === 7 && (
                      <span
                        className="absolute bottom-0.5 left-1 text-[11px] font-black leading-none pointer-events-none select-none"
                        style={{ color: isLight ? '#8ca2ad' : '#dee3e6' }}
                      >
                        {file}
                      </span>
                    )}

                    {/* Legal Move Indicator (Tap Target Dot or Capture Ring) */}
                    {legalMove && !isCapture && (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-900/35 pointer-events-none shadow-sm animate-fade-in" />
                    )}
                    {legalMove && isCapture && (
                      <div className="absolute inset-1 rounded-full border-4 border-slate-900/35 pointer-events-none animate-fade-in" />
                    )}

                    {/* Chess Piece SVG - Draggable with native mouse drag */}
                    {piece && (
                      <img
                        src={PIECE_IMAGES[`${piece.color}${piece.type}`]}
                        alt={`${piece.color} ${piece.type}`}
                        draggable={!disabled && !isSubmitting && feedbackState !== 'wrong' && chess.turn() === playerColor && piece.color === playerColor}
                        onDragStart={(e) => handleDragStart(e, square)}
                        className={`w-[88%] h-[88%] object-contain select-none pointer-events-auto transition-transform ${
                          disabled || isSubmitting || feedbackState === 'wrong'
                            ? 'cursor-not-allowed opacity-95'
                            : 'cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95'
                        }`}
                        style={{
                          WebkitTouchCallout: 'none',
                          WebkitUserSelect: 'none'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tablet Sync/Unstick button */}
      <div className="w-full flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Drag or click pieces to move
        </span>
        <button
          onClick={handleForceReset}
          className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors p-1"
          title="Click to reset piece positions if board ever feels stuck"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Board</span>
        </button>
      </div>
    </div>
  );
}
