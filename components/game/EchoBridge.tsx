
import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Check, Lock, Unlock, Send, Lightbulb, AlertTriangle, BrainCircuit, List } from 'lucide-react';
import { ArcadeButton } from '../ui/ArcadeButton';

interface Props {
  question: Question;
  feverMode: boolean;
  onAnswer: (correct: boolean) => void;
}

enum Phase {
  TYPING = 'TYPING',
  SELECTING = 'SELECTING',
  PATTERN_GUIDE = 'PATTERN_GUIDE'
}

export const EchoBridge: React.FC<Props> = ({ question, feverMode, onAnswer }) => {
  const [phase, setPhase] = useState<Phase>(Phase.TYPING);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0); // Track wrong attempts for hints
  const [errorShake, setErrorShake] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Derived state for word choices (Phase 2 help)
  const [wordChoices, setWordChoices] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset on new question
    setPhase(Phase.TYPING);
    setInput("");
    setSelectedOption(null);
    setErrorShake(false);
    setAttempts(0);

    // Prepare word choices for "Propositions" help (Correct + 2 Distractors)
    const distractors = question.wordDistractors || ["Error", "Error"];
    const allWords = [question.nextVerseFirstWord || "", ...distractors].sort(() => Math.random() - 0.5);
    setWordChoices(allWords);

    // Auto focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [question]);

  // Normalize Arabic for lenient comparison (ignore tashkeel, alif variations)
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[\u064B-\u065F]/g, '') // Remove Tashkeel
      .replace(/[أإآ]/g, 'ا') // Normalize Alif
      .replace(/ى/g, 'ي') // Normalize Ya
      .replace(/ة/g, 'ه') // Normalize Ta Marbuta (optional, but helpful)
      .trim();
  };

  const handleInputSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    verifyWord(input);
  };

  const verifyWord = (wordToCheck: string) => {
    if (!question.nextVerseFirstWord) return;

    const normalizedInput = normalizeArabic(wordToCheck);
    const normalizedTarget = normalizeArabic(question.nextVerseFirstWord);

    if (normalizedInput === normalizedTarget) {
      // Success! Move to Verse Selection
      setPhase(Phase.SELECTING);
      setInput(question.nextVerseFirstWord); // Auto-fill correct if they were typing
    } else {
      // Failure Logic
      handleFailure();
    }
  };

  const handleFailure = () => {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Progressive Assistance Logic
    if (newAttempts === 1) {
      // Just show Hint (handled in render)
    } else if (newAttempts === 2) {
      // Trigger Word Propositions (Input gets replaced by buttons)
      // Handled in render
    } else if (newAttempts === 3) {
      // Trigger Pattern Guide
      setPhase(Phase.PATTERN_GUIDE);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);

    if (option === question.correctAnswer) {
      setTimeout(() => onAnswer(true), 1000);
    } else {
      setTimeout(() => onAnswer(false), 1000);
    }
  };

  const skipToSelect = () => {
    setPhase(Phase.SELECTING);
  };

  // Allow user to manually trigger propositions mode in Phase 1
  const togglePropositions = () => {
    setAttempts(2); // Force attempt level to 2 (Propositions mode)
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative overflow-hidden bg-slate-900 rounded-3xl border-2 border-slate-700 shadow-2xl">

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,100,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,100,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* --- PHASE 1: ANCHOR --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 relative z-10">
        <div className="w-full max-w-2xl text-center space-y-4">
          <span className="text-slate-500 font-arcade text-[10px] tracking-[0.2em] uppercase">الآية الحالية</span>
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-5xl font-arabic text-white leading-loose drop-shadow-md rtl-text px-4"
          >
            {question.arabicText}
          </motion.div>
        </div>
      </div>

      {/* --- PATTERN GUIDE MODAL --- */}
      <AnimatePresence>
        {phase === Phase.PATTERN_GUIDE && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="bg-slate-800 p-8 rounded-2xl border-2 border-arcade-yellow shadow-[0_0_50px_rgba(250,204,21,0.2)] max-w-lg w-full">
              <BrainCircuit className="w-12 h-12 text-arcade-yellow mx-auto mb-4 animate-pulse" />
              <h3 className="text-arcade-yellow font-arcade text-lg mb-4">مطلوب مزامنة عصبية</h3>

              <div className="text-white mb-6 space-y-4">
                <p className="text-sm text-slate-400 font-arcade uppercase tracking-widest">تم اكتشاف نمط للحفظ</p>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 font-sans text-lg">
                  {question.memorizationTip || "لا يوجد نمط محدد. حاول تذكر السياق."}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-slate-500 text-sm">الكلمة المفتاحية هي:</span>
                <div className="text-3xl font-arabic text-arcade-cyan mt-2">{question.nextVerseFirstWord}</div>
              </div>

              <ArcadeButton onClick={skipToSelect} variant="primary" className="w-full">
                فهمت، تابع
              </ArcadeButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- INTERACTION ZONE --- */}
      <div className="min-h-[200px] md:min-h-[280px] bg-slate-800/80 backdrop-blur-xl border-t-2 border-slate-600 rounded-t-3xl p-6 relative z-20 transition-all duration-500 flex flex-col justify-center">

        <AnimatePresence mode="wait">
          {phase === Phase.TYPING ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-md mx-auto flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2 text-arcade-cyan animate-pulse mb-2">
                <Lock size={20} />
                <span className="font-arcade text-xs">فك تشفير الكلمة التالية</span>
              </div>

              {/* ATTEMPT LEVEL 2: WORD PROPOSITIONS */}
              {attempts >= 2 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {wordChoices.map((word, i) => (
                    <button
                      key={i}
                      onClick={() => verifyWord(word)}
                      className="bg-slate-700 hover:bg-arcade-cyan hover:text-slate-900 text-white font-arabic text-xl py-4 rounded-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              ) : (
                /* ATTEMPT LEVEL 0 & 1: TYPING */
                <form onSubmit={handleInputSubmit} className={`w-full relative ${errorShake ? 'animate-shake' : ''}`}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اكتب الكلمة الأولى..."
                    className={`w-full bg-slate-900 border-2 rounded-xl py-4 px-12 text-center text-2xl font-arabic text-white placeholder-slate-600 focus:outline-none focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] rtl-text
                            ${errorShake ? 'border-red-500' : 'border-arcade-cyan/50 focus:border-arcade-cyan'}
                        `}
                    dir="rtl"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-arcade-cyan/20 hover:bg-arcade-cyan text-arcade-cyan hover:text-white rounded-lg p-2 transition-colors"
                  >
                    <Send size={20} className="rotate-180" /> {/* Mirror icon for RTL */}
                  </button>
                </form>
              )}

              {/* ATTEMPT LEVEL 1: HINT DISPLAY */}
              {attempts === 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full bg-blue-900/30 border border-blue-500/50 p-3 rounded-lg flex items-start gap-3 mt-2"
                >
                  <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0 mt-1" />
                  <div className="text-sm text-blue-100 font-sans">
                    <span className="font-bold block text-xs uppercase text-blue-300 mb-1">تلميح:</span>
                    {question.hint || "حاول تذكر ما يأتي بعد..."}
                  </div>
                </motion.div>
              )}

              {attempts >= 2 && (
                <div className="text-orange-400 text-xs font-arcade flex items-center gap-2 mt-2 animate-pulse">
                  <AlertTriangle size={12} /> اختر الكلمة الصحيحة
                </div>
              )}

              {attempts < 2 && (
                <div className="w-full flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-sans">
                    <Keyboard size={14} />
                    <span>لوحة مفاتيح عربية</span>
                  </div>
                  <button
                    onClick={togglePropositions}
                    className="bg-slate-700/50 hover:bg-slate-700 text-arcade-cyan text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors border border-slate-600"
                  >
                    <List size={14} /> إظهار الخيارات
                  </button>
                </div>
              )}

            </motion.div>
          ) : (
            /* --- SELECTION PHASE --- */
            <motion.div
              key="selecting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl mx-auto flex flex-col gap-4"
            >
              <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                <Unlock size={20} />
                <span className="font-arcade text-xs">تم السماح بالدخول: اختر الرابط</span>
              </div>

              {question.options?.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === question.correctAnswer;

                let style = "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700";
                if (isSelected) {
                  style = isCorrect
                    ? "bg-green-600 border-green-400 text-white shadow-[0_0_20px_#22c55e]"
                    : "bg-red-600 border-red-400 text-white";
                }

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleOptionSelect(option)}
                    disabled={selectedOption !== null}
                    className={`w-full p-4 rounded-xl border-2 text-right font-arabic text-xl md:text-2xl leading-relaxed rtl-text transition-all ${style}`}
                  >
                    {/* Highlight the first word to show the link */}
                    {option}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
