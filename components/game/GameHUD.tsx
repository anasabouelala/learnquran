
import React, { useState } from 'react';
import { Heart, Zap, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  score: number;
  lives: number;
  streak: number;
  timeLeft: number;
  maxTime: number;
}

export const GameHUD: React.FC<Props> = ({ score, lives, streak, timeLeft, maxTime }) => {
  const isFever = streak >= 3;

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 px-2 md:px-4">
      {/* Top Bar */}
      <div className={`flex justify-between items-center p-3 md:p-4 rounded-2xl border backdrop-blur-sm transition-all duration-500
            ${isFever 
                ? 'bg-yellow-900/40 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                : 'bg-slate-900/50 border-slate-700'}
      `}>
        
        {/* Lives */}
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ scale: 1 }}
                animate={{ scale: i < lives ? 1 : 0.8, opacity: i < lives ? 1 : 0.2 }}
            >
                <Heart 
                    className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} 
                />
            </motion.div>
          ))}
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
            <span className={`text-[10px] md:text-[12px] font-arcade tracking-widest ${isFever ? 'text-yellow-400 animate-pulse' : 'text-arcade-cyan'}`}>
                {isFever ? 'حماس X2' : 'النقاط'}
            </span>
            <motion.span 
                key={score}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className={`text-2xl md:text-3xl font-arcade ${isFever ? 'text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]' : 'text-white'}`}
            >
                {score.toString().padStart(5, '0')}
            </motion.span>
        </div>

        {/* Streak / Fever Indicator */}
        <div className="flex items-center space-x-2">
            <div className="relative">
                {isFever ? (
                    <div className="relative">
                        <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-500 fill-yellow-500 animate-bounce" />
                        <motion.div 
                            className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-50"
                            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    </div>
                ) : (
                    <Zap className={`w-6 h-6 md:w-8 md:h-8 ${streak > 0 ? 'text-arcade-yellow fill-arcade-yellow' : 'text-slate-500'}`} />
                )}
                
                <span className={`absolute -bottom-2 -left-2 text-white text-[10px] md:text-xs font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center
                    ${isFever ? 'bg-orange-600 animate-pulse' : 'bg-slate-700'}
                `}>
                    x{Math.min(streak, 9)}
                </span>
            </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className={`mt-3 md:mt-4 w-full h-3 md:h-4 bg-slate-800 rounded-full overflow-hidden border relative ${isFever ? 'border-yellow-600' : 'border-slate-700'}`}>
        <motion.div 
            className={`h-full ${isFever ? 'bg-gradient-to-l from-yellow-500 to-red-600' : 'bg-gradient-to-l from-arcade-cyan to-blue-600'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / maxTime) * 100}%` }}
            transition={{ ease: "linear", duration: 1 }} 
        />
        {/* Gloss effect */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />
      </div>
    </div>
  );
};
