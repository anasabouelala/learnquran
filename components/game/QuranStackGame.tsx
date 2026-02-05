
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Trophy, Heart, Play, Home, Sparkles } from 'lucide-react';
import { Question } from '../../types';
import { ArcadeButton } from '../ui/ArcadeButton';

interface Props {
  surahName: string;
  question: Question;
  onGameEnd: (victory: boolean) => void;
}

interface Block {
  id: string;
  word: string;
  width: number; // Percentage
  left: number; // Percentage
  colorTheme: BlockTheme;
  isPerfect: boolean;
}

interface BlockTheme {
  bg: string;
  border: string;
  glow: string;
}

interface Debris {
  id: string;
  width: number;
  left: number;
  bottom: number;
  theme: BlockTheme;
}

const BLOCK_HEIGHT = 60; // px
const INITIAL_SPEED = 40; // % per second
const PERFECT_TOLERANCE = 3; // %

const THEMES: BlockTheme[] = [
  { bg: 'bg-emerald-500', border: 'border-emerald-700', glow: 'shadow-emerald-500/50' },
  { bg: 'bg-cyan-500', border: 'border-cyan-700', glow: 'shadow-cyan-500/50' },
  { bg: 'bg-blue-500', border: 'border-blue-700', glow: 'shadow-blue-500/50' },
  { bg: 'bg-indigo-500', border: 'border-indigo-700', glow: 'shadow-indigo-500/50' },
  { bg: 'bg-violet-500', border: 'border-violet-700', glow: 'shadow-violet-500/50' },
  { bg: 'bg-fuchsia-500', border: 'border-fuchsia-700', glow: 'shadow-fuchsia-500/50' },
  { bg: 'bg-rose-500', border: 'border-rose-700', glow: 'shadow-rose-500/50' },
  { bg: 'bg-orange-500', border: 'border-orange-700', glow: 'shadow-orange-500/50' },
];

export const QuranStackGame: React.FC<Props> = ({ surahName, question, onGameEnd }) => {
  // --- STATE ---
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER' | 'VICTORY'>('START');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(1); // One life in stacker usually, but lets keep it generic
  
  // Visual Feedback
  const [feedback, setFeedback] = useState<{text: string, color: string, id: number} | null>(null);

  // Game Data
  const [stack, setStack] = useState<Block[]>([]);
  const [debris, setDebris] = useState<Debris[]>([]);
  
  // Active Block State (React state for rendering the element, Ref for physics)
  const [activeBlock, setActiveBlock] = useState<{word: string, width: number, theme: BlockTheme} | null>(null);
  
  // --- REFS ---
  const physics = useRef({
    left: 0,
    direction: 1, // 1 for right, -1 for left
    speed: INITIAL_SPEED,
    isMoving: false
  });
  
  const activeBlockDomRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const wordsRef = useRef<string[]>([]);
  const wordIndexRef = useRef(0);

  // --- INIT ---
  useEffect(() => {
    // Extract words
    if (question.stackData?.words) {
      wordsRef.current = question.stackData.words;
    } else {
      wordsRef.current = question.arabicText.split(" ").filter(w => w.length > 0);
    }
  }, [question]);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setCombo(0);
    setDebris([]);
    setLives(1);
    wordIndexRef.current = 0;
    
    // Base Block
    const baseWidth = 60;
    const baseLeft = 20;
    const baseBlock: Block = {
      id: 'base',
      word: 'البداية',
      width: baseWidth,
      left: baseLeft,
      colorTheme: { bg: 'bg-slate-700', border: 'border-slate-800', glow: 'shadow-slate-500/20' },
      isPerfect: true
    };
    
    setStack([baseBlock]);
    
    // Spawn First Active Block
    spawnNextBlock(baseWidth, 0);
    
    // Start Loop
    lastTimeRef.current = performance.now();
    physics.current.isMoving = true;
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnNextBlock = (width: number, index: number) => {
    if (index >= wordsRef.current.length) {
      handleVictory();
      return;
    }

    const word = wordsRef.current[index];
    const theme = THEMES[index % THEMES.length];
    
    // Random start side
    const startLeft = Math.random() > 0.5 ? 0 : (100 - width);
    
    physics.current.left = startLeft;
    physics.current.direction = startLeft === 0 ? 1 : -1;
    physics.current.speed = INITIAL_SPEED + (index * 2); // Slight speed increase
    
    setActiveBlock({
      word,
      width,
      theme
    });
    
    wordIndexRef.current = index;
  };

  // --- GAME LOOP ---
  const gameLoop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    if (physics.current.isMoving && activeBlockDomRef.current) {
      let newLeft = physics.current.left + (physics.current.speed * physics.current.direction * delta);
      
      // Bounce Check
      // We need to check if the block hits the edges (0 or 100-width)
      // Since activeBlock state might be stale in closure, we use physics.current left but we assume width hasn't changed during one drop phase
      // To be safe, we can read the width from the DOM or just rely on the spawn width which shouldn't change mid-flight.
      // Let's rely on the physics calculation boundaries.
      
      const currentWidth = parseFloat(activeBlockDomRef.current.style.width) || 60; // Fallback
      const maxLeft = 100 - currentWidth;

      if (newLeft <= 0) {
        newLeft = 0;
        physics.current.direction = 1;
      } else if (newLeft >= maxLeft) {
        newLeft = maxLeft;
        physics.current.direction = -1;
      }

      physics.current.left = newLeft;
      activeBlockDomRef.current.style.left = `${newLeft}%`;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // --- INTERACTION ---
  const handleTap = () => {
    if (gameState !== 'PLAYING' || !activeBlock) return;

    // 1. Get positions
    const currentLeft = physics.current.left;
    const currentWidth = activeBlock.width;
    const currentRight = currentLeft + currentWidth;

    const prevBlock = stack[stack.length - 1];
    const prevLeft = prevBlock.left;
    const prevRight = prevBlock.left + prevBlock.width;

    // 2. Calculate Overlap
    const overlapLeft = Math.max(currentLeft, prevLeft);
    const overlapRight = Math.min(currentRight, prevRight);
    const overlapWidth = overlapRight - overlapLeft;

    // 3. Logic
    if (overlapWidth <= 0) {
      handleGameOver();
      return;
    }

    // Check for Perfect Alignment
    // Delta between centers or lefts? Stacker usually uses left alignment relative to overlap.
    const diff = Math.abs(currentLeft - prevLeft);
    const isPerfect = diff < PERFECT_TOLERANCE;

    let finalWidth = overlapWidth;
    let finalLeft = overlapLeft;

    if (isPerfect) {
      setCombo(c => c + 1);
      showFeedback(combo > 1 ? `COMBO x${combo + 1}` : "PERFECT!", "text-arcade-yellow");
      // Snap to previous block's position and width (restore full width if comboing?)
      // Classic stacker: perfect placement keeps the width. Imperfect shrinks it.
      // Bonus: If combo > 3, maybe grow the block slightly?
      finalLeft = prevLeft;
      finalWidth = prevBlock.width; // Keep previous width (don't shrink due to sub-pixel aliasing)
      
      if (combo > 2 && finalWidth < 50) {
           finalWidth += 2; // Small bonus growth
           finalLeft -= 1; 
      }
    } else {
      setCombo(0);
      // Slice logic
      // Determine debris
      if (currentLeft < prevLeft) {
        // Overhang on left
        const debrisWidth = prevLeft - currentLeft;
        addDebris(currentLeft, debrisWidth, activeBlock.theme);
      } else {
        // Overhang on right
        const debrisWidth = currentRight - prevRight;
        addDebris(prevRight, debrisWidth, activeBlock.theme);
      }
    }

    // Add to stack
    const newBlock: Block = {
      id: `block-${wordIndexRef.current}`,
      word: activeBlock.word,
      width: finalWidth,
      left: finalLeft,
      colorTheme: activeBlock.theme,
      isPerfect
    };

    setStack(prev => [...prev, newBlock]);
    setScore(s => s + (isPerfect ? 200 + (combo * 50) : 100));

    // Next Turn
    spawnNextBlock(finalWidth, wordIndexRef.current + 1);
  };

  const addDebris = (left: number, width: number, theme: BlockTheme) => {
    const d: Debris = {
      id: Math.random().toString(),
      left,
      width,
      bottom: stack.length * BLOCK_HEIGHT,
      theme
    };
    setDebris(prev => [...prev, d]);
    // Cleanup debris after animation
    setTimeout(() => {
        setDebris(prev => prev.filter(item => item.id !== d.id));
    }, 1000);
  };

  const handleGameOver = () => {
    setGameState('GAME_OVER');
    physics.current.isMoving = false;
    cancelAnimationFrame(requestRef.current);
    onGameEnd(false);
  };

  const handleVictory = () => {
    setGameState('VICTORY');
    physics.current.isMoving = false;
    cancelAnimationFrame(requestRef.current);
    onGameEnd(true);
  };

  const showFeedback = (text: string, color: string) => {
    setFeedback({ text, color, id: Date.now() });
    setTimeout(() => setFeedback(null), 800);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // --- RENDER HELPERS ---
  // Camera Logic: Keep the active block area visible
  // We want to see the stack grow. 
  // We apply transform to the container.
  // Move down by 1 BLOCK_HEIGHT for every block added after the 3rd one.
  const cameraOffset = Math.max(0, (stack.length - 3) * BLOCK_HEIGHT);

  return (
    <div 
        className="fixed inset-0 bg-slate-900 overflow-hidden flex flex-col font-sans touch-none select-none"
        onPointerDown={handleTap}
    >
        {/* --- BACKGROUND --- */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0f172a_100%)] z-0"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0 pointer-events-none"></div>

        {/* --- HUD --- */}
        <div className="absolute top-0 left-0 w-full p-6 z-40 flex justify-between items-start pointer-events-none">
            <div>
                 <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-5 h-5 text-arcade-yellow" />
                    <span className="text-3xl font-arcade text-white drop-shadow-md">{score}</span>
                </div>
                {combo > 1 && (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="text-arcade-cyan font-arcade text-sm uppercase tracking-widest"
                    >
                        Combo x{combo}
                    </motion.div>
                )}
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-600 px-4 py-2 rounded-full">
                 <span className="text-slate-200 font-arabic">{surahName}</span>
            </div>
        </div>

        {/* --- FEEDBACK POPUP --- */}
        <AnimatePresence>
            {feedback && (
                <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, scale: 0.5, y: 0 }}
                    animate={{ opacity: 1, scale: 1.5, y: -100 }}
                    exit={{ opacity: 0 }}
                    className={`absolute top-1/3 left-1/2 -translate-x-1/2 z-50 font-arcade text-4xl font-bold ${feedback.color} drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] whitespace-nowrap pointer-events-none`}
                >
                    {feedback.text}
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- GAME CONTAINER --- */}
        <div className="relative w-full max-w-lg mx-auto h-full z-10 perspective-1000">
             
             {/* Scrolling Wrapper */}
             <div 
                className="absolute bottom-0 w-full transition-transform duration-500 ease-out"
                style={{ transform: `translateY(${cameraOffset}px)` }}
             >
                 {/* Stack Blocks */}
                 {stack.map((block, index) => (
                     <motion.div 
                        key={block.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`absolute h-[60px] flex items-center justify-center transition-all
                            ${block.colorTheme.bg} 
                            border-b-[6px] ${block.colorTheme.border}
                            ${block.isPerfect ? `z-20 ring-2 ring-white ${block.colorTheme.glow}` : 'z-10'}
                            rounded-md
                        `}
                        style={{
                            width: `${block.width}%`,
                            left: `${block.left}%`,
                            bottom: `${index * BLOCK_HEIGHT + 40}px` // +40px base margin
                        }}
                     >
                         <span className={`font-arabic text-xl md:text-2xl truncate px-2 ${block.isPerfect ? 'text-white font-bold drop-shadow-md' : 'text-white/90'}`}>
                             {block.word}
                         </span>
                         {block.isPerfect && <Sparkles className="absolute -top-3 -right-3 w-5 h-5 text-yellow-300 animate-spin-slow" />}
                     </motion.div>
                 ))}

                 {/* Debris */}
                 {debris.map((d) => (
                     <div 
                        key={d.id}
                        className={`absolute h-[60px] ${d.theme.bg} opacity-80 rounded-sm animate-[fallDebris_0.8s_ease-in_forwards] border-b-[6px] ${d.theme.border}`}
                        style={{
                            width: `${d.width}%`,
                            left: `${d.left}%`,
                            bottom: `${d.bottom + 40}px`
                        }}
                     />
                 ))}

                 {/* Active Block */}
                 {activeBlock && (
                     <div
                        ref={activeBlockDomRef}
                        className={`absolute h-[60px] flex items-center justify-center rounded-md shadow-2xl z-30
                             bg-white border-b-[6px] border-slate-300
                        `}
                        style={{
                            width: `${activeBlock.width}%`,
                            // left is controlled by loop
                            bottom: `${stack.length * BLOCK_HEIGHT + 40}px`
                        }}
                     >
                         <div className={`absolute inset-0 opacity-20 ${activeBlock.theme.bg}`}></div>
                         <span className="relative z-10 text-slate-900 font-bold font-arabic text-xl md:text-2xl">
                             {activeBlock.word}
                         </span>
                         
                         {/* Guide Lines for Precision */}
                         <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-black/10"></div>
                         <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-black/10"></div>
                     </div>
                 )}

                 {/* Floor */}
                 <div className="absolute bottom-0 w-full h-10 bg-slate-800 border-t-4 border-slate-600"></div>
             </div>
        </div>

        {/* --- START SCREEN OVERLAY --- */}
        {gameState === 'START' && (
            <div className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border-2 border-emerald-500 animate-pulse">
                    <Layers className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-5xl font-arcade text-white mb-2 tracking-wide">STACKER</h1>
                <h2 className="text-xl font-arabic text-emerald-400 mb-8">برج القرآن</h2>
                
                <div className="space-y-4 mb-8 text-slate-300 text-sm max-w-xs mx-auto">
                    <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <p>اضغط لتثبيت المكعب فوق البرج</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <p>التطابق التام يمنحك نقاط مضاعفة</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <p>الأجزاء الزائدة سيتم قصها!</p>
                    </div>
                </div>

                <ArcadeButton onClick={startGame} size="lg" className="w-full max-w-xs animate-bounce-short">
                    ابدأ اللعب
                </ArcadeButton>
            </div>
        )}

        <style>{`
            @keyframes fallDebris {
                0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
                100% { transform: translateY(400px) rotate(15deg); opacity: 0; }
            }
            .animate-spin-slow {
                animation: spin 3s linear infinite;
            }
        `}</style>
    </div>
  );
};
