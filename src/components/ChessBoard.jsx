import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { playMoveSound, playCaptureSound } from '../assets/soundEffects';

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

export default function ChessBoard({
  fen,
  playerColor = 'w',
  lastMoveUci = null,
  onMoveSubmit,
  disabled = false,
  feedbackState = null // 'correct' | 'wrong' | null
}) {
  const [chess, setChess] = useState(() => new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [highlightSquares, setHighlightSquares] = useState([]);
  
  // Track the authoritative pre-move position so we can instantly revert on wrong answer
  const baseFenRef = useRef(fen);
  const baseHighlightRef = useRef([]);

  // Sync internal chess instance when authoritative FEN updates
  useEffect(() => {
    try {
      const c = new Chess(fen);
      setChess(c);
      baseFenRef.current = fen;
      setSelectedSquare(null);
      setLegalMoves([]);
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
        const revertedChess = new Chess(baseFenRef.current);
        setChess(revertedChess);
        setHighlightSquares(baseHighlightRef.current);
        setSelectedSquare(null);
        setLegalMoves([]);
      } catch (e) {
        console.error('Failed to revert chess position:', e);
      }
    }
  }, [feedbackState]);

  const isFlipped = playerColor === 'b';
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];

  function handleSquareClick(square) {
    if (disabled || feedbackState === 'wrong') return;

    const piece = chess.get(square);
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

  function selectPiece(square) {
    setSelectedSquare(square);
    const moves = chess.moves({ square, verbose: true });
    setLegalMoves(moves);
  }

  function attemptMove(from, to) {
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
      const testChess = new Chess(chess.fen());
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

        // Send to server
        if (onMoveSubmit) {
          onMoveSubmit(uci);
        }
      }
    } catch (err) {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }

  // Drag and Drop handlers
  function handleDragStart(e, square) {
    if (disabled || feedbackState === 'wrong' || chess.turn() !== playerColor) {
      e.preventDefault();
      return;
    }
    const piece = chess.get(square);
    if (!piece || piece.color !== playerColor) {
      e.preventDefault();
      return;
    }

    selectPiece(square);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, targetSquare) {
    e.preventDefault();
    const sourceSquare = e.dataTransfer.getData('text/plain');
    if (sourceSquare && sourceSquare !== targetSquare) {
      attemptMove(sourceSquare, targetSquare);
    }
  }

  // Feedback container border animation
  let feedbackClass = '';
  if (feedbackState === 'correct') {
    feedbackClass = 'ring-4 ring-emerald-500 shadow-emerald-500/40 transition-transform scale-[1.01]';
  } else if (feedbackState === 'wrong') {
    feedbackClass = 'ring-4 ring-rose-500 animate-shake';
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] select-none mx-auto">
      {/* Exact Lichess Board Container */}
      <div
        className={`relative w-full aspect-square rounded-lg overflow-hidden shadow-2xl transition-all duration-150 ${feedbackClass}`}
        style={{
          boxShadow: '0 15px 35px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)'
        }}
      >
        <div className="grid grid-rows-8 w-full h-full">
          {ranks.map((rank, rankIdx) => (
            <div key={rank} className="grid grid-cols-8 w-full h-full">
              {files.map((file, fileIdx) => {
                const square = `${file}${rank}`;
                const isLight = (rankIdx + fileIdx) % 2 === 0;
                const piece = chess.get(square);
                const isSelected = selectedSquare === square;
                const isHighlighted = highlightSquares.includes(square);
                const legalMove = legalMoves.find(m => m.to === square);
                const isCapture = legalMove && !!piece;

                // Exact Lichess Blue/Slate Board Palette:
                // Light squares: #dee3e6
                // Dark squares: #8ca2ad
                // Move Highlight Light: #cdd26a
                // Move Highlight Dark: #aaa23a
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
                    onClick={() => handleSquareClick(square)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, square)}
                    className="relative flex items-center justify-center cursor-pointer transition-colors duration-75"
                    style={{ backgroundColor: bgColor }}
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

                    {/* Lichess Style Legal Move Indicator */}
                    {legalMove && !isCapture && (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/20 pointer-events-none" />
                    )}
                    {legalMove && isCapture && (
                      <div className="absolute inset-1 rounded-full border-4 border-slate-900/25 pointer-events-none" />
                    )}

                    {/* Authentic Lichess cburnett Piece SVG */}
                    {piece && (
                      <img
                        src={PIECE_IMAGES[`${piece.color}${piece.type}`]}
                        alt={`${piece.color} ${piece.type}`}
                        draggable={!disabled && feedbackState !== 'wrong' && chess.turn() === playerColor && piece.color === playerColor}
                        onDragStart={(e) => handleDragStart(e, square)}
                        className={`w-[88%] h-[88%] object-contain select-none pointer-events-auto transition-transform ${
                          disabled || feedbackState === 'wrong'
                            ? 'cursor-not-allowed opacity-95'
                            : 'cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
