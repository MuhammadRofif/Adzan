import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export type ChessPlayer = 'p1' | 'p2' | 'p3' | 'p4';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

interface Piece {
  owner: ChessPlayer;
  type: PieceType;
}

interface Pos {
  r: number;
  c: number;
}

type BoardState = (Piece | null)[][];

const PLAYER_COLORS: Record<ChessPlayer, { hex: string; class: string; bg: string }> = {
  p1: { hex: '#f43f5e', class: 'text-rose-500', bg: 'bg-rose-500' }, // Red (Bottom)
  p2: { hex: '#3b82f6', class: 'text-blue-500', bg: 'bg-blue-500' }, // Blue (Left)
  p3: { hex: '#eab308', class: 'text-yellow-500', bg: 'bg-yellow-500' }, // Yellow (Top)
  p4: { hex: '#10b981', class: 'text-emerald-500', bg: 'bg-emerald-500' }, // Green (Right)
};

const PIECE_SYMBOLS: Record<PieceType, string> = {
  pawn: '♟',
  rook: '♜',
  knight: '♞',
  bishop: '♝',
  queen: '♛',
  king: '♚',
};

// Initial setup
const createInitialBoard = (): BoardState => {
  const b: BoardState = Array(14).fill(null).map(() => Array(14).fill(null));

  // Helper to place pieces
  const place = (r: number, c: number, owner: ChessPlayer, type: PieceType) => {
    b[r][c] = { owner, type };
  };

  // P1 (Bottom)
  const p1Back = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as PieceType[];
  for (let i = 0; i < 8; i++) {
    place(13, 3 + i, 'p1', p1Back[i]);
    place(12, 3 + i, 'p1', 'pawn');
  }

  // P2 (Left)
  const p2Back = ['rook', 'knight', 'bishop', 'king', 'queen', 'bishop', 'knight', 'rook'] as PieceType[];
  for (let i = 0; i < 8; i++) {
    place(3 + i, 0, 'p2', p2Back[i]);
    place(3 + i, 1, 'p2', 'pawn');
  }

  // P3 (Top)
  const p3Back = ['rook', 'knight', 'bishop', 'king', 'queen', 'bishop', 'knight', 'rook'] as PieceType[];
  for (let i = 0; i < 8; i++) {
    place(0, 3 + i, 'p3', p3Back[i]);
    place(1, 3 + i, 'p3', 'pawn');
  }

  // P4 (Right)
  const p4Back = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'] as PieceType[];
  for (let i = 0; i < 8; i++) {
    place(3 + i, 13, 'p4', p4Back[i]);
    place(3 + i, 12, 'p4', 'pawn');
  }

  return b;
};

const isInvalidSquare = (r: number, c: number) => {
  if (r < 3 && c < 3) return true;
  if (r < 3 && c > 10) return true;
  if (r > 10 && c < 3) return true;
  if (r > 10 && c > 10) return true;
  return false;
};

const inBounds = (r: number, c: number) => {
  return r >= 0 && r < 14 && c >= 0 && c < 14 && !isInvalidSquare(r, c);
};

export const FourPlayerChessBoard: React.FC<{
  participants: Record<ChessPlayer, { id: string; name: string; active: boolean }>;
  onFinish: (winner: ChessPlayer | 'draw') => void;
  onClose: () => void;
}> = ({ participants, onFinish, onClose }) => {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  
  // Only active participants play
  const activePlayers = useMemo(() => {
    return (['p1', 'p2', 'p3', 'p4'] as ChessPlayer[]).filter(p => participants[p].active);
  }, [participants]);

  const [turnIndex, setTurnIndex] = useState(0);
  const currentTurn = activePlayers[turnIndex];

  const [eliminated, setEliminated] = useState<ChessPlayer[]>([]);
  
  // For zooming and selecting
  const [selectedSquare, setSelectedSquare] = useState<Pos | null>(null);
  const [validMoves, setValidMoves] = useState<Pos[]>([]);

  // Clear eliminated pieces
  useEffect(() => {
    // If a player is eliminated, clear their pieces?
    // In some variants, dead pieces stay as obstacles. We will clear them to keep it fun and clean.
    const newBoard = board.map(row => row.map(cell => {
      if (cell && eliminated.includes(cell.owner)) return null;
      return cell;
    }));
    
    // Check if changed to avoid loop
    const hasChanged = newBoard.some((row, r) => row.some((cell, c) => board[r][c] !== cell));
    if (hasChanged) {
      setBoard(newBoard);
    }
  }, [eliminated, board]);

  const getMoves = (b: BoardState, r: number, c: number): Pos[] => {
    const piece = b[r][c];
    if (!piece) return [];
    
    const moves: Pos[] = [];
    const addIfValid = (nr: number, nc: number, captureOnly = false, moveOnly = false) => {
      if (!inBounds(nr, nc)) return false;
      const target = b[nr][nc];
      if (target) {
        if (!moveOnly && target.owner !== piece.owner) moves.push({ r: nr, c: nc });
        return false; // blocked
      } else {
        if (!captureOnly) moves.push({ r: nr, c: nc });
        return true; // continue sliding
      }
    };

    if (piece.type === 'pawn') {
      let dr = 0, dc = 0;
      if (piece.owner === 'p1') dr = -1;
      else if (piece.owner === 'p2') dc = 1;
      else if (piece.owner === 'p3') dr = 1;
      else if (piece.owner === 'p4') dc = -1;

      // Forward 1
      if (addIfValid(r + dr, c + dc, false, true)) {
        // Double step on first move
        const isFirstMove = 
          (piece.owner === 'p1' && r === 12) ||
          (piece.owner === 'p2' && c === 1) ||
          (piece.owner === 'p3' && r === 1) ||
          (piece.owner === 'p4' && c === 12);
        
        if (isFirstMove) {
          addIfValid(r + dr * 2, c + dc * 2, false, true);
        }
      }

      // Captures
      if (dr !== 0) {
        addIfValid(r + dr, c - 1, true, false);
        addIfValid(r + dr, c + 1, true, false);
      } else {
        addIfValid(r - 1, c + dc, true, false);
        addIfValid(r + 1, c + dc, true, false);
      }
    } else if (piece.type === 'knight') {
      const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of jumps) addIfValid(r + dr, c + dc);
    } else if (piece.type === 'king') {
      const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of dirs) addIfValid(r + dr, c + dc);
    } else {
      const dirs: [number,number][] = [];
      if (piece.type === 'rook' || piece.type === 'queen') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
      if (piece.type === 'bishop' || piece.type === 'queen') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
      
      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (addIfValid(nr, nc)) {
          nr += dr;
          nc += dc;
        }
      }
    }
    
    return moves;
  };

  const handleSquareClick = (r: number, c: number) => {
    if (eliminated.includes(currentTurn)) return;

    // If already selected a piece and clicked a valid move
    if (selectedSquare) {
      const isMove = validMoves.find(m => m.r === r && m.c === c);
      if (isMove) {
        // Execute move
        const newBoard = board.map(row => [...row]);
        const movingPiece = newBoard[selectedSquare.r][selectedSquare.c];
        const targetPiece = newBoard[r][c];
        
        newBoard[r][c] = movingPiece;
        newBoard[selectedSquare.r][selectedSquare.c] = null;
        
        setBoard(newBoard);
        setSelectedSquare(null);
        setValidMoves([]);

        // Check King capture
        if (targetPiece?.type === 'king') {
          const newEliminated = [...eliminated, targetPiece.owner];
          setEliminated(newEliminated);
          
          const remaining = activePlayers.filter(p => !newEliminated.includes(p));
          if (remaining.length === 1) {
            setTimeout(() => onFinish(remaining[0]), 1000);
            return;
          } else if (remaining.length === 0) {
            setTimeout(() => onFinish('draw'), 1000);
            return;
          }
        }

        // Auto pawn promotion to Queen if reaching opposite far edge
        if (movingPiece?.type === 'pawn') {
          const promo = 
            (movingPiece.owner === 'p1' && r === 0) ||
            (movingPiece.owner === 'p2' && c === 13) ||
            (movingPiece.owner === 'p3' && r === 13) ||
            (movingPiece.owner === 'p4' && c === 0);
          if (promo) {
            newBoard[r][c] = { owner: movingPiece.owner, type: 'queen' };
            setBoard([...newBoard]);
          }
        }

        advanceTurn();
        return;
      }
    }

    // Select piece
    const piece = board[r][c];
    if (piece && piece.owner === currentTurn) {
      setSelectedSquare({ r, c });
      setValidMoves(getMoves(board, r, c));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const advanceTurn = () => {
    let nextIdx = (turnIndex + 1) % activePlayers.length;
    // Skip eliminated
    while (eliminated.includes(activePlayers[nextIdx])) {
      nextIdx = (nextIdx + 1) % activePlayers.length;
    }
    setTurnIndex(nextIdx);
  };

  // Zoom Transform Calculation
  // Calculate center of board vs selected square to create a slight zoom effect
  const zoomStyle = useMemo(() => {
    if (!selectedSquare) {
      return {
        transform: `scale(1) translate(0px, 0px)`,
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }
    
    // Board is 14x14. Center is at 7,7.
    const rOffset = (7 - selectedSquare.r) * 10; // Adjust translation weight
    const cOffset = (7 - selectedSquare.c) * 10;
    
    return {
      transform: `scale(1.3) translate(${cOffset}px, ${rOffset}px)`,
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  }, [selectedSquare]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 bg-slate-800/80 backdrop-blur border-b border-slate-700 flex items-center justify-between px-6 shrink-0 relative z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✖ Keluar
          </button>
          <div className="h-6 w-px bg-slate-700" />
          <h2 className="text-white font-bold font-heading">⚔️ BATTLE ROYALE CATUR</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("px-4 py-1.5 rounded-full font-bold text-sm text-white flex items-center gap-2", PLAYER_COLORS[currentTurn].bg)}>
            Giliran: {participants[currentTurn].name}
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
        
        {/* Zoomable Container */}
        <div style={zoomStyle} className="relative will-change-transform origin-center">
          <div 
            className="grid shadow-2xl border-4 border-slate-800 bg-slate-200" 
            style={{ 
              gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(14, minmax(0, 1fr))',
              width: 'calc(min(100vw, 100vh) - 32px)',
              height: 'calc(min(100vw, 100vh) - 32px)'
            }}
          >
            {board.map((row, r) => row.map((cell, c) => {
              const isInvalid = isInvalidSquare(r, c);
              if (isInvalid) {
                return <div key={`${r}-${c}`} className="bg-slate-900 border border-slate-800/50" />;
              }

              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
              const isMove = validMoves.some(m => m.r === r && m.c === c);
              
              let bg = isDark ? 'bg-slate-400' : 'bg-slate-100';
              if (isSelected) bg = 'bg-yellow-300';
              else if (isMove) bg = isDark ? 'bg-emerald-400/80' : 'bg-emerald-300/80';

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className={cn(
                    "relative flex items-center justify-center border-[0.5px] border-black/10 cursor-pointer transition-colors duration-200",
                    bg
                  )}
                >
                  {isMove && !cell && (
                    <div className="absolute w-3 h-3 rounded-full bg-black/20" />
                  )}
                  {isMove && cell && (
                    <div className="absolute inset-0 border-4 border-rose-500 rounded-sm" />
                  )}
                  
                  {cell && (
                    <span 
                      className={cn(
                        "text-[min(6.5vw,6.5vh)] leading-none select-none drop-shadow-md transition-transform duration-300",
                        PLAYER_COLORS[cell.owner].class,
                        isSelected ? "scale-125 -translate-y-1 drop-shadow-xl" : ""
                      )}
                      style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                        filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))'
                      }}
                    >
                      {PIECE_SYMBOLS[cell.type]}
                    </span>
                  )}
                </div>
              );
            }))}
          </div>
        </div>

          {/* Players HUDs (Placed in the empty corners of the 14x14 cross board) */}
          {activePlayers.map(p => {
            const isEliminated = eliminated.includes(p);
            const isTurn = currentTurn === p;
            
            let positionClasses = '';
            // Placement in the 4 corners (approx 10% from edge to be exactly inside the 3x3 empty square)
            if (p === 'p1') positionClasses = 'bottom-[4%] left-[4%]';
            if (p === 'p2') positionClasses = 'top-[4%] left-[4%]';
            if (p === 'p3') positionClasses = 'top-[4%] right-[4%] rotate-180 origin-center';
            if (p === 'p4') positionClasses = 'bottom-[4%] right-[4%]';

            return (
              <div key={p} className={cn("absolute z-30 flex flex-col items-center gap-1 transition-all duration-500", positionClasses, isEliminated ? 'opacity-30 grayscale' : '')}>
                {isTurn && !isEliminated && (
                  <div className="absolute -top-6 bg-white text-slate-900 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full animate-bounce whitespace-nowrap shadow-lg">
                    ✨ GILIRANMU
                  </div>
                )}
                <div className={cn(
                  "px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-2xl border-4 flex items-center gap-2 transition-all duration-300",
                  isTurn && !isEliminated 
                    ? `bg-white scale-[1.3] ring-4 ring-offset-4 ring-offset-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.5)] ${PLAYER_COLORS[p].class.replace('text-', 'ring-')}` 
                    : 'bg-slate-800 text-gray-400 opacity-75 scale-90 border-slate-700',
                  isTurn && !isEliminated ? PLAYER_COLORS[p].bg.replace('bg-', 'border-') : ''
                )}>
                  <span className={cn("shrink-0", isTurn && !isEliminated ? 'animate-pulse' : '')}>
                    {isEliminated ? '☠️' : '👤'}
                  </span>
                  <span className={cn("font-bold text-xs sm:text-sm whitespace-nowrap", isTurn && !isEliminated ? 'text-slate-900' : '')}>
                    {participants[p]?.name}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
