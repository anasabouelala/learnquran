
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Brain, BookOpen, ArrowLeft, Tag, Book, HelpCircle, CheckCircle } from 'lucide-react';
import { Question } from '../../types';
import { ArcadeButton } from '../ui/ArcadeButton';

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
}

export const QuizGame: React.FC<Props> = ({ question, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isCorrectState, setIsCorrectState] = useState(false);

  useEffect(() => {
    // Shuffle options on new question
    if (question.options) {
      setShuffledOptions([...question.options].sort(() => Math.random() - 0.5));
    }
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrectState(false);
  }, [question]);

  const handleOptionClick = (option: string) => {
    if (isAnswered) return; // Prevent changing answer
    
    setSelectedOption(option);
    setIsAnswered(true);

    const correct = option === question.correctAnswer;
    setIsCorrectState(correct);
  };

  const handleNext = () => {
      // Trigger parent handler to move to next question
      // We pass the result for scoring, but the game logic will move next regardless
      onAnswer(isCorrectState);
  };

  const getCategoryLabel = (type?: string) => {
      switch(type) {
          case 'VOCABULARY': return { label: 'معاني الكلمات', icon: <Tag size={16} />, color: 'text-blue-400 bg-blue-900/20' };
          case 'TAFSEER': return { label: 'التفسير العام', icon: <BookOpen size={16} />, color: 'text-emerald-400 bg-emerald-900/20' };
          case 'THEME': return { label: 'هدايات الآيات', icon: <Brain size={16} />, color: 'text-purple-400 bg-purple-900/20' };
          case 'PRECISION': return { label: 'ضبط اللفظ', icon: <CheckCircle size={16} />, color: 'text-orange-400 bg-orange-900/20' };
          default: return { label: 'اختبار شامل', icon: <HelpCircle size={16} />, color: 'text-slate-400 bg-slate-900/20' };
      }
  };

  const catInfo = getCategoryLabel(question.quizSubType);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-start p-2 md:p-4 h-full overflow-y-auto custom-scrollbar">
      
      {/* Quiz Header */}
      <div className="w-full flex justify-between items-center mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${catInfo.color}`}>
                  {catInfo.icon}
              </div>
              <div>
                  <h3 className="text-white font-arcade text-sm">{catInfo.label}</h3>
                  <p className="text-slate-400 text-xs">سورة {question.verseNumber}</p>
              </div>
          </div>
          <div className="bg-slate-900 px-3 py-1 rounded text-[10px] text-slate-500 border border-slate-700 hidden md:block">
              المصدر: تفسير السعدي / الميسر
          </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex flex-col lg:flex-row gap-6 h-full min-h-0">
          
          {/* Question Side */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={question.id}
                className="bg-slate-900 border-2 border-slate-700 p-6 rounded-3xl relative overflow-hidden shadow-xl shrink-0"
              >
                  <span className="text-arcade-cyan font-arcade text-xs mb-2 block tracking-wider">السؤال</span>
                  <h2 className="text-lg md:text-2xl font-arabic text-white leading-relaxed mb-4 rtl-text">
                      {question.prompt}
                  </h2>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                      <p className="font-arabic text-lg md:text-xl text-slate-300 rtl-text">
                          "{question.arabicText}"
                      </p>
                  </div>
              </motion.div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-3 w-full overflow-y-auto custom-scrollbar pb-4">
                  {shuffledOptions.map((option, idx) => {
                      const isSelected = selectedOption === option;
                      const isCorrect = option === question.correctAnswer;
                      
                      let buttonStyle = "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500";
                      
                      if (isAnswered) {
                          if (isCorrect) {
                              buttonStyle = "bg-green-900/50 border-green-500 text-white";
                          } else if (isSelected && !isCorrect) {
                              buttonStyle = "bg-red-900/50 border-red-500 text-white opacity-50";
                          } else {
                              buttonStyle = "bg-slate-800 border-slate-700 text-slate-500 opacity-30";
                          }
                      }

                      return (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => handleOptionClick(option)}
                            disabled={isAnswered}
                            className={`
                                relative w-full p-4 rounded-xl border-2 text-lg font-arabic text-right transition-all duration-300 flex items-center justify-between px-6 min-h-[60px]
                                ${buttonStyle}
                                ${!isAnswered ? 'active:scale-95' : ''}
                            `}
                          >
                              <span className="relative z-10 w-full">{option}</span>
                              
                              {/* Result Icons */}
                              {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-green-400 absolute left-4" />}
                              {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-400 absolute left-4" />}
                          </motion.button>
                      );
                  })}
              </div>
          </div>

          {/* Explanation / Result Side (Appears after answer) */}
          <AnimatePresence>
            {isAnswered && (
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 lg:max-w-md flex flex-col gap-4 fixed inset-0 bg-slate-900/95 z-50 p-6 lg:static lg:bg-transparent lg:z-0 lg:p-0"
                >
                    <div className={`p-6 rounded-3xl border-2 shadow-2xl flex-1 flex flex-col
                        ${isCorrectState ? 'bg-green-950/30 border-green-500/30' : 'bg-slate-800 border-slate-600'}
                    `}>
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className={`w-5 h-5 ${isCorrectState ? 'text-green-400' : 'text-slate-400'}`} />
                            <h4 className={`font-arcade text-sm ${isCorrectState ? 'text-green-400' : 'text-slate-400'}`}>
                                {isCorrectState ? 'إجابة صحيحة!' : 'التفسير الصحيح'}
                            </h4>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-4">
                            <p className="font-arabic text-lg leading-loose text-slate-200 rtl-text text-right">
                                {question.explanation || "لا يوجد تفسير متاح."}
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500 text-left flex items-center gap-2">
                                <Book size={12} />
                                تم التوليد استناداً إلى تفسير السعدي
                            </div>
                        </div>

                        <ArcadeButton 
                            onClick={handleNext} 
                            size="lg" 
                            variant={isCorrectState ? 'success' : 'primary'}
                            className="w-full flex items-center justify-center gap-2 animate-bounce-short"
                        >
                            السؤال التالي <ArrowLeft size={20} />
                        </ArcadeButton>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
};
