import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../../types';
import { ArcadeButton } from '../ui/ArcadeButton';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
}

export const VerseOrderGame: React.FC<Props> = ({ question, onAnswer }) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  // Determine the target list of words
  const targetWords = useMemo(() => {
      if (question.words && question.words.length > 0) return question.words;
      // Fallback: use arabicText or correctAnswer split by spaces
      const text = question.correctAnswer || question.arabicText || "";
      return text.split(' ').filter(w => w.trim().length > 0);
  }, [question]);

  useEffect(() => {
    // Scramble the words for the available pool
    setAvailableWords([...targetWords].sort(() => Math.random() - 0.5));
    setSelectedWords([]);
  }, [targetWords]);

  const handleWordClick = (word: string, index: number) => {
    // Move from available to selected
    const newAvailable = [...availableWords];
    newAvailable.splice(index, 1);
    setAvailableWords(newAvailable);
    setSelectedWords([...selectedWords, word]);
  };

  const handleSelectedClick = (word: string, index: number) => {
    // Move back from selected to available
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
  };

  const checkAnswer = () => {
    // Compare selectedWords with targetWords
    const isCorrect = selectedWords.length === targetWords.length && 
                      selectedWords.every((val, index) => val === targetWords[index]);
    onAnswer(isCorrect);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto space-y-6">
      <h3 className="text-arcade-cyan font-arcade text-lg mb-2">{question.prompt}</h3>

      {/* Target Area */}
      <div className="w-full min-h-[120px] bg-slate-800/80 rounded-2xl border-2 border-dashed border-slate-500 p-4 flex flex-wrap gap-3 justify-center items-center rtl-text">
         <AnimatePresence>
            {selectedWords.length === 0 && (
              <span className="text-slate-500 font-arcade text-xs absolute">Tap words below to build the verse</span>
            )}
            {selectedWords.map((word, idx) => (
              <motion.button
                key={`${word}-${idx}`}
                layoutId={`word-${word}-${idx}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => handleSelectedClick(word, idx)}
                className="bg-arcade-yellow text-arcade-dark font-arabic text-2xl px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-400"
              >
                {word}
              </motion.button>
            ))}
         </AnimatePresence>
      </div>

      {/* Source Area */}
      <div className="flex flex-wrap gap-4 justify-center py-6 rtl-text">
        {availableWords.map((word, idx) => (
           <motion.button
            key={`${word}-${idx}-source`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleWordClick(word, idx)}
            className="bg-slate-700 text-white font-arabic text-xl px-4 py-3 rounded-lg border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all"
          >
            {word}
          </motion.button>
        ))}
      </div>

      <div className="mt-8">
        <ArcadeButton 
          variant="primary" 
          size="lg" 
          onClick={checkAnswer}
          disabled={availableWords.length > 0}
          className={availableWords.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}
        >
          CHECK ANSWER
        </ArcadeButton>
      </div>
    </div>
  );
};