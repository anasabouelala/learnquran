
import React, { useState, useEffect } from 'react';
import { Question, AssemblyFragment } from '../../types';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Check, X, RotateCcw, HelpCircle, GripVertical } from 'lucide-react';
import { ArcadeButton } from '../ui/ArcadeButton';

interface Props {
    question: Question;
    onAnswer: (correct: boolean) => void;
}

export const VerseAssembler: React.FC<Props> = ({ question, onAnswer }) => {
    const [pool, setPool] = useState<AssemblyFragment[]>([]);
    const [constructed, setConstructed] = useState<AssemblyFragment[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [showHint, setShowHint] = useState(false);
    const [requiredSlots, setRequiredSlots] = useState(0);

    useEffect(() => {
        // Initialize game state
        if (question.assemblyData) {
            // Shuffle pool
            const fragments = question.assemblyData.fragments;
            const shuffled = [...fragments].sort(() => Math.random() - 0.5);

            // Determine required slots based on CORRECT items
            const correctCount = fragments.filter(f => f.type === 'CORRECT').length;
            setRequiredSlots(correctCount);

            setPool(shuffled);
            setConstructed([]);
            setStatus('IDLE');
            setIsChecking(false);
            setShowHint(false);
        }
    }, [question]);

    const moveToConstructed = (fragment: AssemblyFragment) => {
        if (status === 'SUCCESS' || constructed.length >= requiredSlots) return;
        setPool(prev => prev.filter(f => f.id !== fragment.id));
        setConstructed(prev => [...prev, fragment]);
        setStatus('IDLE');
    };

    const moveToPool = (fragment: AssemblyFragment) => {
        if (status === 'SUCCESS') return;
        setConstructed(prev => prev.filter(f => f.id !== fragment.id));
        setPool(prev => [...prev, fragment]);
        setStatus('IDLE');
    };

    const checkAnswer = () => {
        setIsChecking(true);

        const correctSequence = question.assemblyData?.fragments
            .filter(f => f.type === 'CORRECT')
            .sort((a, b) => a.orderIndex - b.orderIndex) || [];

        // Check: Order and IDs
        const isCorrect = constructed.length === correctSequence.length && constructed.every((frag, index) => {
            return frag.type === 'CORRECT' && frag.orderIndex === index;
        });

        if (isCorrect) {
            setStatus('SUCCESS');
            setTimeout(() => {
                onAnswer(true);
            }, 1500);
        } else {
            handleError();
        }
    };

    const handleError = () => {
        setStatus('ERROR');
        setTimeout(() => {
            setIsChecking(false);
            setStatus('IDLE');
            onAnswer(false); // Penalty
        }, 1000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col gap-4 md:gap-6 p-2 md:p-4 overflow-y-auto">

            {/* Header / Hint */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700 shrink-0">
                <div>
                    <span className="text-arcade-cyan font-arcade text-xs tracking-widest">وضع التجميع</span>
                    <h3 className="text-white text-sm mt-1">الآية {question.verseNumber}</h3>
                </div>
                <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-slate-400 hover:text-arcade-yellow transition-colors"
                >
                    <HelpCircle size={24} />
                </button>
            </div>

            <AnimatePresence>
                {showHint && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-xl text-yellow-200 text-sm font-arabic text-right dir-rtl shrink-0"
                    >
                        {question.memorizationTip}
                    </motion.div>
                )}
            </AnimatePresence>

            <LayoutGroup>

                {/* --- CONSTRUCTION ZONE (SLOTS) --- */}
                <div className={`
            min-h-[180px] bg-slate-800/80 rounded-2xl border-4 relative
            flex flex-wrap content-start items-center p-4 gap-2 md:gap-3 rtl-text transition-colors duration-300
            ${status === 'SUCCESS' ? 'border-green-500 bg-green-900/20' : ''}
            ${status === 'ERROR' ? 'border-red-500 bg-red-900/20 animate-shake' : 'border-slate-600'}
        `}>
                    {/* Render Slots */}
                    {Array.from({ length: requiredSlots }).map((_, index) => {
                        const fragment = constructed[index];
                        return (
                            <div key={index} className="relative min-w-[80px] md:min-w-[120px] h-[50px] md:h-[64px] flex-1 max-w-[48%] md:max-w-[32%]">
                                {fragment ? (
                                    <motion.button
                                        layoutId={fragment.id}
                                        onClick={() => moveToPool(fragment)}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className={`
                                    w-full h-full
                                    bg-gradient-to-b from-arcade-purple to-purple-900 border border-purple-400
                                    text-white font-arabic text-sm md:text-xl px-2 md:px-4 rounded-lg shadow-lg
                                    hover:brightness-110 active:scale-95 flex items-center justify-center gap-1 md:gap-2
                                    ${status === 'SUCCESS' ? 'from-green-600 to-green-800 border-green-400' : ''}
                                    ${status === 'ERROR' ? 'from-red-600 to-red-800 border-red-400' : ''}
                                `}
                                    >
                                        <GripVertical size={14} className="opacity-50 shrink-0 hidden md:block" />
                                        <span className="truncate">{fragment.text}</span>
                                    </motion.button>
                                ) : (
                                    <div className="w-full h-full border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-900/30">
                                        <span className="text-slate-600 font-arcade text-xs">{'\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669'[index] || (index + 1)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {constructed.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none font-arcade text-xs md:text-sm">
                            اسحب الكلمات هنا
                        </div>
                    )}
                </div>

                {/* --- POOL --- */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 min-h-[120px] shrink-0">
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 rtl-text">
                        <AnimatePresence>
                            {pool.map((frag) => (
                                <motion.button
                                    layoutId={frag.id}
                                    key={frag.id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    onClick={() => moveToConstructed(frag)}
                                    disabled={constructed.length >= requiredSlots}
                                    className={`
                                bg-slate-700 text-slate-200 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 font-arabic text-lg md:text-xl px-3 py-2 rounded-lg transition-all
                                ${constructed.length >= requiredSlots ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-slate-600'}
                            `}
                                >
                                    {frag.text}
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

            </LayoutGroup>

            {/* --- ACTIONS --- */}
            <div className="flex justify-center gap-3 md:gap-4 shrink-0 mt-auto">
                <ArcadeButton
                    onClick={() => {
                        setConstructed([]);
                        setPool([...question.assemblyData!.fragments].sort(() => Math.random() - 0.5));
                        setStatus('IDLE');
                    }}
                    variant="secondary"
                    className="w-auto px-4 md:px-6"
                    disabled={status === 'SUCCESS'}
                >
                    <RotateCcw size={20} />
                </ArcadeButton>

                <ArcadeButton
                    onClick={checkAnswer}
                    size="lg"
                    className={`w-full max-w-sm transition-all ${constructed.length !== requiredSlots ? 'opacity-50 grayscale' : ''}`}
                    disabled={constructed.length !== requiredSlots || isChecking || status === 'SUCCESS'}
                >
                    {status === 'SUCCESS' ? (
                        <span className="flex items-center justify-center gap-2"><Check /> صحيح!</span>
                    ) : status === 'ERROR' ? (
                        <span className="flex items-center justify-center gap-2"><X /> ترتيب خاطئ</span>
                    ) : (
                        "تحقق من الترتيب"
                    )}
                </ArcadeButton>
            </div>

        </div>
    );
};
