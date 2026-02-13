import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Trophy, Zap } from 'lucide-react';
import { Question } from '../../types';
import { ArcadeButton } from '../ui/ArcadeButton';

interface Props {
  surahName: string;
  question: Question;
  onGameEnd: (victory: boolean) => void;
}

interface StackBlock {
  id: string;
  word: string;
  width: number;
  left: number;
  top: number;
  colorIndex: number;
  isPerfect: boolean;
}

interface Debris {
  id: string;
  width: number;
  left: number;
  top: number;
}

const BLOCK_HEIGHT = 60;
const CONTAINER_HEIGHT = 600;
const INITIAL_SPEED = 40; // % per second
const SPEED_INCREMENT = 5;
const MAX_SPEED = 120;
const PERFECT_TOLERANCE = 2;

const COLORS = [
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-rose-500',
  'bg-orange-500',
];

export const QuranStackGame: React.FC<Props> = ({ surahName, question, onGameEnd }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER' | 'VICTORY'>('START');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(0);
  const [stack, setStack] = useState<StackBlock[]>([]);
  const [debris, setDebris] = useState<Debris[]>([]);
  const [activeWord, setActiveWord] = useState('');
  const [activeWidth, setActiveWidth] = useState(60);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string, color: string, id: number } | null>(null);

  // Physics refs (no re-renders during movement)
  const physicsRef = useRef({
    left: 0,
    direction: 1,
    speed: INITIAL_SPEED,
    isMoving: false
  });

  const activeBlockRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const wordsRef = useRef<string[]>([]);
  const wordIndexRef = useRef(0);

  // Extract words from question
  // Helper to merge small words
  const optimizeWordChunks = (words: string[]): string[] => {
    if (words.length <= 1) return words;

    const merged: string[] = [];
    let buffer = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.length <= 2) {
        buffer = buffer ? `${buffer} ${word}` : word;
      } else {
        if (buffer) {
          merged.push(`${buffer} ${word}`);
          buffer = "";
        } else {
          merged.push(word);
        }
      }
    }
    if (buffer) {
      if (merged.length > 0) {
        merged[merged.length - 1] = `${merged[merged.length - 1]} ${buffer}`;
      } else {
        merged.push(buffer);
      }
    }
    return merged;
  };

  // Extract words and handle continuous play
  useEffect(() => {
    let newWords: string[] = [];
    if (question.stackData?.words) {
      newWords = question.stackData.words;
    } else {
      newWords = question.arabicText.split(' ').filter(w => w.length > 0);
    }

    // Optimize chunks (merge small words)
    newWords = optimizeWordChunks(newWords);

    wordsRef.current = newWords;

    // If game is already playing (this is a new verse in continuous mode)
    if (gameState === 'PLAYING') {
      wordIndexRef.current = 0;

      // Get width of top block to continue smoothly
      const lastBlock = stack[stack.length - 1];
      const nextWidth = lastBlock ? lastBlock.width : 60;

      // Start spawning new words immediately on top of existing stack
      spawnNextBlock(nextWidth, 0);
    }
  }, [question]);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setCombo(0);
    setLevel(0);
    setDebris([]);
    wordIndexRef.current = 0;

    // Start with empty stack - First word is the foundation
    setStack([]);

    // Spawn first word as active block to oscillate
    spawnNextBlock(60, 0); // Start with 60% width

    // Start animation
    lastTimeRef.current = performance.now();
    physicsRef.current.isMoving = true;
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const spawnNextBlock = (width: number, index: number) => {
    if (index >= wordsRef.current.length) {
      // Verse Completed
      handleVictory(); // This triggers GameScreen to load next question
      return;
    }

    const word = wordsRef.current[index];
    const colorIndex = index % COLORS.length;
    const speed = Math.min(INITIAL_SPEED + (index * SPEED_INCREMENT), MAX_SPEED);

    // Random start position (left or right)
    const startLeft = Math.random() > 0.5 ? 0 : (100 - width);

    physicsRef.current.left = startLeft;
    physicsRef.current.direction = startLeft === 0 ? 1 : -1;
    physicsRef.current.speed = speed;

    setActiveWord(word);
    setActiveWidth(width);
    setActiveColorIndex(colorIndex);
    setLevel(index);
    wordIndexRef.current = index;
  };

  const gameLoop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    if (physicsRef.current.isMoving && activeBlockRef.current) {
      const { left, direction, speed } = physicsRef.current;
      let newLeft = left + (speed * direction * delta);
      const maxLeft = 100 - activeWidth;

      // Bounce at edges
      if (newLeft <= 0) {
        newLeft = 0;
        physicsRef.current.direction = 1;
      } else if (newLeft >= maxLeft) {
        newLeft = maxLeft;
        physicsRef.current.direction = -1;
      }

      physicsRef.current.left = newLeft;
      activeBlockRef.current.style.left = `${newLeft}%`;
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handleTap = () => {
    if (gameState !== 'PLAYING' || !activeWord) return;

    physicsRef.current.isMoving = false;

    const currentLeft = physicsRef.current.left;
    const currentWidth = activeWidth;
    const currentRight = currentLeft + currentWidth;

    let prevBlock = stack[stack.length - 1];
    let prevLeft = 0;
    let prevRight = 0;
    let prevWidth = 0;
    let targetTop = 0;

    if (!prevBlock) {
      // First Block Placement Logic
      // Treated as foundation: 
      // - Overlap check against virtual floor (or just accepted if within bounds?)
      // - Let's say it always succeeds if it's on screen, establishing the base.
      // - Or let's make it match against a "Virtual Base" of 100% width or specific width?
      // User said "1st word should be at bottom... fix movement in place".
      // Let's assume it establishes the column.

      prevLeft = 0; // Virtual floor 0
      prevRight = 100; // Virtual floor 100
      prevWidth = 100;
      targetTop = CONTAINER_HEIGHT; // Place at bottom
    } else {
      prevLeft = prevBlock.left;
      prevRight = prevBlock.left + prevBlock.width;
      prevWidth = prevBlock.width;
      targetTop = prevBlock.top;
    }

    // Calculate overlap
    const overlapLeft = Math.max(currentLeft, prevLeft);
    const overlapRight = Math.min(currentRight, prevRight);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 0) {
      // Complete miss
      showFeedback('خطأ!', 'text-red-500');
      setTimeout(() => handleGameOver(), 500);
      return;
    }

    // Check for perfect match
    const diff = Math.abs(currentLeft - prevLeft);
    const isPerfect = diff < PERFECT_TOLERANCE;

    let finalWidth = overlapWidth;
    let finalLeft = overlapLeft;

    if (isPerfect) {
      setCombo(c => c + 1);
      showFeedback(combo > 0 ? `مثالي! x${combo + 1}` : 'مثالي!', 'text-yellow-400');
      finalWidth = prevBlock.width;
      finalLeft = prevBlock.left;
    } else {
      setCombo(0);

      // Create debris for overhangs
      if (currentLeft < prevLeft) {
        const debrisWidth = prevLeft - currentLeft;
        addDebris(currentLeft, debrisWidth, prevBlock.top - BLOCK_HEIGHT);
      }
      if (currentRight > prevRight) {
        const debrisWidth = currentRight - prevRight;
        addDebris(prevRight, debrisWidth, prevBlock.top - BLOCK_HEIGHT);
      }
    }

    // Add new block to stack
    const newBlock: StackBlock = {
      id: `block-${Date.now()}-${wordIndexRef.current}`,
      word: activeWord,
      width: finalWidth,
      left: finalLeft,
      top: prevBlock ? (prevBlock.top - BLOCK_HEIGHT) : (CONTAINER_HEIGHT - BLOCK_HEIGHT),
      colorIndex: activeColorIndex,
      isPerfect
    };

    setStack(prev => [...prev, newBlock]);
    setScore(s => s + (isPerfect ? 300 + (combo * 100) : 150));

    // Continue to next block
    physicsRef.current.isMoving = true;
    spawnNextBlock(finalWidth, wordIndexRef.current + 1);
  };

  const addDebris = (left: number, width: number, top: number) => {
    const d: Debris = {
      id: Math.random().toString(),
      left,
      width,
      top
    };
    setDebris(prev => [...prev, d]);
    setTimeout(() => {
      setDebris(prev => prev.filter(item => item.id !== d.id));
    }, 1000);
  };

  const handleGameOver = () => {
    setGameState('GAME_OVER');
    physicsRef.current.isMoving = false;
    cancelAnimationFrame(requestRef.current);
    onGameEnd(false);
  };

  const handleVictory = () => {
    // Keep playing state for continuous transition
    onGameEnd(true);
  };

  const showFeedback = (text: string, color: string) => {
    setFeedback({ text, color, id: Date.now() });
    setTimeout(() => setFeedback(null), 800);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const cameraOffset = Math.max(0, (stack.length - 5) * BLOCK_HEIGHT);

  return (
    <div
      className="fixed inset-0 bg-slate-900 overflow-hidden flex flex-col touch-none select-none"
      onPointerDown={handleTap}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />

      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 z-40 flex justify-between items-start pointer-events-none">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-3xl font-arcade text-white">{score}</span>
          </div>
          {combo > 0 && (
            <div className="text-cyan-400 font-arcade text-sm mt-1">
              مثالي x{combo}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-lg">
          <Zap className="w-4 h-4 text-orange-400" />
          <span className="text-white font-arcade text-sm">المستوى {level + 1}</span>
        </div>

        <div className="bg-slate-800/80 px-4 py-2 rounded-lg">
          <span className="text-slate-200 font-arabic">{surahName}</span>
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.5, y: -80 }}
            exit={{ opacity: 0 }}
            className={`absolute top-1/3 left-1/2 -translate-x-1/2 z-50 font-arcade text-3xl font-bold ${feedback.color} drop-shadow-lg pointer-events-none`}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Container */}
      <div className="relative w-full max-w-md mx-auto flex-1 flex items-center justify-center">
        <div
          className="relative w-full bg-slate-800/30 border-x-2 border-slate-700"
          style={{ height: `${CONTAINER_HEIGHT}px` }}
        >
          <div
            className="absolute inset-0 transition-transform duration-300"
            style={{ transform: `translateY(${cameraOffset}px)` }}
          >
            {/* Stack */}
            {stack.map((block) => (
              <motion.div
                key={block.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`absolute h-[60px] flex items-center justify-center rounded-lg border-b-4 ${block.colorIndex >= 0 ? COLORS[block.colorIndex] : 'bg-slate-700'
                  } ${block.isPerfect ? 'ring-2 ring-white shadow-lg' : ''}`}
                style={{
                  width: `${block.width}%`,
                  left: `${block.left}%`,
                  top: `${block.top}px`
                }}
              >
                <span className="font-arabic text-xl text-white font-bold truncate px-2">
                  {block.word}
                </span>
              </motion.div>
            ))}

            {/* Debris */}
            {debris.map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0.8 }}
                animate={{ y: 400, opacity: 0, rotate: 20 }}
                transition={{ duration: 0.8, ease: 'easeIn' }}
                className="absolute h-[60px] bg-red-500/60 rounded"
                style={{
                  width: `${d.width}%`,
                  left: `${d.left}%`,
                  top: `${d.top}px`
                }}
              />
            ))}

            {/* Active Block */}
            {activeWord && gameState === 'PLAYING' && (
              <div
                ref={activeBlockRef}
                className={`absolute h-[60px] flex items-center justify-center rounded-lg shadow-2xl border-4 border-white ${COLORS[activeColorIndex]
                  }`}
                style={{
                  width: `${activeWidth}%`,
                  left: `${physicsRef.current.left}%`,
                  bottom: `${stack.length * BLOCK_HEIGHT}px`
                }}
              >
                {/* Text Handling for Small Blocks */}
                {activeWidth < 20 ? (
                  // Floating Bubble Style for small blocks
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded shadow-lg whitespace-nowrap z-20">
                    <span className="font-arabic text-xl text-slate-900 font-bold">
                      {activeWord}
                    </span>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-white/90 border-r-[6px] border-r-transparent"></div>
                  </div>
                ) : (
                  // Standard Inside Style
                  <span className="font-arabic text-xl text-white font-bold truncate px-2">
                    {activeWord}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Screen */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-8 backdrop-blur">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border-2 border-emerald-500">
            <Layers className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-5xl font-arcade text-white mb-2">STACKER</h1>
          <h2 className="text-xl font-arabic text-emerald-400 mb-8">برج القرآن</h2>

          <div className="space-y-3 mb-8 text-slate-300 text-sm max-w-xs">
            <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p>المكعبات تتحرك يميناً ويساراً</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <p>اضغط عندما يتطابق المكعب مع السابق!</p>
            </div>
            <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p>الأجزاء الزائدة سيتم قصها</p>
            </div>
          </div>

          <ArcadeButton onClick={startGame} size="lg" className="w-full max-w-xs">
            ابدأ اللعب
          </ArcadeButton>
        </div>
      )}
      {/* Game Over Screen (Internal) */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-8 backdrop-blur">
          <h2 className="text-4xl font-arcade text-red-500 mb-4">سقط البرج!</h2>
          <div className="text-white text-center mb-8">
            <p className="text-xl mb-2">النقاط: {score}</p>
          </div>
          <div className="flex gap-4">
            <ArcadeButton onClick={startGame} variant="primary">
              محاولة أخرى
            </ArcadeButton>
          </div>
        </div>
      )}
    </div>
  );
};
