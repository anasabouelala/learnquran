

import React, { useState, useRef, useMemo } from 'react';
import { Mic, ArrowLeft, Activity, Keyboard, Brain, FileAudio, Book, AlertTriangle, CheckCircle2, XCircle, Sparkles, Lightbulb, Waveform, Info } from 'lucide-react';
import { ArcadeButton } from '../ui/ArcadeButton';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeRecitation } from '../../services/geminiService';
import { saveDiagnosticResult } from '../../services/storageService'; // Added
import { DiagnosticResult, DiagnosticMistake } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  targetSurah?: string; // New Prop
  onDiagnosticComplete: (surah: string, startVerse: number, endVerse?: number) => void;
  onBack: () => void;
}

export const DiagnosticScreen: React.FC<Props> = ({ targetSurah, onDiagnosticComplete, onBack }) => {
  const [mode, setMode] = useState<'AUDIO' | 'TEXT' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop mic
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("تعذر الوصول إلى الميكروفون. يرجى التحقق من الأذونات.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setAnalyzing(true);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(',')[1];
      try {
        const diagnosis = await analyzeRecitation({ 
            audioBase64: base64Audio,
            targetSurah: targetSurah
        });
        setResult(diagnosis);
        if (diagnosis && diagnosis.surahName) {
            saveDiagnosticResult(diagnosis.surahName, diagnosis.overallScore);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAnalyzing(false);
      }
    };
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;
    setAnalyzing(true);
    try {
      const diagnosis = await analyzeRecitation({ 
          text: inputText,
          targetSurah: targetSurah
      });
      setResult(diagnosis);
      if (diagnosis && diagnosis.surahName) {
         saveDiagnosticResult(diagnosis.surahName, diagnosis.overallScore);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartMission = () => {
    if (result) {
      onDiagnosticComplete(result.surahName, result.startVerse, result.endVerse);
    }
  };

  // Group mistakes by type for the detailed view
  const groupedMistakes = useMemo(() => {
      if (!result) return { MEMORIZATION: [], TAJWEED: [], PRONUNCIATION: [] };
      return {
          MEMORIZATION: result.mistakes.filter(m => m.type === 'MEMORIZATION'),
          TAJWEED: result.mistakes.filter(m => m.type === 'TAJWEED'),
          PRONUNCIATION: result.mistakes.filter(m => m.type === 'PRONUNCIATION'),
      };
  }, [result]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 relative overflow-hidden font-sans">
        {/* Background FX */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_#0f172a_50%)] z-0"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-6xl flex flex-col h-full items-center justify-center">
            
            {/* Header - Only show if not deep in a mode */}
            {!result && !analyzing && (
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8 mt-8">
                    <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-600 px-4 py-1.5 rounded-full mb-4">
                        <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                        <span className="text-slate-300 text-xs font-arcade tracking-wider">الماسح القرآني الذكي</span>
                    </div>
                    {targetSurah && (
                         <h3 className="text-xl font-arabic text-arcade-cyan mb-2">اختبار: {targetSurah}</h3>
                    )}
                    <h2 className="text-4xl md:text-5xl font-arcade text-white drop-shadow-lg mb-3">
                        {targetSurah ? "كيف تريد أن تُسمّع؟" : "كيف تريد أن أختبرك؟"}
                    </h2>
                </motion.div>
            )}

            {/* Main Selection Cards */}
            {!result && !analyzing && !mode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                    <motion.button 
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('AUDIO')}
                        className="bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-arcade-cyan p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl transition-all group"
                    >
                        <div className="w-24 h-24 bg-arcade-cyan/10 rounded-full flex items-center justify-center group-hover:bg-arcade-cyan/20 transition-colors">
                            <Mic className="w-12 h-12 text-arcade-cyan" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">تلاوة صوتية</h3>
                            <p className="text-slate-400 text-sm">اقرأ بصوتك وسأستمع إليك</p>
                        </div>
                    </motion.button>

                    <motion.button 
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('TEXT')}
                        className="bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-arcade-purple p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl transition-all group"
                    >
                        <div className="w-24 h-24 bg-arcade-purple/10 rounded-full flex items-center justify-center group-hover:bg-arcade-purple/20 transition-colors">
                            <Keyboard className="w-12 h-12 text-arcade-purple" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">كتابة النص</h3>
                            <p className="text-slate-400 text-sm">اكتب الآيات التي تحفظها</p>
                        </div>
                    </motion.button>
                </div>
            )}

            {/* Input Modes */}
            <AnimatePresence mode='wait'>
                {mode && !result && !analyzing && (
                    <motion.div 
                        key="input-container"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-lg bg-slate-800/90 p-8 rounded-3xl border border-slate-600 shadow-2xl relative"
                    >
                        <button 
                             onClick={() => setMode(null)}
                             className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        {mode === 'AUDIO' ? (
                            <div className="flex flex-col items-center py-8">
                                <h3 className="text-white font-arcade text-xl mb-8">اضغط على الميكروفون للبدء</h3>
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-300 relative ${
                                        isRecording 
                                        ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_60px_rgba(239,68,68,0.3)]' 
                                        : 'bg-slate-700/50 border-arcade-cyan text-arcade-cyan hover:bg-slate-700 hover:scale-105 shadow-[0_0_30px_rgba(6,182,212,0.1)]'
                                    }`}
                                >
                                    {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-500 opacity-50 animate-ping"></div>}
                                    {isRecording ? <div className="w-12 h-12 bg-red-500 rounded-lg animate-pulse" /> : <Mic className="w-16 h-16" />}
                                </button>
                                <p className={`mt-8 font-arcade text-sm ${isRecording ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                                    {isRecording ? 'جاري التسجيل... (اقرأ بوضوح)' : 'هل أنت جاهز؟'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center mb-2">
                                    <h3 className="text-white font-arcade text-xl">اكتب ما تحفظ</h3>
                                    <p className="text-slate-400 text-xs mt-1">يمكنك كتابة آية واحدة أو مقطع</p>
                                </div>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="بسم الله الرحمن الرحيم..."
                                    className="w-full h-48 bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 text-right font-arabic text-xl text-white focus:border-arcade-purple focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] focus:outline-none resize-none leading-relaxed"
                                    dir="rtl"
                                />
                                <ArcadeButton onClick={handleTextSubmit} size="lg" variant="secondary" className="w-full">
                                    تحليل النص المكتوب
                                </ArcadeButton>
                            </div>
                        )}
                    </motion.div>
                )}
                
                {analyzing && (
                     <motion.div 
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-arcade-cyan border-r-arcade-cyan border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            <Activity className="absolute inset-0 m-auto text-arcade-cyan w-10 h-10 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 font-arcade">جاري المعالجة...</h2>
                        <p className="text-slate-400">تحليل الأنماط الصوتية ومقارنتها</p>
                    </motion.div>
                )}

                {/* --- RESULT VIEW DASHBOARD --- */}
                {result && (
                     <motion.div 
                        key="result"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-20"
                    >
                        
                        {/* 1. TOP HEADER: ACTIONS & SUMMARY */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl shrink-0">
                            <div>
                                <h2 className="text-3xl font-arcade text-white mb-1 flex items-center gap-3">
                                    {result.surahName}
                                    <span className="text-sm bg-slate-700 text-slate-300 px-3 py-1 rounded-full font-mono">
                                        Verses {result.startVerse} - {result.endVerse || 'End'}
                                    </span>
                                </h2>
                                <p className="text-slate-400 text-sm font-arabic max-w-xl leading-relaxed">
                                    {result.diagnosis}
                                </p>
                            </div>
                            <div className="flex gap-3 shrink-0 w-full md:w-auto">
                                <ArcadeButton onClick={handleStartMission} variant="success" className="flex-1 md:flex-none animate-bounce-short">
                                    ابدأ التدريب
                                </ArcadeButton>
                                <button onClick={() => {setResult(null); setMode(null);}} className="px-6 py-3 rounded-xl border-2 border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 hover:bg-slate-700 transition-all font-bold font-arcade text-sm">
                                    خروج
                                </button>
                            </div>
                        </div>

                        {/* 2. VOICE GRAPH VISUALIZATION */}
                        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 relative overflow-hidden shrink-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-arcade-cyan via-arcade-purple to-arcade-cyan opacity-50"></div>
                            
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-arcade-cyan font-arcade text-lg flex items-center gap-2">
                                    <Activity size={20} /> المخطط الصوتي
                                </h3>
                                <span className="text-slate-500 text-xs font-mono">TIMELINE ANALYSIS</span>
                            </div>

                            <VoiceTimeline 
                                result={result} 
                            />
                        </div>

                        {/* 3. DETAILED BREAKDOWN COLUMNS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* COLUMN 1: MEMORIZATION */}
                            <DetailColumn 
                                title="الحفظ والإتقان" 
                                score={result.metrics.memorization} 
                                mistakes={groupedMistakes.MEMORIZATION}
                                color="blue"
                                icon={<Brain className="w-5 h-5" />}
                            />

                            {/* COLUMN 2: TAJWEED */}
                            <DetailColumn 
                                title="التجويد والأحكام" 
                                score={result.metrics.tajweed} 
                                mistakes={groupedMistakes.TAJWEED}
                                color="purple"
                                icon={<FileAudio className="w-5 h-5" />}
                            />

                            {/* COLUMN 3: PRONUNCIATION */}
                            <DetailColumn 
                                title="المخارج والنطق" 
                                score={result.metrics.pronunciation} 
                                mistakes={groupedMistakes.PRONUNCIATION}
                                color="orange"
                                icon={<Mic className="w-5 h-5" />}
                            />

                        </div>

                        {/* TEXT PREVIEW TOGGLE */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl">
                            <details className="group p-4">
                                <summary className="flex items-center justify-between cursor-pointer text-slate-400 hover:text-white transition-colors list-none font-arcade text-xs tracking-widest uppercase">
                                    <span>عرض النص الملتقط (Transcript)</span>
                                    <ArrowLeft size={16} className="group-open:-rotate-90 transition-transform" />
                                </summary>
                                <div className="mt-4 bg-black/40 p-4 rounded-lg text-right font-arabic text-slate-300 text-lg leading-loose border-r-2 border-arcade-cyan">
                                    "{result.identifiedText}"
                                </div>
                            </details>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Back Button (Only if no result) */}
            {!result && !analyzing && (
                 <button onClick={onBack} className="absolute bottom-8 text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                     <ArrowLeft className="w-4 h-4" /> العودة للقائمة الرئيسية
                 </button>
            )}
        </div>
    </div>
  );
};

// --- SUB-COMPONENT: VOICE TIMELINE ---
const VoiceTimeline: React.FC<{ result: DiagnosticResult }> = ({ result }) => {
    // Generate dummy waveform bars
    const bars = Array.from({ length: 60 });
    
    // Normalize position based on verse range
    const startVerse = result.startVerse;
    const endVerse = result.endVerse || (startVerse + 10);
    const totalVerses = endVerse - startVerse + 1;

    const getPosition = (verseNum: number) => {
        const relative = verseNum - startVerse;
        const pct = (relative / totalVerses) * 100;
        return Math.min(Math.max(pct, 0), 100);
    };

    return (
        <div className="relative h-32 w-full flex items-center justify-center">
            {/* Background Waveform Visual */}
            <div className="absolute inset-0 flex items-center justify-between gap-[2px] opacity-20 pointer-events-none">
                {bars.map((_, i) => {
                    const height = 20 + Math.random() * 60;
                    return (
                        <div 
                            key={i} 
                            className="w-full bg-arcade-cyan rounded-full transition-all duration-500"
                            style={{ height: `${height}%` }}
                        ></div>
                    );
                })}
            </div>

            {/* The Timeline Line */}
            <div className="absolute w-full h-1 bg-slate-600/50 rounded-full"></div>

            {/* Error Points */}
            {result.mistakes.map((mistake, idx) => {
                const pos = getPosition(mistake.verse);
                const color = mistake.type === 'MEMORIZATION' ? 'bg-red-500' : 
                              mistake.type === 'TAJWEED' ? 'bg-purple-500' : 'bg-orange-500';
                
                return (
                    <div 
                        key={idx}
                        className="absolute top-1/2 -translate-y-1/2 group z-10"
                        style={{ left: `${pos}%` }}
                    >
                        {/* The Dot */}
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                            className={`w-4 h-4 rounded-full ${color} border-2 border-slate-900 shadow-[0_0_10px_currentColor] cursor-pointer hover:scale-150 transition-transform`}
                        ></motion.div>

                        {/* The Pulse Effect */}
                        <div className={`absolute inset-0 rounded-full ${color} animate-ping opacity-50 pointer-events-none`}></div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <div className="bg-slate-800 border border-slate-600 p-3 rounded-lg shadow-xl text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 mb-1 inline-block ${mistake.type === 'MEMORIZATION' ? 'text-red-400' : mistake.type === 'TAJWEED' ? 'text-purple-400' : 'text-orange-400'}`}>
                                    الآية {mistake.verse}
                                </span>
                                <p className="text-white text-xs font-arabic line-clamp-2">{mistake.description}</p>
                            </div>
                            {/* Triangle Arrow */}
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-600 mx-auto"></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- SUB-COMPONENT: DETAIL COLUMN ---
const DetailColumn: React.FC<{ 
    title: string, 
    score: number, 
    mistakes: DiagnosticMistake[], 
    color: string, 
    icon: React.ReactNode 
}> = ({ title, score, mistakes, color, icon }) => {
    
    // Map tailwind colors roughly for dynamic classes (safest to use explicit maps or style props)
    const colorClasses: any = {
        blue: { text: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-500/30', lightBg: 'bg-blue-900/10' },
        purple: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500/30', lightBg: 'bg-purple-900/10' },
        orange: { text: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500/30', lightBg: 'bg-orange-900/10' },
    };
    
    const theme = colorClasses[color];

    return (
        <div className={`bg-slate-800 border-2 ${theme.border} rounded-2xl flex flex-col h-full overflow-hidden`}>
            {/* Header Score */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-900/30">
                <div className="flex justify-between items-center mb-3">
                    <h3 className={`font-arcade text-sm flex items-center gap-2 ${theme.text}`}>
                        {icon} {title}
                    </h3>
                    <span className="text-white font-bold text-lg">{score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${theme.bg}`}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 p-4 space-y-3 bg-slate-800/50 custom-scrollbar overflow-y-auto max-h-[400px]">
                {mistakes.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <CheckCircle2 size={32} className={`mb-2 ${theme.text}`} />
                        <p className="text-sm font-arabic">أداء ممتاز!</p>
                    </div>
                ) : (
                    mistakes.map((mistake, i) => (
                        <div key={i} className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 hover:border-slate-500 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-500 text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded">
                                    Verse {mistake.verse}
                                </span>
                                {mistake.correction && (
                                    <span className="text-green-400 text-xs font-arabic">{mistake.correction}</span>
                                )}
                            </div>
                            
                            <div className="text-right">
                                <p className={`font-arabic text-lg ${theme.text} line-through decoration-white/20 mb-1`}>
                                    {mistake.text}
                                </p>
                                <p className="text-slate-300 text-xs font-arabic leading-relaxed mb-2">
                                    {mistake.description}
                                </p>
                                {mistake.advice && (
                                    <div className={`mt-2 p-2 rounded-lg ${theme.lightBg} border border-slate-700/50 flex gap-2 items-start justify-end`}>
                                        <p className="text-slate-200 text-[10px] font-arabic leading-relaxed">
                                            {mistake.advice}
                                        </p>
                                        <Lightbulb size={12} className="text-yellow-400 shrink-0 mt-0.5" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
