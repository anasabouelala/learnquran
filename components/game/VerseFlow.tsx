import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Zap, Link, ShieldBan, Timer, Disc } from 'lucide-react';
import { ArcadeButton } from '../ui/ArcadeButton';

interface Powerups {
  fiftyFifty: number;
  timeFreeze: number;
}

interface Props {
  question: Question;
  feverMode: boolean;
  powerups: Powerups;
  onAnswer: (correct: boolean) => void;
  onUsePowerup: (type: 'fiftyFifty' | 'timeFreeze') => void;
}

export const VerseFlow: React.FC<Props> = ({ question, feverMode, powerups, onAnswer, onUsePowerup }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [warpSpeed, setWarpSpeed] = useState(false);

  // Reset state on new question
  useEffect(() => {
    setSelectedOption(null);
    setIsWrong(false);
    setHiddenOptions([]);
    setWarpSpeed(false);
  }, [question]);

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; 

    setSelectedOption(option);

    if (option === question.correctAnswer) {
      // Warp Effect
      setWarpSpeed(true);
      setTimeout(() => onAnswer(true), 1200); // Longer delay for warp animation
    } else {
      setIsWrong(true);
      setTimeout(() => {
          onAnswer(false);
          setIsWrong(false);
          setSelectedOption(null);
      }, 800);
    }
  };

  const handleFiftyFifty = () => {
    if (powerups.fiftyFifty <= 0 || hiddenOptions.length > 0) return;
    
    // Find wrong answers
    const wrongOptions = question.options?.filter(o => o !== question.correctAnswer) || [];
    if (wrongOptions.length === 0) return;

    // Hide one random wrong option
    const toHide = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    setHiddenOptions([toHide]);
    onUsePowerup('fiftyFifty');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl">
      
      {/* --- HYPERSPACE BACKGROUND --- */}
      <div className={`absolute inset-0 z-0 overflow-hidden transition-opacity duration-1000 ${feverMode ? 'opacity-80' : 'opacity-40'}`}>
        {/* Starfield */}
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black`}></div>
        
        {/* Warp Lines */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
            {/* Using a pseudo-element driven starfield via CSS would be ideal, but simple DOM elements work for this demo */}
            <div className={`w-[200%] h-[200%] absolute top-[-50%] left-[-50%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] 
                ${warpSpeed ? 'animate-[spin_0.5s_linear_infinite] scale-150' : 'animate-[spin_60s_linear_infinite]'} opacity-50`}>
            </div>
             <div className={`w-[100%] h-[100%] absolute rounded-full border border-slate-600/30 ${warpSpeed ? 'animate-ping' : 'scale-0'}`}></div>
        </div>

        {/* Fever Overlay */}
        {feverMode && (
             <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse pointer-events-none"></div>
        )}
      </div>


      {/* --- HUD: POWERUPS --- */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
         <button 
            onClick={handleFiftyFifty}
            disabled={powerups.fiftyFifty <= 0 || hiddenOptions.length > 0}
            className={`
                relative group flex items-center justify-between gap-3 px-4 py-2 rounded-lg border-2 transition-all
                ${powerups.fiftyFifty > 0 
                    ? 'bg-slate-800 border-arcade-cyan text-arcade-cyan hover:bg-slate-700 active:scale-95' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-600 grayscale cursor-not-allowed'}
            `}
         >
            <div className="flex items-center gap-2">
                <ShieldBan size={18} />
                <span className="font-arcade text-[10px]">ECHO FILTER</span>
            </div>
            <span className="bg-slate-900 px-2 py-0.5 rounded text-xs font-mono">{powerups.fiftyFifty}</span>
            
            {/* Tooltip effect */}
            <div className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs p-1 rounded whitespace-nowrap font-sans">
                Remove 1 Wrong Answer
            </div>
         </button>

         <button 
            onClick={() => onUsePowerup('timeFreeze')}
            disabled={powerups.timeFreeze <= 0}
            className={`
                relative group flex items-center justify-between gap-3 px-4 py-2 rounded-lg border-2 transition-all
                ${powerups.timeFreeze > 0 
                    ? 'bg-slate-800 border-arcade-purple text-arcade-purple hover:bg-slate-700 active:scale-95' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-600 grayscale cursor-not-allowed'}
            `}
         >
             <div className="flex items-center gap-2">
                <Timer size={18} />
                <span className="font-arcade text-[10px]">STASIS</span>
            </div>
            <span className="bg-slate-900 px-2 py-0.5 rounded text-xs font-mono">{powerups.timeFreeze}</span>
             
             <div className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs p-1 rounded whitespace-nowrap font-sans">
                Freeze Timer (10s)
            </div>
         </button>
      </div>

      
      {/* --- MAIN GAMEPLAY AREA --- */}
      <div className="flex-1 flex flex-col z-10 gap-4 p-4">
        
        {/* ANCHOR VERSE (Top) */}
        <div className="flex-1 flex flex-col items-center justify-center relative perspective-1000">
           
           <AnimatePresence mode='wait'>
             {!warpSpeed && (
               <motion.div 
                 key={question.id}
                 initial={{ scale: 0.5, opacity: 0, z: -500 }}
                 animate={{ scale: 1, opacity: 1, z: 0 }}
                 exit={{ scale: 2, opacity: 0, z: 200 }}
                 transition={{ type: "spring", bounce: 0.4 }}
                 className="w-full max-w-2xl bg-slate-900/80 border-2 border-arcade-cyan/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] backdrop-blur-md relative overflow-hidden group"
               >
                  {/* Hologram Scan Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-arcade-cyan/10 to-transparent h-[200%] w-full animate-[scan_3s_linear_infinite] pointer-events-none"></div>

                  <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                    <div className="flex items-center gap-2 text-arcade-cyan">
                        <Disc size={16} className={feverMode ? 'animate-spin' : ''} />
                        <span className="font-arcade text-[10px] tracking-widest">
                            {feverMode ? 'HYPER-DRIVE ENGAGED' : 'NAVIGATION ONLINE'}
                        </span>
                    </div>
                    <span className="font-arcade text-[10px] text-slate-400">VERSE {question.verseNumber}</span>
                  </div>
                  
                  <p className="text-3xl md:text-5xl font-arabic text-white text-center leading-loose rtl-text drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {question.arabicText}
                  </p>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Warp Tunnel Visual when correct */}
           <AnimatePresence>
            {warpSpeed && (
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                 >
                     <div className="text-6xl font-arcade text-white italic tracking-tighter animate-pulse drop-shadow-[0_0_30px_#fff]">
                         WARP!
                     </div>
                 </motion.div>
            )}
           </AnimatePresence>
        </div>


        {/* CONTROLS (Bottom) */}
        <div className="relative min-h-[280px]">
             {/* Connection Line */}
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-0 h-10 w-1 bg-gradient-to-b from-arcade-cyan/50 to-transparent"></div>

             <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto px-4 pb-4">
                <AnimatePresence mode="wait">
                  {question.options?.map((option, idx) => {
                    const isHidden = hiddenOptions.includes(option);
                    const isSelected = selectedOption === option;
                    const isCorrect = option === question.correctAnswer;
                    
                    if (isHidden) return null; // Remove filtered options

                    let stateClass = "bg-slate-800/90 border-slate-600 text-slate-300 hover:border-arcade-cyan hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]";
                    
                    if (isSelected) {
                        if (isCorrect) {
                            stateClass = "bg-green-600 border-green-400 text-white shadow-[0_0_30px_rgba(34,197,94,0.6)] z-20 scale-105";
                        } else if (isWrong) {
                            stateClass = "bg-red-900/80 border-red-500 text-white animate-shake z-20";
                        }
                    }

                    // Fever mode styling
                    if (feverMode && !isSelected) {
                        stateClass += " border-arcade-yellow/30 shadow-[0_0_10px_rgba(250,204,21,0.1)]";
                    }

                    return (
                      <motion.button
                        key={`${question.id}-opt-${idx}`}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1, type: "spring" }}
                        onClick={() => handleOptionClick(option)}
                        disabled={selectedOption !== null || warpSpeed}
                        className={`
                          group relative w-full p-4 rounded-xl border-2 text-right transition-all duration-200
                          flex items-center justify-between gap-4 rtl-text backdrop-blur-sm
                          ${stateClass}
                        `}
                      >
                         <div className="flex-1 font-arabic text-xl md:text-2xl leading-relaxed">
                           {option}
                         </div>
                         
                         {/* Target Reticle */}
                         <div className={`
                           w-8 h-8 rounded border flex items-center justify-center shrink-0 transition-all
                           ${isSelected && isCorrect 
                                ? 'border-transparent bg-white text-green-600 rotate-90 scale-110' 
                                : 'border-slate-500 text-slate-500 group-hover:border-arcade-cyan group-hover:text-arcade-cyan group-hover:rotate-45'}
                         `}>
                            {isSelected && isCorrect ? <Zap size={20} fill="currentColor" /> : <Link size={14} />}
                         </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
             </div>
        </div>

      </div>
    </div>
  );
};
