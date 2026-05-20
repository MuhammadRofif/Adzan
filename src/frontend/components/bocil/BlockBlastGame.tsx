import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BlockShape {
  grid: number[][];
  color: string;
  glowColor: string;
}

const SHAPES: BlockShape[] = [
  { grid: [[1]], color: 'from-rose-400 to-red-500', glowColor: 'rgba(244, 63, 94, 0.4)' }, // 1x1
  { grid: [[1, 1]], color: 'from-cyan-400 to-blue-500', glowColor: 'rgba(6, 182, 212, 0.4)' }, // 1x2
  { grid: [[1], [1]], color: 'from-cyan-400 to-blue-500', glowColor: 'rgba(6, 182, 212, 0.4)' }, // 2x1
  { grid: [[1, 1, 1]], color: 'from-indigo-400 to-purple-500', glowColor: 'rgba(99, 102, 241, 0.4)' }, // 1x3
  { grid: [[1], [1], [1]], color: 'from-indigo-400 to-purple-500', glowColor: 'rgba(99, 102, 241, 0.4)' }, // 3x1
  { grid: [[1, 1], [1, 1]], color: 'from-amber-400 to-orange-500', glowColor: 'rgba(245, 158, 11, 0.4)' }, // 2x2
  { grid: [[1, 0], [1, 1]], color: 'from-emerald-400 to-teal-500', glowColor: 'rgba(16, 185, 129, 0.4)' }, // L 2x2
  { grid: [[0, 1], [1, 1]], color: 'from-emerald-400 to-teal-500', glowColor: 'rgba(16, 185, 129, 0.4)' }, // L-vert 2x2
  { grid: [[1, 1], [1, 0]], color: 'from-emerald-400 to-teal-500', glowColor: 'rgba(16, 185, 129, 0.4)' }, // Corner 2x2
  { grid: [[1, 1], [0, 1]], color: 'from-emerald-400 to-teal-500', glowColor: 'rgba(16, 185, 129, 0.4)' }  // Corner-vert 2x2
];

interface BlockBlastGameProps {
  onTriggerQuiz: () => void;
  onGameOver: () => void;
  activeQuestionIndex: number;
  totalQuestions: number;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export const BlockBlastGame: React.FC<BlockBlastGameProps> = ({
  onTriggerQuiz,
  onGameOver,
  activeQuestionIndex,
  totalQuestions,
  isFullscreen,
  toggleFullscreen
}) => {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array(4).fill(null).map(() => Array(4).fill(null))
  );
  const [currentShapes, setCurrentShapes] = useState<(BlockShape | null)[]>([]);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [splashMsg, setSplashMsg] = useState<string | null>(null);
  const [clearingLines, setClearingLines] = useState<{ rows: number[]; cols: number[] }>({ rows: [], cols: [] });
  const [isBumping, setIsBumping] = useState(false);

  // Drag states
  const [draggedShapeIdx, setDraggedShapeIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragPointerType, setDragPointerType] = useState<string>('mouse');

  const gridRef = useRef<HTMLDivElement>(null);
  const dragOverlayRef = useRef<HTMLDivElement>(null);

  // Generate 3 random shapes
  const generateShapes = () => {
    const next: BlockShape[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * SHAPES.length);
      next.push(SHAPES[idx]);
    }
    setCurrentShapes(next);
    setSelectedShapeIndex(null);
    setDraggedShapeIdx(null);
  };

  // Initialize shapes if empty
  useEffect(() => {
    if (currentShapes.length === 0 || currentShapes.every(s => s === null)) {
      generateShapes();
    }
  }, [currentShapes]);

  // Check if remaining shapes can fit anywhere on the board
  useEffect(() => {
    if (currentShapes.length === 0) return;
    
    const active = currentShapes.map((s, idx) => ({ s, idx })).filter(item => item.s !== null);
    if (active.length === 0) return;

    let anyFits = false;
    for (const { s } of active) {
      if (s && canFitAnywhere(board, s.grid)) {
        anyFits = true;
        break;
      }
    }

    if (!anyFits) {
      // Board is locked! Player loses (Game Over)
      setSplashMsg("Grid Penuh! GAME OVER! 👾");
      setTimeout(() => {
        onGameOver();
      }, 1500);
    }
  }, [board, currentShapes]);

  const showToast = (msg: string) => {
    setSplashMsg(msg);
    setTimeout(() => setSplashMsg(null), 2500);
  };

  const canFitAnywhere = (currBoard: (string | null)[][], shapeGrid: number[][]) => {
    const rows = currBoard.length;
    const cols = currBoard[0].length;
    const sRows = shapeGrid.length;
    const sCols = shapeGrid[0].length;

    for (let r = 0; r <= rows - sRows; r++) {
      for (let c = 0; c <= cols - sCols; c++) {
        let fits = true;
        for (let sr = 0; sr < sRows; sr++) {
          for (let sc = 0; sc < sCols; sc++) {
            if (shapeGrid[sr][sc] === 1 && currBoard[r + sr][c + sc] !== null) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }
        if (fits) return true;
      }
    }
    return false;
  };

  const handlePlacement = (r: number, c: number, shapeIdx: number) => {
    const shape = currentShapes[shapeIdx];
    if (!shape) return;

    const shapeGrid = shape.grid;
    const sRows = shapeGrid.length;
    const sCols = shapeGrid[0].length;

    // Check bounds
    if (r + sRows > 4 || c + sCols > 4) return;

    // Check overlap
    let overlap = false;
    for (let sr = 0; sr < sRows; sr++) {
      for (let sc = 0; sc < sCols; sc++) {
        if (shapeGrid[sr][sc] === 1 && board[r + sr][c + sc] !== null) {
          overlap = true;
          break;
        }
      }
      if (overlap) break;
    }

    if (overlap) return;

    // Trigger bump effect
    setIsBumping(true);
    setTimeout(() => setIsBumping(false), 150);

    // Place the shape!
    let blocksCount = 0;
    const newBoard = board.map(row => [...row]);
    for (let sr = 0; sr < sRows; sr++) {
      for (let sc = 0; sc < sCols; sc++) {
        if (shapeGrid[sr][sc] === 1) {
          newBoard[r + sr][c + sc] = shape.color;
          blocksCount++;
        }
      }
    }
    
    let earnedScore = blocksCount * 10;

    // Mark shape as used
    const newShapes = [...currentShapes];
    newShapes[shapeIdx] = null;
    setCurrentShapes(newShapes);
    setSelectedShapeIndex(null);
    setHoveredCell(null);

    // Check lines completed
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Check rows
    for (let i = 0; i < 4; i++) {
      if (newBoard[i].every(cell => cell !== null)) {
        rowsToClear.push(i);
      }
    }

    // Check columns
    for (let j = 0; j < 4; j++) {
      let isColFull = true;
      for (let i = 0; i < 4; i++) {
        if (newBoard[i][j] === null) {
          isColFull = false;
          break;
        }
      }
      if (isColFull) {
        colsToClear.push(j);
      }
    }

    const linesCount = rowsToClear.length + colsToClear.length;

    if (linesCount > 0) {
      setClearingLines({ rows: rowsToClear, cols: colsToClear });
      
      const newCombo = combo + 1;
      setCombo(newCombo);

      // Check perfect (board completely cleared)
      let isPerfect = true;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const willBeCleared = rowsToClear.includes(i) || colsToClear.includes(j);
          if (newBoard[i][j] !== null && !willBeCleared) {
            isPerfect = false;
            break;
          }
        }
        if (!isPerfect) break;
      }

      setTimeout(() => {
        const clearedBoard = newBoard.map((row, i) =>
          row.map((cell, j) => {
            if (rowsToClear.includes(i) || colsToClear.includes(j)) {
              return null;
            }
            return cell;
          })
        );
        setBoard(clearedBoard);
        setClearingLines({ rows: [], cols: [] });

        if (isPerfect) {
          earnedScore += 1000;
          showToast("✨ PERFECT CLEAR!!! 👑");
          generateShapes();
          setTimeout(() => {
            onTriggerQuiz();
          }, 800);
        }
        
        setScore(prev => prev + earnedScore + (linesCount * 100 * newCombo));
      }, 500);

    } else {
      setCombo(0);
      setBoard(newBoard);
      setScore(prev => prev + earnedScore);
    }
  };

  // Pointer drag event handlers
  const startDrag = (e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    setDraggedShapeIdx(idx);
    setDragPos({ x: e.clientX, y: e.clientY });
    setDragPointerType(e.pointerType);
    
    // Capture the pointer to follow moves globally
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedShapeIdx === null || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const cellWidth = rect.width / 4;
    const cellHeight = rect.height / 4;

    // Apply offset so visual is higher than the finger on touch screens
    const isTouch = dragPointerType === 'touch';
    const offsetY = isTouch ? -60 : -20;

    const targetX = e.clientX;
    const targetY = e.clientY + offsetY;

    if (dragOverlayRef.current) {
      dragOverlayRef.current.style.left = `${targetX}px`;
      dragOverlayRef.current.style.top = `${targetY}px`;
    }

    // Adjust target coordinates so that the shape center aligns with the pointer
    const shape = currentShapes[draggedShapeIdx];
    let adjustX = 0;
    let adjustY = 0;
    if (shape) {
      const sRows = shape.grid.length;
      const sCols = shape.grid[0].length;
      adjustX = (sCols * cellWidth) / 2;
      adjustY = (sRows * cellHeight) / 2;
    }

    const relX = targetX - rect.left - adjustX;
    const relY = targetY - rect.top - adjustY;

    // Math.round provides a much better snapping experience than Math.floor,
    // targeting the closest grid cell center and allowing easy placements.
    const col = Math.round(relX / cellWidth);
    const row = Math.round(relY / cellHeight);

    if (row >= 0 && row < 4 && col >= 0 && col < 4) {
      setHoveredCell(prev => prev && prev.r === row && prev.c === col ? prev : { r: row, c: col });
    } else {
      setHoveredCell(prev => prev === null ? null : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent, idx: number) => {
    if (draggedShapeIdx === null) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (hoveredCell !== null) {
      handlePlacement(hoveredCell.r, hoveredCell.c, draggedShapeIdx);
    }

    setDraggedShapeIdx(null);
    setHoveredCell(null);
  };

  // Click-to-place handlers
  const handleCellClick = (r: number, c: number) => {
    if (selectedShapeIndex !== null) {
      handlePlacement(r, c, selectedShapeIndex);
    }
  };

  // Get status of hover fit
  const getHoverFitStatus = (r: number, c: number) => {
    const activeIdx = draggedShapeIdx !== null ? draggedShapeIdx : selectedShapeIndex;
    if (activeIdx === null || hoveredCell === null) return 'none';
    
    const shape = currentShapes[activeIdx];
    if (!shape) return 'none';

    const shapeGrid = shape.grid;
    const sRows = shapeGrid.length;
    const sCols = shapeGrid[0].length;

    const rDiff = r - hoveredCell.r;
    const cDiff = c - hoveredCell.c;

    if (rDiff >= 0 && rDiff < sRows && cDiff >= 0 && cDiff < sCols) {
      if (shapeGrid[rDiff][cDiff] === 1) {
        const fits = hoveredCell.r + sRows <= 4 && hoveredCell.c + sCols <= 4;
        if (!fits) return 'invalid';

        let overlap = false;
        for (let sr = 0; sr < sRows; sr++) {
          for (let sc = 0; sc < sCols; sc++) {
            if (shapeGrid[sr][sc] === 1) {
              const checkR = hoveredCell.r + sr;
              const checkC = hoveredCell.c + sc;
              if (checkR < 4 && checkC < 4 && board[checkR][checkC] !== null) {
                overlap = true;
                break;
              }
            }
          }
          if (overlap) break;
        }

        return overlap ? 'invalid' : 'valid';
      }
    }
    return 'none';
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center bg-gradient-to-b from-slate-900 to-indigo-950 relative overflow-hidden w-full mx-auto select-none",
        isFullscreen 
          ? "h-full w-full justify-center rounded-none border-none p-4" 
          : "p-3 sm:p-5 rounded-[28px] border-4 border-indigo-500/30 shadow-2xl max-w-lg"
      )}
    >
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 p-2 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-full text-indigo-300 transition-colors backdrop-blur-sm border border-indigo-400/20"
        title={isFullscreen ? "Keluar Fullscreen" : "Main Fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>

      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

      {/* Header Info */}
      <div className="text-center mb-4 relative z-10 w-full pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider mb-2 border border-indigo-400/20">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" /> Mode Block Blast 🎮
        </span>
        <h3 className="text-lg sm:text-xl font-black text-white font-heading tracking-tight leading-snug">
          Seret Block Ke Grid!
        </h3>
        <p className="text-xs text-indigo-200 mt-1 max-w-sm mx-auto opacity-80">
          Tarik block di bawah ke papan kuis. Kosongkan seluruh papan (PERFECT CLEAR) untuk membuka soal! 💥
        </p>
      </div>

      {/* Progress Status Bar */}
      <div className="flex justify-between items-center w-full px-4 py-2 bg-slate-900/80 rounded-2xl border border-white/5 mb-4 relative z-10 text-xs shadow-sm">
        <div className="text-left flex flex-col gap-1">
          <div>
            <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider leading-none font-sans">Membuka Soal</span>
            <span className="font-extrabold text-indigo-300">Soal {activeQuestionIndex + 1} / {totalQuestions}</span>
          </div>
          <div>
            <span className="text-emerald-400 block text-[9px] uppercase font-bold tracking-wider leading-none font-sans">Skor Anda</span>
            <span className="font-black text-emerald-300 text-sm">{score.toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        {combo > 0 && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-black px-3 py-1 rounded-lg animate-bounce flex items-center gap-1 shadow-md shadow-red-950/50">
            🔥 COMBO x{combo}
          </div>
        )}
      </div>

      {/* Toast Overlay */}
      {splashMsg && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center animate-fade-in">
          <div className="text-center p-6 rounded-3xl bg-indigo-950/80 border border-indigo-500/30 max-w-xs scale-105 transition-transform duration-300 shadow-2xl">
            <div className="text-4xl mb-3 animate-bounce">👾</div>
            <h4 className="text-xl font-black text-white leading-tight font-heading drop-shadow-md">{splashMsg}</h4>
          </div>
        </div>
      )}

      {/* 4x4 Block Blast Grid */}
      <div
        ref={gridRef}
        className={cn(
          "relative z-10 p-2 bg-slate-950/50 rounded-2xl border-2 border-indigo-500/20 shadow-inner w-full aspect-square max-w-[320px] mb-5 touch-none transition-transform duration-100",
          isBumping ? "scale-[0.96]" : "scale-100"
        )}
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full">
          {board.map((row, rIdx) =>
            row.map((cellColor, cIdx) => {
              const fitStatus = getHoverFitStatus(rIdx, cIdx);
              const isClearing = clearingLines.rows.includes(rIdx) || clearingLines.cols.includes(cIdx);

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className={cn(
                    'w-full h-full rounded-md border transition-all duration-150 relative overflow-hidden flex items-center justify-center',
                    isClearing
                      ? 'bg-yellow-400 border-yellow-300 scale-95 opacity-50 animate-pulse'
                      : cellColor
                        ? `bg-gradient-to-br ${cellColor} border-white/20 shadow-md`
                        : fitStatus === 'valid'
                          ? 'bg-indigo-500/40 border-indigo-400/50 scale-[1.05]'
                          : fitStatus === 'invalid'
                            ? 'bg-red-500/30 border-red-500/50'
                            : 'bg-slate-900/60 border-slate-800'
                  )}
                  style={{
                    boxShadow: cellColor ? 'inset 0 2px 4px rgba(255, 255, 255, 0.3)' : undefined
                  }}
                >
                  {!cellColor && fitStatus === 'none' && (
                    <div className="w-1.5 h-1.5 bg-slate-800 rounded-full opacity-60" />
                  )}
                  {fitStatus === 'valid' && (
                    <div className="absolute inset-0 bg-white/20 animate-ping rounded-md" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Block Shapes Selection Area */}
      <div className="relative z-10 w-full bg-slate-900/80 rounded-2xl p-3 border border-white/5 shadow-sm">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center mb-3">Tarik Block Ke Papan</p>
        <div className="grid grid-cols-3 gap-3 items-center justify-items-center">
          {currentShapes.map((shape, idx) => {
            if (shape === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/20 rounded-xl border border-dashed border-white/5 flex items-center justify-center opacity-30 text-[10px] font-bold text-gray-500"
                >
                  SUDAH
                </div>
              );
            }

            const isSelected = selectedShapeIndex === idx;
            const isDraggingThis = draggedShapeIdx === idx;

            return (
              <div
                key={`shape-${idx}`}
                onPointerDown={(e) => startDrag(e, idx)}
                onPointerMove={handlePointerMove}
                onPointerUp={(e) => handlePointerUp(e, idx)}
                onClick={() => setSelectedShapeIndex(isSelected ? null : idx)}
                className={cn(
                  'w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 p-1.5 flex items-center justify-center transition-all bg-slate-900/80 hover:bg-slate-800 cursor-grab active:cursor-grabbing touch-none select-none',
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50/20 scale-105 shadow-xl'
                    : 'border-white/5',
                  isDraggingThis ? 'opacity-20' : 'opacity-100'
                )}
                style={{
                  boxShadow: isSelected ? `0 0 20px ${shape.glowColor}` : undefined
                }}
              >
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateRows: `repeat(${shape.grid.length}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${shape.grid[0].length}, minmax(0, 1fr))`
                  }}
                >
                  {shape.grid.map((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={cn(
                          'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] border',
                          val === 1
                            ? `bg-gradient-to-br ${shape.color} border-white/20`
                            : 'bg-transparent border-transparent'
                        )}
                        style={{
                          boxShadow: val === 1 ? 'inset 0 1px 2px rgba(255, 255, 255, 0.3)' : undefined
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Drag Overlay */}
      {draggedShapeIdx !== null && currentShapes[draggedShapeIdx] && createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          <div
            ref={dragOverlayRef}
            className="absolute transition-transform duration-75 ease-out"
            style={{
              left: dragPos.x,
              top: dragPos.y + (dragPointerType === 'touch' ? -60 : -20),
              transform: 'translate(-50%, -50%) scale(1.15)',
            }}
          >
            <div
              className="grid gap-0.5 p-2 bg-slate-900 rounded-xl border border-white/20 shadow-2xl"
              style={{
                gridTemplateRows: `repeat(${currentShapes[draggedShapeIdx]!.grid.length}, minmax(0, 1fr))`,
                gridTemplateColumns: `repeat(${currentShapes[draggedShapeIdx]!.grid[0].length}, minmax(0, 1fr))`
              }}
            >
              {currentShapes[draggedShapeIdx]!.grid.map((row, rIdx) =>
                row.map((val, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={cn(
                      'w-6 h-6 sm:w-8 sm:h-8 rounded-[4px] border',
                      val === 1
                        ? `bg-gradient-to-br ${currentShapes[draggedShapeIdx]!.color} border-white/20`
                        : 'bg-transparent border-transparent'
                    )}
                    style={{
                      boxShadow: val === 1 ? 'inset 0 1px 2px rgba(255, 255, 255, 0.3)' : undefined
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>,
        document.fullscreenElement || document.body
      )}
    </div>
  );
};
