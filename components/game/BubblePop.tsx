import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
}

interface Bubble {
  id: string;
  word: string;
  x: number;
  y: number;
  scale: number;
  animationDelay: number;
  floatDuration: number;
}

export const BubblePop: React.FC<Props> = ({ question, onAnswer }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [poppedIds, setPoppedIds] = useState<string[]>([]);
  const [wrongShake, setWrongShake] = useState<string | null>(null);

  // Determine the target list of words
  const targetWords = useMemo(() => {
    if (question.words && question.words.length > 0) return question.words;
    // Fallback: use arabicText or correctAnswer split by spaces
    const text = question.correctAnswer || question.arabicText || "";
    return text.split(' ').filter(w => w.trim().length > 0);
  }, [question]);

  useEffect(() => {
    // Setup bubbles from shuffled words
    const words = [...targetWords].sort(() => Math.random() - 0.5);
    
    const newBubbles = words.map((word, idx) => ({
      id: `bubble-${idx}`,
      word,
      x: Math.random() * 60 + 10, // 10% to 70% screen width to avoid edges
      y: Math.random() * 60 + 20, // 20% to 80% screen height
      scale: 0.9 + Math.random() * 0.2,
      animationDelay: Math.random() * 2,
      floatDuration: 6 + Math.random() * 4
    }));
    setBubbles(newBubbles);
    setNextIndex(0);
    setPoppedIds([]);
  }, [targetWords]);

  const handlePop = (bubble: Bubble) => {
    const expectedWord = targetWords[nextIndex];

    if (bubble.word === expectedWord) {
      // Correct pop
      setPoppedIds(prev => [...prev, bubble.id]);
      const newNext = nextIndex + 1;
      setNextIndex(newNext);

      if (newNext === targetWords.length) {
        setTimeout(() => onAnswer(true), 500);
      }
    } else {
      // Wrong pop
      setWrongShake(bubble.id);
      setTimeout(() => setWrongShake(null), 500);
      onAnswer(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] flex flex-col items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)] border-2 border-slate-700 shadow-2xl">
      
      {/* Background Particles */}
      <div className="absolute inset-0 opacity-30 pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
            <div 
                key={i}
                className="absolute bg-arcade-cyan rounded-full w-1 h-1 shadow-[0_0_5px_cyan]"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animation: `pulse ${2 + Math.random()}s infinite`
                }}
            />
        ))}
      </div>

      <div className="absolute top-6 z-20 bg-slate-900/80 px-8 py-3 rounded-full border border-arcade-yellow backdrop-blur-md shadow-lg pointer-events-none">
         <h3 className="text-arcade-yellow font-arcade text-sm tracking-widest uppercase">{question.prompt}</h3>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-6 z-20 flex flex-wrap justify-center gap-2 rtl-text px-4 pointer-events-none">
         {targetWords.map((word, idx) => (
             <div 
                key={idx} 
                className={`px-4 py-2 rounded-lg text-lg font-arabic transition-all duration-300 border-2
                    ${idx < nextIndex 
                        ? 'bg-arcade-cyan border-cyan-400 text-slate-900 scale-110 shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
                        : 'bg-slate-800/80 border-slate-600 text-slate-500'}
                `}
             >
                 {word}
             </div>
         ))}
      </div>

      {/* Bubbles */}
      <div className="absolute inset-0 z-10">
         <AnimatePresence>
            {bubbles.map((bubble) => (
               !poppedIds.includes(bubble.id) && (
                   <motion.button
                      key={bubble.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                          scale: bubble.scale, 
                          opacity: 1,
                          x: [0, 25, -25, 0], // Float drift
                          y: [0, -35, 25, 0],
                      }}
                      exit={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
                      transition={{
                        scale: { duration: 0.5 },
                        x: { duration: bubble.floatDuration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                        y: { duration: bubble.floatDuration * 1.3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                      }}
                      className={`absolute w-28 h-28 rounded-full flex items-center justify-center 
                        border-2 backdrop-blur-md shadow-xl
                        hover:scale-110 active:scale-95 transition-transform cursor-pointer touch-manipulation
                        ${wrongShake === bubble.id 
                            ? 'animate-shake border-red-500 bg-red-500/40 text-red-100' 
                            : 'bg-slate-700/60 border-white/30 text-white hover:bg-slate-600/80 hover:border-white/60'}
                      `}
                      style={{
                          left: `${bubble.x}%`,
                          top: `${bubble.y}%`,
                      }}
                      onClick={() => handlePop(bubble)}
                   >
                      {/* Highlight */}
                      <div className="absolute top-4 left-5 w-6 h-3 bg-white/30 rounded-full rotate-45 blur-[2px]"></div>
                      
                      <span className="font-arabic text-2xl font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] select-none pointer-events-none">
                          {bubble.word}
                      </span>
                   </motion.button>
               )
            ))}
         </AnimatePresence>
      </div>
    </div>
  );
};