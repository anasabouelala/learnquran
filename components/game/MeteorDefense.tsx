import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Bomb, CheckCircle2 } from 'lucide-react';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
}

interface Meteor {
  id: string;
  word: string;
  left: number; // percentage 0-80
  delay: number;
  duration: number;
  isCorrect: boolean;
}

export const MeteorDefense: React.FC<Props> = ({ question, onAnswer }) => {
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [exploded, setExploded] = useState<string | null>(null);
  
  // Use a ref to track exploded state in callbacks to avoid stale closures
  const explodedRef = useRef<string | null>(null);

  useEffect(() => {
    explodedRef.current = exploded;
  }, [exploded]);

  useEffect(() => {
    // Initialize meteors with random positions and speeds
    const options = question.options || [];
    const newMeteors = options.map((word, idx) => ({
      id: `meteor-${idx}-${Math.random()}`, // Unique ID for key
      word,
      left: 5 + Math.random() * 75, // Keep within bounds (5% to 80%)
      delay: idx * 1.5, // Stagger spawns more clearly
      duration: 5 + Math.random() * 3, // Slower fall speed for better playability
      isCorrect: word === question.correctAnswer
    }));
    setMeteors(newMeteors);
    setExploded(null);
    explodedRef.current = null;
  }, [question]);

  const handleTap = (meteor: Meteor) => {
    if (explodedRef.current) return;

    if (meteor.isCorrect) {
      setExploded(meteor.id);
      setTimeout(() => onAnswer(true), 800); 
    } else {
      onAnswer(false);
    }
  };

  const handleAnimationComplete = (meteor: Meteor) => {
    // Only count as miss if it's the correct answer, it finished falling, and wasn't exploded
    if (meteor.isCorrect && explodedRef.current !== meteor.id) {
       onAnswer(false); 
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-slate-700 shadow-inner">
      {/* HUD Prompt Area */}
      <div className="absolute top-4 left-0 w-full z-30 flex flex-col items-center pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-8 py-4 rounded-2xl border-2 border-arcade-cyan shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-bounce-short">
           <h3 className="text-arcade-cyan font-arcade text-xs mb-2 text-center uppercase tracking-widest">{question.prompt}</h3>
           <div className="text-2xl md:text-4xl font-arabic text-white rtl-text leading-loose">
             {question.arabicText}
           </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative z-10 w-full h-full">
        <AnimatePresence>
          {meteors.map((meteor) => (
             (!exploded || exploded === meteor.id) && (
              <motion.div
                key={meteor.id}
                initial={{ y: -150, opacity: 1 }} // Start above screen
                animate={{ 
                  y: exploded === meteor.id ? [null, null] : '120%', // Fall to 120% of container height
                  opacity: 1,
                  scale: exploded === meteor.id ? 1.5 : 1
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  y: { duration: meteor.duration, delay: meteor.delay, ease: "linear" },
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.3 }
                }}
                onAnimationComplete={(definition) => {
                    // Only trigger miss logic if we are animating 'y' (falling)
                    if (typeof definition === 'object' && definition.y) {
                         handleAnimationComplete(meteor);
                    }
                }}
                onClick={() => handleTap(meteor)}
                className="absolute cursor-pointer flex flex-col items-center group z-20 touch-manipulation"
                style={{ left: `${meteor.left}%` }} 
              >
                {/* Meteor Graphic */}
                <div className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 shadow-lg transition-all duration-200
                    ${exploded === meteor.id 
                        ? 'bg-green-500 border-green-300 text-white shadow-[0_0_50px_#22c55e]' 
                        : 'bg-slate-800 border-red-500/50 text-red-500 hover:border-red-400 hover:bg-slate-700'}
                `}>
                    {/* Tail effect */}
                    {!exploded && (
                         <div className="absolute -top-16 w-4 h-24 bg-gradient-to-t from-red-500/50 to-transparent blur-md"></div>
                    )}
                    
                    {exploded === meteor.id ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75"></div>
                            <CheckCircle2 className="w-12 h-12 text-white z-20" />
                        </div>
                    ) : (
                        <Bomb className="w-10 h-10 absolute -top-5 text-orange-500 animate-bounce" />
                    )}

                    <span className={`font-arabic text-2xl md:text-3xl font-bold drop-shadow-md z-10 ${exploded === meteor.id ? 'text-white' : 'text-slate-100'}`}>
                      {meteor.word}
                    </span>
                </div>
              </motion.div>
             )
          ))}
        </AnimatePresence>
      </div>

      {/* City/Shield Base */}
      <div className="relative z-40 h-20 bg-slate-900 border-t-4 border-arcade-purple flex items-center justify-center shadow-[0_-10px_40px_rgba(107,33,168,0.5)]">
         <div className="absolute -top-12 w-full h-12 bg-gradient-to-t from-arcade-purple/30 to-transparent"></div>
         <div className="flex gap-12 items-end pb-2 opacity-80">
            <Shield className="w-10 h-10 text-arcade-cyan fill-cyan-900/50" />
            <Shield className="w-16 h-16 text-arcade-cyan fill-cyan-900/50" />
            <Shield className="w-10 h-10 text-arcade-cyan fill-cyan-900/50" />
         </div>
      </div>
    </div>
  );
};
