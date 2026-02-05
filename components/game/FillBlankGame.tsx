import React from 'react';
import { Question } from '../../types';
import { ArcadeButton } from '../ui/ArcadeButton';
import { motion } from 'framer-motion';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
}

export const FillBlankGame: React.FC<Props> = ({ question, onAnswer }) => {
  const handleOptionClick = (option: string) => {
    onAnswer(option === question.correctAnswer);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto space-y-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-800/80 p-8 rounded-3xl border-4 border-arcade-yellow text-center shadow-2xl w-full"
      >
        <h3 className="text-arcade-cyan font-arcade text-lg mb-6">{question.prompt}</h3>
        
        <div className="text-3xl md:text-5xl font-arabic leading-relaxed rtl-text text-white mb-8">
          {question.arabicText}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {question.options?.map((option, idx) => (
          <motion.div
            key={idx}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <ArcadeButton 
              variant="secondary" 
              size="lg"
              className="font-arabic text-2xl py-6"
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </ArcadeButton>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
