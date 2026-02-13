import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Keyboard, Play, RefreshCcw, Pin, MicOff, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Edit3, Speech, Volume2, Activity, Wifi, WifiOff, CloudCog, Info } from 'lucide-react';
import { Question } from '../../types';
import { ArcadeButton } from '../ui/ArcadeButton';
import { checkRecitationGaps } from '../../services/geminiService';
import { alignSequences, normalizeArabic } from '../../utils/alignment';

// Type definition for Web Speech API
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface Props {
    surahName: string;
    questions: Question[];
    initialInputMode?: 'AUDIO' | 'TEXT';
    onGameEnd: (victory: boolean, transcript?: string, score?: number) => void;
    onExit: (score?: number) => void;
}

interface Word {
    id: string;
    text: string;
    isHidden: boolean;
    isPinned: boolean;
    userInput: string;
    isCorrect: boolean;
    isError: boolean;
}

interface VerseData {
    verseNumber: number;
    words: Word[];
}

type InputMode = 'AUDIO' | 'TEXT';

export const QuranMemorizer: React.FC<Props> = ({ surahName, questions, initialInputMode, onGameEnd, onExit }) => {
    const [inputMode, setInputMode] = useState<InputMode>(initialInputMode || 'AUDIO');
    const [verses, setVerses] = useState<VerseData[]>([]);
    const [progressionLevel, setProgressionLevel] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Cloud processing state
    const [isReceivingSound, setIsReceivingSound] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [liveTranscript, setLiveTranscript] = useState("");
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Feature detection state
    const [isCloudMode, setIsCloudMode] = useState(false);

    // Real-time speech refs
    const recognitionRef = useRef<any>(null);
    const isRecordingRef = useRef(false);
    const handleVoiceInputRef = useRef<(transcript: string) => void>(() => { });

    // Cloud/Fallback refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Initialize Verses
        const newVerses = questions.map(q => ({
            verseNumber: q.verseNumber,
            words: q.arabicText.split(' ').filter(w => w.length > 0).map((w, idx) => ({
                id: `v${q.verseNumber}-w${idx}`,
                text: w,
                isHidden: false,
                isPinned: false,
                userInput: "",
                isCorrect: false,
                isError: false
            }))
        }));
        setVerses(newVerses);
    }, [questions]);

    // --- BROWSER DETECTION & SETUP ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                // Fallback to Cloud Mode for Firefox/Safari
                console.log("Web Speech API not found. Switching to Cloud Recording Mode (Firefox/Safari compatible).");
                setIsCloudMode(true);
                return;
            }

            // Setup Standard Web Speech API (Chrome/Edge)
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ar-SA';

            recognition.onstart = () => {
                setIsRecording(true);
                setPermissionError(null);
            };

            recognition.onsoundstart = () => setIsReceivingSound(true);
            recognition.onsoundend = () => setIsReceivingSound(false);

            recognition.onresult = (event: any) => {
                let fullTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    fullTranscript += event.results[i][0].transcript + ' ';
                }
                const trimmed = fullTranscript.trim();
                setLiveTranscript(trimmed);
                handleVoiceInputRef.current(fullTranscript);
            };

            recognition.onerror = (event: any) => {
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setIsRecording(false);
                    isRecordingRef.current = false;
                    setPermissionError("تم رفض إذن الميكروفون.");
                } else if (event.error === 'network') {
                    // If network fails (common in brave/firefox with polyfills), fallback to cloud
                    setIsCloudMode(true);
                }
            };

            recognition.onend = () => {
                setIsReceivingSound(false);
                if (isRecordingRef.current) {
                    try { recognition.start(); } catch (e) {
                        setTimeout(() => {
                            if (isRecordingRef.current) try { recognition.start(); } catch (err) { }
                        }, 500);
                    }
                } else {
                    setIsRecording(false);
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            isRecordingRef.current = false;
            if (recognitionRef.current) try { recognitionRef.current.abort(); } catch (e) { }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const handleGameOver = (victory: boolean) => {
        setIsRecording(false);
        if (recognitionRef.current) recognitionRef.current.stop();

        // Construct full transcript for analysis
        let recitedText = liveTranscript;

        if (!recitedText || recitedText.trim().length < 10) {
            // Fall back to constructing from user inputs (what they typed/spoke into blanks)
            recitedText = verses.map(v =>
                v.words.map(w => w.userInput || w.text).join(" ")
            ).join(" ");
        }

        // Calculate Score: 200 points per level completed
        const score = progressionLevel * 200;

        onGameEnd(victory, recitedText, score);
    };

    // --- REAL-TIME INPUT LOGIC (Chrome) ---
    const handleVoiceInput = (fullTranscript: string) => {
        const spokenWordsRaw = fullTranscript.trim().split(/\s+/).filter(w => w.length > 0);
        if (spokenWordsRaw.length === 0) return;

        setVerses(prev => {
            const allRefWordsFlat: { verseIdx: number, wordIdx: number, text: string }[] = [];

            prev.forEach((v, vIdx) => {
                v.words.forEach((w, wIdx) => {
                    allRefWordsFlat.push({
                        verseIdx: vIdx,
                        wordIdx: wIdx,
                        text: w.text
                    });
                });
            });

            const referenceBuffer = allRefWordsFlat.map(w => w.text);
            const alignment = alignSequences(referenceBuffer, spokenWordsRaw);

            const newVerses = prev.map(v => ({ ...v, words: v.words.map(w => ({ ...w })) }));

            newVerses.forEach(v => v.words.forEach(w => {
                if (w.isHidden && !w.isPinned) {
                    w.userInput = "";
                    w.isCorrect = false;
                    w.isError = false;
                }
            }));

            alignment.forEach(item => {
                if (item.referenceIndex === -1) return;

                const refMeta = allRefWordsFlat[item.referenceIndex];
                const targetWord = newVerses[refMeta.verseIdx].words[refMeta.wordIdx];

                if (!targetWord.isHidden || targetWord.isPinned) return;

                if (item.type === 'MATCH') {
                    targetWord.isCorrect = true;
                    targetWord.isError = false;
                    targetWord.userInput = targetWord.text;
                } else if (item.type === 'MISMATCH') {
                    targetWord.isCorrect = false;
                    targetWord.isError = true;
                    targetWord.userInput = spokenWordsRaw[item.hypothesisIndex];
                }
            });

            return newVerses;
        });
    };

    useEffect(() => {
        handleVoiceInputRef.current = handleVoiceInput;
    }, [handleVoiceInput]);

    // --- CLOUD INPUT LOGIC (Firefox/Safari) ---
    const handleCloudResult = (filledWords: { word: string, isCorrect: boolean }[]) => {
        setVerses(prev => {
            const newVerses = prev.map(v => ({ ...v, words: v.words.map(w => ({ ...w })) }));
            const allHiddenWords = newVerses.flatMap(v => v.words).filter(w => w.isHidden);

            filledWords.forEach((fw, idx) => {
                if (idx < allHiddenWords.length) {
                    const targetWord = allHiddenWords[idx];
                    targetWord.userInput = fw.word;

                    if (fw.isCorrect) {
                        targetWord.isCorrect = true;
                        targetWord.isError = false;
                    } else {
                        targetWord.isCorrect = false;
                        targetWord.isError = true;
                    }
                }
            });
            return newVerses;
        });
    };

    const startCloudRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = (reader.result as string).split(',')[1];
                    const maskedText = verses.flatMap(v => v.words.map(w => {
                        return w.isHidden ? "[MASK]" : w.text;
                    })).join(" ");

                    try {
                        const result = await checkRecitationGaps(base64Audio, maskedText);
                        if (result.fullTranscript) {
                            setLiveTranscript(result.fullTranscript);
                        }
                        handleCloudResult(result.filledWords);
                    } catch (e) {
                        console.error("Cloud check failed", e);
                        setFeedbackMessage("تعذر التحقق. حاول مرة أخرى.");
                    } finally {
                        setIsProcessing(false);
                    }
                };
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setIsReceivingSound(true);
            setPermissionError(null);
        } catch (e) {
            console.error("Mic error", e);
            setPermissionError("تعذر الوصول للميكروفون.");
        }
    };

    const stopCloudRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsReceivingSound(false);
        }
    };

    // --- GAMEPLAY HELPERS ---
    const applyHiding = (level: number) => {
        const ratio = level * 0.25;
        setVerses(prev => prev.map(verse => {
            const words = [...verse.words];
            const unpinnedIndices = words.map((w, i) => w.isPinned ? -1 : i).filter(i => i !== -1);
            const shuffled = [...unpinnedIndices].sort(() => Math.random() - 0.5);
            const countToHide = Math.ceil(words.length * ratio);
            const indicesToHide = new Set(shuffled.slice(0, countToHide));

            return {
                ...verse,
                words: words.map((w, i) => ({
                    ...w,
                    isHidden: indicesToHide.has(i),
                    userInput: w.isPinned ? w.text : "",
                    isCorrect: w.isPinned,
                    isError: false
                }))
            };
        }));
    };

    const proceedProgression = () => {
        if (progressionLevel >= 4) {
            handleGameOver(true);
        } else {
            const next = progressionLevel + 1;
            setProgressionLevel(next);
            applyHiding(next);
            setFeedbackMessage(null);
            setLiveTranscript("");
        }
    };

    const handleNextLevel = () => {
        const currentHidden = verses.flatMap(v => v.words.filter(w => w.isHidden));
        const errors = currentHidden.filter(w => {
            if (w.isPinned) return false;
            if (!w.userInput) return false;
            return normalizeArabic(w.userInput) !== normalizeArabic(w.text);
        });
        const empties = currentHidden.filter(w => !w.userInput && !w.isPinned);

        if (empties.length > 0) {
            setFeedbackMessage("أكمل الفراغات أولاً!");
            setTimeout(() => setFeedbackMessage(null), 3000);
            return;
        }

        if (errors.length === 1) {
            setVerses(prev => prev.map(v => ({
                ...v,
                words: v.words.map(w => {
                    if (w.id === errors[0].id) {
                        return { ...w, userInput: w.text, isCorrect: true, isError: false };
                    }
                    return w;
                })
            })));
            setFeedbackMessage("تم تصحيح خطأ بسيط ✅");
            setTimeout(() => proceedProgression(), 1500);
            return;
        }

        if (errors.length > 1) {
            setFeedbackMessage(`لديك ${errors.length} أخطاء. انتبه للتصحيح!`);
            setVerses(prev => prev.map(v => ({
                ...v,
                words: v.words.map(w => {
                    if (errors.some(e => e.id === w.id)) {
                        return { ...w, userInput: w.text, isError: true };
                    }
                    return w;
                })
            })));
            setTimeout(() => {
                setVerses(prev => prev.map(v => ({
                    ...v,
                    words: v.words.map(w => {
                        if (errors.some(e => e.id === w.id)) {
                            return { ...w, userInput: "", isError: false, isCorrect: false };
                        }
                        return w;
                    })
                })));
                setFeedbackMessage("أعد المحاولة الآن");
            }, 3000);
            return;
        }

        proceedProgression();
    };

    const handleTextChange = (verseIndex: number, wordIndex: number, val: string) => {
        setVerses(prev => {
            const newVerses = [...prev];
            newVerses[verseIndex].words[wordIndex].userInput = val;
            newVerses[verseIndex].words[wordIndex].isError = false;
            return newVerses;
        });
    };

    const checkWrittenAnswers = () => {
        setVerses(prev => prev.map(v => ({
            ...v,
            words: v.words.map(w => {
                if (!w.isHidden) return w;
                const isMatch = normalizeArabic(w.userInput) === normalizeArabic(w.text);
                return {
                    ...w,
                    isCorrect: isMatch,
                    isError: !isMatch
                };
            })
        })));
    };

    const toggleRecording = () => {
        if (isCloudMode) {
            if (isRecording) stopCloudRecording();
            else startCloudRecording();
        } else {
            if (isRecording) {
                isRecordingRef.current = false;
                recognitionRef.current?.stop();
                setIsRecording(false);
                setIsReceivingSound(false);
            } else {
                setPermissionError(null);
                isRecordingRef.current = true;
                try {
                    recognitionRef.current?.start();
                } catch (e) {
                    setTimeout(() => { try { recognitionRef.current?.start(); } catch (err) { } }, 200);
                }
            }
        }
    };

    const togglePin = (verseIndex: number, wordIndex: number) => {
        setVerses(prev => {
            const newVerses = prev.map(v => ({ ...v, words: v.words.map(w => ({ ...w })) }));
            const word = newVerses[verseIndex].words[wordIndex];
            if (word.isError) {
                word.userInput = "";
                word.isError = false;
                word.isCorrect = false;
                return newVerses;
            }
            word.isPinned = !word.isPinned;
            if (word.isPinned) {
                word.isHidden = false;
                word.isCorrect = true;
            } else {
                word.isHidden = true;
                word.isCorrect = false;
            }
            return newVerses;
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900 overflow-hidden flex flex-col font-sans">
            {/* HEADER */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-700 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            // On early exit, award points for current progression
                            const currentScore = progressionLevel * 100; // Partial points
                            onExit(currentScore);
                        }}
                        className="group flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 shadow-lg"
                        title="Exit Game"
                    >
                        <span className="sr-only">Exit</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-red-400 transition-colors">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-white font-arcade text-lg">{surahName}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs">Level {progressionLevel}/4</span>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-arcade-cyan transition-all" style={{ width: `${(progressionLevel / 4) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {progressionLevel === 0 && (
                        <div className="text-yellow-400 text-xs animate-pulse font-arabic">
                            اضغط "ابدأ الحفظ" للإخفاء التدريجي
                        </div>
                    )}
                    {isCloudMode && (
                        <div className="bg-slate-800 px-2 py-1 rounded text-[10px] text-slate-400 border border-slate-700 flex items-center gap-1">
                            <CloudCog size={12} />
                            وضع المتصفح المتوافق
                        </div>
                    )}
                </div>
            </div>

            {/* VERSES AREA */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-8 rtl-text pb-32">
                    {verses.map((verse, vIdx) => (
                        <div key={vIdx} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg relative transition-all">
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-300 font-mono border border-slate-600">
                                {verse.verseNumber}
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-6 text-2xl md:text-3xl font-arabic leading-loose justify-center">
                                {verse.words.map((word, wIdx) => {
                                    if (word.isHidden) {
                                        return (
                                            <div key={word.id} className="relative min-w-[80px] h-14 inline-block group">
                                                {inputMode === 'TEXT' ? (
                                                    <input
                                                        type="text"
                                                        value={word.userInput}
                                                        onChange={(e) => handleTextChange(vIdx, wIdx, e.target.value)}
                                                        className={`
                                                        w-full h-full bg-transparent border-b-2 text-center focus:outline-none font-bold transition-colors
                                                        ${word.isCorrect ? 'border-green-500 text-green-400 bg-green-900/10' :
                                                                word.isError ? 'border-red-500 text-red-400 bg-red-900/10' : 'border-slate-500 text-white'}
                                                    `}
                                                        placeholder="..."
                                                        dir="rtl"
                                                    />
                                                ) : (
                                                    <div className={`
                                                    w-full h-full min-w-[90px] px-2 flex items-center justify-center border-b-2 border-dashed transition-all rounded-lg
                                                    ${word.isCorrect
                                                            ? 'border-green-500 text-green-400 font-bold bg-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]'
                                                            : (word.isError
                                                                ? 'border-red-500 text-red-400 font-bold bg-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.2)]'
                                                                : (isRecording ? 'border-arcade-cyan text-white shadow-[0_0_5px_rgba(6,182,212,0.3)]' : 'border-slate-600 text-slate-400'))}
                                                `}>
                                                        {isProcessing ? (
                                                            <Loader2 className="animate-spin text-arcade-cyan w-5 h-5" />
                                                        ) : (
                                                            <span className={`text-lg truncate max-w-full font-arabic ${word.isError ? 'text-red-400 animate-pulse' : (word.isCorrect ? 'text-green-400' : 'opacity-70')}`}>
                                                                {word.userInput || "..."}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {word.isCorrect && <CheckCircle2 size={16} className="absolute -top-3 -right-2 text-green-500 bg-slate-800 rounded-full" />}

                                                {word.isHidden && !word.isCorrect && (
                                                    <button
                                                        onClick={() => togglePin(vIdx, wIdx)}
                                                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 hover:text-yellow-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                                    >
                                                        <Pin size={10} /> تثبيت
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <span
                                                key={word.id}
                                                onClick={() => togglePin(vIdx, wIdx)}
                                                className={`
                                                relative px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors select-none
                                                ${word.isPinned ? 'text-yellow-200 bg-yellow-900/20' : 'text-white'}
                                            `}
                                            >
                                                {word.text}
                                                {word.isPinned && <Pin size={10} className="absolute -top-1 -left-1 text-yellow-500" />}
                                            </span>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 z-50">

                <AnimatePresence>
                    {feedbackMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: -20 }} exit={{ opacity: 0 }}
                            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded-full shadow-lg text-sm font-bold z-50 whitespace-nowrap"
                        >
                            <AlertTriangle className="inline-block w-4 h-4 mr-2" />
                            {feedbackMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle Input Mode */}
                <div className="flex justify-center mb-4">
                    <div className="bg-slate-800 p-1 rounded-full flex gap-1">
                        <button
                            onClick={() => { setInputMode('AUDIO'); setIsRecording(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${inputMode === 'AUDIO' ? 'bg-arcade-cyan text-slate-900' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Speech size={16} /> تلاوة
                        </button>
                        <button
                            onClick={() => { setInputMode('TEXT'); setIsRecording(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${inputMode === 'TEXT' ? 'bg-arcade-purple text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Keyboard size={16} /> كتابة
                        </button>
                    </div>
                </div>

                {/* Instruction Text */}
                {inputMode === 'AUDIO' && progressionLevel > 0 && (
                    <div className="text-center mb-3 animate-in fade-in slide-in-from-bottom-2">
                        <span className="bg-slate-800/80 text-arcade-yellow text-xs px-4 py-1.5 rounded-full border border-slate-700 font-arabic flex items-center justify-center gap-2 mx-auto w-fit">
                            <Info size={14} />
                            تنبيه: اقرأ الآية كاملة بشكل متصل لملء الفراغات
                        </span>
                    </div>
                )}

                {/* Action Row */}
                <div className="flex items-center gap-4 justify-center max-w-lg mx-auto">

                    {progressionLevel > 0 && (
                        inputMode === 'TEXT' ? (
                            <ArcadeButton onClick={checkWrittenAnswers} variant="secondary" className="w-16 h-14 flex items-center justify-center !p-0 rounded-xl">
                                <CheckCircle2 size={24} />
                            </ArcadeButton>
                        ) : (
                            <div className="flex flex-col items-center relative">
                                {/* Live Transcript Bubble */}
                                {isRecording && (
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-50">
                                        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border shadow-lg transition-colors duration-300
                                        ${isReceivingSound
                                                ? 'bg-arcade-cyan/10 border-arcade-cyan text-arcade-cyan'
                                                : 'bg-slate-800 border-slate-600 text-slate-400'}
                                    `}>
                                            {isReceivingSound ? <Volume2 size={12} className="animate-pulse" /> : <Wifi size={12} />}
                                            <span className="font-arabic max-w-[200px] truncate">
                                                {isCloudMode ? "جاري التسجيل..." : (liveTranscript || "في انتظار التلاوة...")}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={toggleRecording}
                                    disabled={isProcessing}
                                    className={`
                                    w-16 h-14 rounded-xl border-b-4 flex items-center justify-center transition-all active:border-b-0 active:translate-y-1 relative overflow-hidden
                                    ${isRecording ? 'bg-slate-800 border-slate-900 text-red-500' : 'bg-slate-700 border-slate-900 text-arcade-cyan hover:bg-slate-600'}
                                    ${isReceivingSound ? 'ring-2 ring-arcade-cyan ring-offset-2 ring-offset-slate-900' : ''}
                                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="animate-spin text-white" />
                                    ) : isRecording ? (
                                        <>
                                            <Mic className="z-10 relative" />
                                            {/* Audio Wave Visualizer Background */}
                                            {isReceivingSound && (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                                    <div className="w-full h-full bg-arcade-cyan animate-pulse rounded-full scale-150 blur-md"></div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <MicOff />
                                    )}
                                </button>
                            </div>
                        )
                    )}

                    <ArcadeButton
                        onClick={handleNextLevel}
                        className="flex-1"
                        variant={progressionLevel >= 4 ? 'success' : 'primary'}
                    >
                        {progressionLevel >= 4 ? 'إنهاء' : (progressionLevel === 0 ? 'ابدأ الحفظ (25% إخفاء)' : `المستوى التالي (${(progressionLevel + 1) * 25}%)`)} <ArrowRight size={18} />
                    </ArcadeButton>

                </div>

                {isProcessing && (
                    <div className="text-center mt-2 text-arcade-cyan text-xs font-arcade animate-pulse">
                        جاري التحقق من التلاوة...
                    </div>
                )}

                {permissionError ? (
                    <div className="text-center mt-2 text-red-400 text-xs font-bold animate-pulse">
                        {permissionError}
                    </div>
                ) : (
                    isRecording && (
                        <div className="text-center mt-2 text-slate-500 text-[10px]">
                            {isCloudMode
                                ? "أكمل التلاوة ثم اضغط للتحقق"
                                : (isReceivingSound ? "جاري استقبال الصوت..." : "الميكروفون نشط، بانتظار الكلام...")}
                        </div>
                    )
                )}
            </div>

        </div>
    );
};
