import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion } from '../../../shared/types';
import { Button } from './Button';
import { CheckCircle, XCircle, Trophy, FastForward } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ChessPlayer = 'p1' | 'p2' | 'p3' | 'p4';
type PieceType = 'king' | 'pawn';

interface Piece {
  id: string;
  player: ChessPlayer;
  type: PieceType;
  x: number;
  y: number;
}

export const ChessQuizBoard: React.FC<{
  quiz: Quiz;
  participants: Record<ChessPlayer, { name: string, active: boolean }>;
  onFinish: (winner: ChessPlayer | 'draw') => void;
  onClose: () => void;
}> = ({ quiz, participants, onFinish, onClose }) => {
  const BOARD_SIZE = 7;
  const MAX_QUIZ_CYCLES = 3;

  // State
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [turnPlayer, setTurnPlayer] = useState<ChessPlayer>('p1');
  const [eliminated, setEliminated] = useState<ChessPlayer[]>([]);
  
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [validMoves, setValidMoves] = useState<{x: number, y: number}[]>([]);
  
  // Quiz mechanics
  const [quizCycles, setQuizCycles] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<number[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [pendingMove, setPendingMove] = useState<{x: number, y: number} | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);

  const isFreePlay = quizCycles >= MAX_QUIZ_CYCLES;

  // Setup initial board
  useEffect(() => {
    const initial: Piece[] = [];
    if (participants.p1.active) {
      initial.push({ id: 'p1_k', player: 'p1', type: 'king', x: 0, y: 0 });
      initial.push({ id: 'p1_p1', player: 'p1', type: 'pawn', x: 1, y: 0 });
      initial.push({ id: 'p1_p2', player: 'p1', type: 'pawn', x: 0, y: 1 });
    }
    if (participants.p3.active) {
      initial.push({ id: 'p3_k', player: 'p3', type: 'king', x: 6, y: 0 });
      initial.push({ id: 'p3_p1', player: 'p3', type: 'pawn', x: 5, y: 0 });
      initial.push({ id: 'p3_p2', player: 'p3', type: 'pawn', x: 6, y: 1 });
    }
    if (participants.p4.active) {
      initial.push({ id: 'p4_k', player: 'p4', type: 'king', x: 0, y: 6 });
      initial.push({ id: 'p4_p1', player: 'p4', type: 'pawn', x: 1, y: 6 });
      initial.push({ id: 'p4_p2', player: 'p4', type: 'pawn', x: 0, y: 5 });
    }
    if (participants.p2.active) {
      initial.push({ id: 'p2_k', player: 'p2', type: 'king', x: 6, y: 6 });
      initial.push({ id: 'p2_p1', player: 'p2', type: 'pawn', x: 5, y: 6 });
      initial.push({ id: 'p2_p2', player: 'p2', type: 'pawn', x: 6, y: 5 });
    }
    setPieces(initial);

    // Filter unselected players as eliminated
    const inactive: ChessPlayer[] = [];
    (['p1', 'p2', 'p3', 'p4'] as ChessPlayer[]).forEach(p => {
      if (!participants[p].active) inactive.push(p);
    });
    setEliminated(inactive);
  }, []);

  const getNextPlayer = (current: ChessPlayer, elims: ChessPlayer[] = eliminated) => {
    const order: ChessPlayer[] = ['p1', 'p3', 'p2', 'p4'];
    let idx = order.indexOf(current);
    for (let i = 0; i < 4; i++) {
      idx = (idx + 1) % 4;
      if (!elims.includes(order[idx])) return order[idx];
    }
    return current; // Only 1 left
  };

  const getPieceAt = (x: number, y: number) => pieces.find(p => p.x === x && p.y === y);

  const calculateValidMoves = (piece: Piece) => {
    const moves: {x: number, y: number}[] = [];
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // dam-daman (horizontal/vertical)

    dirs.forEach(([dx, dy]) => {
      const nx = piece.x + dx;
      const ny = piece.y + dy;
      
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        const targetPiece = getPieceAt(nx, ny);
        if (!targetPiece || targetPiece.player !== piece.player) {
          moves.push({ x: nx, y: ny });
        }
      }
    });

    setValidMoves(moves);
  };

  const handleCellClick = (x: number, y: number) => {
    if (activeQuestion || quizResult) return; 

    const clickedPiece = getPieceAt(x, y);

    if (clickedPiece && clickedPiece.player === turnPlayer) {
      setSelectedPiece(clickedPiece);
      calculateValidMoves(clickedPiece);
      return;
    }

    if (selectedPiece && validMoves.some(m => m.x === x && m.y === y)) {
      setPendingMove({ x, y });
      
      if (isFreePlay) {
        // Execute immediately
        executeMove(true, { x, y });
      } else {
        // Trigger Quiz
        let available = quiz.questions.filter((_, idx) => !usedQuestions.includes(idx));
        let cycles = quizCycles;
        
        if (available.length === 0) {
          cycles++;
          setQuizCycles(cycles);
          if (cycles >= MAX_QUIZ_CYCLES) {
            // Reached Free Play just now!
            executeMove(true, { x, y });
            return;
          }
          available = quiz.questions;
          setUsedQuestions([]);
        }
        
        const randomIndex = Math.floor(Math.random() * available.length);
        const question = available[randomIndex];
        setActiveQuestion(question);
        setUsedQuestions(prev => [...prev, quiz.questions.indexOf(question)]);
      }
    } else {
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const executeMove = (isCorrect: boolean, moveOpt?: {x: number, y: number}) => {
    if (!isFreePlay) setQuizResult(isCorrect ? 'correct' : 'wrong');
    const moveTarget = moveOpt || pendingMove;

    setTimeout(() => {
      let currentEliminated = [...eliminated];
      let newPieces = [...pieces];

      if (isCorrect && selectedPiece && moveTarget) {
        const targetPiece = getPieceAt(moveTarget.x, moveTarget.y);
        
        if (targetPiece) {
          newPieces = newPieces.filter(p => p.id !== targetPiece.id); // Eat
          if (targetPiece.type === 'king') {
            currentEliminated.push(targetPiece.player);
            // Remove all remaining pawns of that player
            newPieces = newPieces.filter(p => p.player !== targetPiece.player);
            setEliminated(currentEliminated);
          }
        }
        
        newPieces = newPieces.map(p => p.id === selectedPiece.id ? { ...p, x: moveTarget.x, y: moveTarget.y } : p);
        setPieces(newPieces);
      }

      // Check Win Condition
      const activePlayers = ['p1', 'p2', 'p3', 'p4'].filter(p => !currentEliminated.includes(p as ChessPlayer));
      if (activePlayers.length === 1) {
        onFinish(activePlayers[0] as ChessPlayer);
        return;
      } else if (activePlayers.length === 0) {
        onFinish('draw');
        return;
      }

      // Next Turn
      setTurnPlayer(getNextPlayer(turnPlayer, currentEliminated));
      setSelectedPiece(null);
      setValidMoves([]);
      setPendingMove(null);
      setActiveQuestion(null);
      setQuizResult(null);
    }, isFreePlay ? 0 : 2000);
  };

  const getPlayerStyle = (p: ChessPlayer) => {
    switch (p) {
      case 'p1': return { bg: 'bg-rose-500', text: 'text-rose-900', from: 'from-rose-400', to: 'to-rose-600', emoji: '😎' };
      case 'p2': return { bg: 'bg-indigo-500', text: 'text-indigo-900', from: 'from-indigo-400', to: 'to-indigo-600', emoji: '🤩' };
      case 'p3': return { bg: 'bg-emerald-500', text: 'text-emerald-900', from: 'from-emerald-400', to: 'to-emerald-600', emoji: '🤠' };
      case 'p4': return { bg: 'bg-amber-500', text: 'text-amber-900', from: 'from-amber-400', to: 'to-amber-600', emoji: '🥳' };
    }
  };

  const renderQuizOverlay = (targetPlayer: ChessPlayer) => {
    if (!activeQuestion || turnPlayer !== targetPlayer) return null;

    return (
      <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md p-4 flex flex-col items-center justify-center shadow-2xl animate-fade-in border-4 border-primary-500 m-2 rounded-3xl">
        <h3 className="font-bold text-lg mb-4 text-center text-gray-900 font-heading">
          {activeQuestion.text}
        </h3>
        
        {quizResult === null ? (
          <div className="grid grid-cols-1 gap-2 w-full max-w-[200px]">
            {activeQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => executeMove(i === activeQuestion.correctAnswer)}
                className="w-full bg-white border-2 border-primary-200 p-2 rounded-xl font-bold text-primary-700 hover:bg-primary-50 active:scale-95 transition-all text-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center animate-bounce">
            {quizResult === 'correct' ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mb-2" />
                <span className="font-black text-xl text-emerald-600">BENAR!</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <XCircle className="w-16 h-16 text-red-500 mb-2" />
                <span className="font-black text-xl text-red-600">SALAH!</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPlayerQuadrant = (p: ChessPlayer, rotationClass: string) => {
    const style = getPlayerStyle(p);
    const isTurn = turnPlayer === p;
    const isEliminated = eliminated.includes(p);
    
    if (isEliminated) {
      return (
        <div className={cn("flex-1 relative flex items-center justify-center opacity-30 bg-gray-100", rotationClass)}>
           <span className="text-xl font-black text-gray-400">GUGUR</span>
        </div>
      );
    }

    return (
      <div className={cn("flex-1 relative flex flex-col items-center justify-center p-2", rotationClass, style.bg.replace('bg-', 'bg-opacity-10 bg-'))}>
        {renderQuizOverlay(p)}
        <div className={cn("w-12 h-12 rounded-full mx-auto shadow-lg border-2 border-white flex items-center justify-center text-xl transition-all", style.bg, isTurn && "scale-110 ring-4 ring-white animate-pulse")}>
          {style.emoji}
        </div>
        <h2 className={cn("font-black text-sm mt-1 truncate max-w-[100px]", style.text)}>{participants[p].name}</h2>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center font-sans select-none overflow-hidden">
      <div className="relative w-full h-full max-w-[1024px] max-h-[1024px] bg-white flex flex-col md:flex-row">
        
        {/* Mobile Portrait Layout (Stack 4 players + board in center) */}
        {/* For 4 players, a table layout (quadrants) is best. We will use absolute positioning for 4 edges */}
        
        <div className="absolute inset-0 flex flex-col">
          {/* Top Edge (P1) */}
          <div className="h-[20%] w-full">
             {renderPlayerQuadrant('p1', 'rotate-180 w-full h-full')}
          </div>
          
          <div className="flex-1 flex flex-row">
             {/* Left Edge (P4) */}
             <div className="w-[20%] h-full">
                {renderPlayerQuadrant('p4', 'rotate-90 w-full h-full')}
             </div>
             
             {/* Center Board */}
             <div className="flex-1 relative flex items-center justify-center bg-gray-800 p-2 sm:p-4">
                
                {isFreePlay && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 font-black px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-pulse z-20 whitespace-nowrap">
                    <FastForward className="w-5 h-5" />
                    MODE BEBAS! SIKAT!
                  </div>
                )}

                <div className="w-full max-w-[500px] aspect-square bg-gray-900 shadow-2xl p-2 sm:p-3 rounded-2xl border-4 border-gray-700 flex flex-col">
                  <div className="flex-1 grid grid-cols-7 grid-rows-7 gap-0.5 sm:gap-1 bg-gray-800 rounded-xl">
                    {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
                      const x = i % BOARD_SIZE;
                      const y = Math.floor(i / BOARD_SIZE);
                      
                      const isDark = (x + y) % 2 === 1;
                      const isValidMove = validMoves.some(m => m.x === x && m.y === y);
                      const piece = getPieceAt(x, y);
                      const isSelected = selectedPiece?.id === piece?.id;

                      return (
                        <div
                          key={i}
                          onClick={() => handleCellClick(x, y)}
                          className={cn(
                            "relative flex items-center justify-center rounded-sm sm:rounded-md transition-all duration-200 cursor-pointer overflow-hidden",
                            isDark ? 'bg-gray-700' : 'bg-gray-600',
                            isValidMove && !piece && 'bg-emerald-500/50 border-2 border-emerald-400',
                            isValidMove && piece && 'bg-red-500/50 border-2 border-red-400',
                            isSelected && 'ring-2 ring-yellow-400 scale-95 z-10'
                          )}
                        >
                          {isValidMove && !piece && <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-ping" />}

                          {piece && (
                            <div className={cn(
                              "w-[85%] h-[85%] rounded-full shadow-md flex items-center justify-center transition-transform",
                              `bg-gradient-to-br ${getPlayerStyle(piece.player).from} ${getPlayerStyle(piece.player).to} text-white`,
                              piece.type === 'king' && 'border-[3px] border-yellow-300 ring-2 ring-yellow-500/50',
                              isSelected && 'scale-110 shadow-xl'
                            )}>
                              {piece.type === 'king' ? <span className="text-[10px] sm:text-lg">👑</span> : <span className="text-[8px] sm:text-xs font-bold">{piece.player.toUpperCase()}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Close Button overlay */}
                <div className="absolute top-4 right-4 z-50">
                  <Button size="sm" variant="outline" onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full w-10 h-10 p-0 flex items-center justify-center backdrop-blur">
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>

             </div>

             {/* Right Edge (P3) */}
             <div className="w-[20%] h-full">
                {renderPlayerQuadrant('p3', '-rotate-90 w-full h-full')}
             </div>
          </div>

          {/* Bottom Edge (P2) */}
          <div className="h-[20%] w-full">
             {renderPlayerQuadrant('p2', 'w-full h-full')}
          </div>
        </div>

      </div>
    </div>
  );
};
