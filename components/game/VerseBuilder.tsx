import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Eye, Zap, RefreshCw } from 'lucide-react';
import { ArcadeButton } from '../ui/ArcadeButton';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
  onComplete: () => void;
}

enum Phase {
  OBSERVE = 'OBSERVE',
  REPAIR = 'REPAIR',
  CONSTRUCT = 'CONSTRUCT'
}

export const VerseBuilder: React.FC<Props> = ({ question, onAnswer, onComplete }) => {
  const [phase, setPhase] = useState<Phase>(Phase.OBSERVE);
  
  // State for Construct/Repair phases
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [poolWords, setPoolWords] = useState<{id: string, text: string}[]>([]);
  const [mistakeShake, setMistakeShake] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

  // Initialize phase
  useEffect(() => {
    startObservePhase();
  }, [question]);

  const startObservePhase = () => {
    setPhase(Phase.OBSERVE);
    setCompletedWords(question.words);
    setPoolWords([]);
  };

  const startRepairPhase = () => {
    setPhase(Phase.REPAIR);
    // Remove ~40% of words randomly, but keep at least 1 removed
    const words = [...question.words];
    const indicesToRemove = new Set<number>();
    const numToRemove = Math.max(1, Math.floor(words.length * 0.4));
    
    while(indicesToRemove.size < numToRemove) {
      indicesToRemove.add(Math.floor(Math.random() * words.length));
    }

    const newCompleted = words.map((w, i) => indicesToRemove.has(i) ? "" : w);
    const newPool = Array.from(indicesToRemove).map(i => ({
      id: `word-${i}-${Math.random()}`,
      text: words[i]
    })).sort(() => Math.random() - 0.5); // Shuffle pool

    setCompletedWords(newCompleted);
    setPoolWords(newPool);
  };

  const startConstructPhase = () => {
    setPhase(Phase.CONSTRUCT);
    setCompletedWords(new Array(question.words.length).fill(""));
    const newPool = question.words.map((w, i) => ({
      id: `word-${i}-${Math.random()}`,
      text: w
    })).sort(() => Math.random() - 0.5);
    setPoolWords(newPool);
  };

  const handlePoolWordClick = (wordObj: {id: string, text: string}) => {
    // Find the first empty slot
    const firstEmptyIndex = completedWords.findIndex(w => w === "");
    if (firstEmptyIndex === -1) return;

    const correctWord = question.words[firstEmptyIndex];

    if (wordObj.text === correctWord) {
      // Correct!
      const newCompleted = [...completedWords];
      newCompleted[firstEmptyIndex] = wordObj.text;
      setCompletedWords(newCompleted);

      // Remove from pool
      setPoolWords(prev => prev.filter(w => w.id !== wordObj.id));
      
      onAnswer(true); // Small score bump for correct word

      // Check if phase complete
      if (newCompleted.every(w => w !== "")) {
        handlePhaseCompletion();
      }
    } else {
      // Wrong!
      setMistakeShake(true);
      setTimeout(() => setMistakeShake(false), 500);
      onAnswer(false); // Penalty
    }
  };

  const handlePhaseCompletion = () => {
    setSuccessFlash(true);
    setTimeout(() => {
        setSuccessFlash(false);
        if (phase === Phase.OBSERVE) {
            startRepairPhase();
        } else if (phase === Phase.REPAIR) {
            startConstructPhase();
        } else {
            onComplete();
        }
    }, 1000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-full gap-6">
      
      {/* Instructions / Status */}
      <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${phase === Phase.OBSERVE ? 'bg-arcade-cyan text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                <Eye size={20} />
            </div>
            <div className={`w-8 h-1 rounded-full ${phase === Phase.OBSERVE ? 'bg-arcade-cyan' : 'bg-slate-700'}`} />
            
            <div className={`p-2 rounded-lg ${phase === Phase.REPAIR ? 'bg-arcade-yellow text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                <RefreshCw size={20} />
            </div>
            <div className={`w-8 h-1 rounded-full ${phase === Phase.REPAIR ? 'bg-arcade-yellow' : 'bg-slate-700'}`} />

            <div className={`p-2 rounded-lg ${phase === Phase.CONSTRUCT ? 'bg-arcade-neon text-white' : 'bg-slate-700 text-slate-400'}`}>
                <Zap size={20} />
            </div>
        </div>
        <div className="text-right">
            <h3 className="text-arcade-cyan font-arcade text-xs uppercase tracking-widest">
                {phase === Phase.OBSERVE && "MEMORIZE THE VERSE"}
                {phase === Phase.REPAIR && "REPAIR THE GLITCHES"}
                {phase === Phase.CONSTRUCT && "RECONSTRUCT FROM MEMORY"}
            </h3>
        </div>
      </div>

      {/* Main Verse Container */}
      <div className={`
          flex-1 bg-slate-900/80 rounded-2xl border-2 p-6 md:p-10 flex flex-wrap items-center justify-center content-center gap-3 md:gap-4 rtl-text transition-colors duration-300 relative overflow-hidden
          ${mistakeShake ? 'animate-shake border-red-500 bg-red-900/20' : 'border-slate-600'}
          ${successFlash ? 'border-green-400 bg-green-900/20 shadow-[0_0_30px_rgba(74,222,128,0.2)]' : ''}
      `}>
          {/* Scanline overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>

          <AnimatePresence mode='popLayout'>
            {phase === Phase.OBSERVE ? (
                // Full text block for reading flow
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-3xl md:text-5xl font-arabic text-center leading-loose text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                >
                    {question.arabicText}
                </motion.div>
            ) : (
                // Tokenized slots for interaction
                completedWords.map((word, idx) => (
                    <motion.div
                        key={`slot-${idx}`}
                        layout
                        className={`
                            min-w-[80px] h-16 md:h-20 rounded-xl flex items-center justify-center text-2xl md:text-4xl font-arabic px-4 border-b-4 transition-all
                            ${word 
                                ? 'bg-arcade-purple border-purple-900 text-white shadow-lg' 
                                : 'bg-slate-800 border-slate-700 text-transparent animate-pulse border-dashed'}
                        `}
                    >
                        {word}
                    </motion.div>
                ))
            )}
          </AnimatePresence>
      </div>

      {/* Action Area */}
      <div className="h-48 bg-slate-800 rounded-t-3xl p-6 border-t-4 border-arcade-cyan shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative">
          
          {phase === Phase.OBSERVE ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-slate-400 font-arcade text-xs text-center">READ CAREFULLY. TAP READY WHEN MEMORIZED.</p>
                  <ArcadeButton onClick={handlePhaseCompletion} size="lg" className="animate-bounce-short">
                      I'M READY
                  </ArcadeButton>
              </div>
          ) : (
              <div className="flex flex-wrap justify-center gap-3 rtl-text content-start h-full overflow-y-auto">
                  <AnimatePresence>
                      {poolWords.map((wordObj) => (
                          <motion.button
                              key={wordObj.id}
                              layoutId={wordObj.id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              onClick={() => handlePoolWordClick(wordObj)}
                              className="bg-slate-200 text-slate-900 font-arabic text-xl md:text-2xl px-6 py-3 rounded-lg border-b-4 border-slate-400 active:translate-y-1 active:border-b-0 hover:bg-white transition-colors shadow-md"
                          >
                              {wordObj.text}
                          </motion.button>
                      ))}
                  </AnimatePresence>
                  {poolWords.length === 0 && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center gap-2 text-green-400 font-arcade mt-4">
                          <CheckCircle2 /> COMPLETE!
                      </motion.div>
                  )}
              </div>
          )}
      </div>

    </div>
  );
};
