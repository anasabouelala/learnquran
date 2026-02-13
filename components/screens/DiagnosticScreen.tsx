

import React, { useState, useRef, useMemo } from 'react';
import { Mic, ArrowLeft, Activity, Keyboard, Brain, FileAudio, Book, AlertTriangle, CheckCircle2, XCircle, Sparkles, Lightbulb, Info, RefreshCcw } from 'lucide-react';
import { ArcadeButton } from '../ui/ArcadeButton';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeRecitation } from '../../services/geminiService';
import { saveDiagnosticResult } from '../../services/storageService'; // Added
import { DiagnosticResult, DiagnosticMistake } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
    targetSurah?: string; // New Prop
    startVerse?: number;
    endVerse?: number;
    initialResult?: DiagnosticResult | null; // Added
    onDiagnosticComplete: (surah: string, startVerse: number, endVerse?: number) => void;
    onBack: () => void;
}

export const DiagnosticScreen: React.FC<Props> = ({ targetSurah, startVerse, endVerse, initialResult, onDiagnosticComplete, onBack }) => {
    const [mode, setMode] = useState<'AUDIO' | 'TEXT' | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [inputText, setInputText] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<DiagnosticResult | null>(initialResult || null);
    const [liveTranscript, setLiveTranscript] = useState(""); // NEW: Live transcription

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null); // NEW: Speech recognition


    const startRecording = async () => {
        console.log("[RECORDING] Start button clicked!");
        setLiveTranscript(""); // Reset transcript

        try {
            console.log("[RECORDING] Requesting microphone access...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("[RECORDING] Microphone access granted!");

            // Start audio recording
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                console.log("[RECORDING] Data chunk received, size:", event.data.size);
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log("[RECORDING] Recording stopped, processing...");
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                console.log("[RECORDING] Audio blob created, size:", audioBlob.size);
                await processAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000);

            // Start speech recognition for live transcript
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'ar-SA'; // Arabic
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event: any) => {
                    let transcript = '';
                    for (let i = 0; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript;
                    }
                    console.log("[SPEECH] Transcript:", transcript);
                    setLiveTranscript(transcript);
                };

                recognition.onerror = (event: any) => {
                    console.error("[SPEECH] Recognition error:", event.error);
                };

                recognition.start();
                recognitionRef.current = recognition;
                console.log("[SPEECH] Recognition started");
            }

            setIsRecording(true);
            console.log("[RECORDING] Recording started!");
        } catch (err) {
            console.error("[RECORDING] Error accessing microphone:", err);
            alert("تعذر الوصول إلى الميكروفون. يرجى التحقق من الأذونات.");
        }
    };

    const stopRecording = () => {
        console.log("[RECORDING] Stop button clicked!");
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            console.log("[RECORDING] Stop command sent to recorder");
        }

        // Stop speech recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            console.log("[SPEECH] Recognition stopped");
        }
    };

    const processAudio = async (blob: Blob) => {
        setAnalyzing(true);
        console.log("[DIAGNOSTIC] Processing audio blob, size:", blob.size, "type:", blob.type);

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            // Ensure we strip the data URL prefix (e.g., "data:audio/webm;base64,")
            const base64Audio = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            console.log("[DIAGNOSTIC] Base64 audio length:", base64Audio.length);

            try {
                const diagnosis = await analyzeRecitation({
                    audioBase64: base64Audio,
                    targetSurah: targetSurah,
                    range: (startVerse) ? { start: startVerse, end: endVerse } : undefined
                });
                console.log("[DIAGNOSTIC] Analysis result:", diagnosis);
                setResult(diagnosis);
                if (diagnosis && diagnosis.surahName) {
                    saveDiagnosticResult(diagnosis.surahName, diagnosis.overallScore, diagnosis.startVerse, diagnosis.endVerse);
                }
            } catch (e: any) {
                console.error("[DIAGNOSTIC] Analysis error:", e?.message || e);
                // Set a fallback result so user sees feedback
                setResult({
                    surahName: targetSurah || "Error",
                    startVerse: startVerse || 1,
                    overallScore: 0,
                    metrics: { memorization: 0, tajweed: 0, pronunciation: 0 },
                    mistakes: [],
                    diagnosis: `Error: ${e?.message || "Unknown error occurred"}`,
                    identifiedText: ""
                });
            } finally {
                setAnalyzing(false);
            }
        };

        reader.onerror = (error) => {
            console.error("[DIAGNOSTIC] FileReader error:", error);
            setAnalyzing(false);
        };
    };

    const handleTextSubmit = async () => {
        if (!inputText.trim()) return;
        console.log("[TEXT ANALYSIS] Starting with text:", inputText.substring(0, 50));
        setAnalyzing(true);
        try {
            const diagnosis = await analyzeRecitation({
                text: inputText,
                targetSurah: targetSurah,
                range: (startVerse) ? { start: startVerse, end: endVerse } : undefined
            });
            console.log("[TEXT ANALYSIS] Result received:", diagnosis);
            setResult(diagnosis);
            if (diagnosis && diagnosis.surahName) {
                saveDiagnosticResult(diagnosis.surahName, diagnosis.overallScore, diagnosis.startVerse, diagnosis.endVerse);
            }
        } catch (e: any) {
            console.error("[TEXT ANALYSIS] Error:", e?.message || e);
            // Show error in UI
            setResult({
                surahName: targetSurah || "Error",
                startVerse: startVerse || 1,
                overallScore: 0,
                metrics: { memorization: 0, tajweed: 0, pronunciation: 0 },
                mistakes: [],
                diagnosis: `Error: ${e?.message || "Unknown error"}`,
                identifiedText: inputText
            });
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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 relative overflow-hidden font-cairo selection:bg-indigo-500/30">
            {/* Background FX (Matching MainMenu) */}
            <div className="fixed inset-0 bg-[#0f172a] -z-20"></div>
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 -z-10"></div>
            <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 -z-10"></div>

            <div className="relative z-10 w-full max-w-6xl flex flex-col h-full items-center justify-center">

                {/* Standardized Close Button */}
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 group flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 shadow-lg z-50"
                    title="Exit"
                >
                    <span className="sr-only">Exit</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-red-400 transition-colors">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                </button>

                {/* Header - Only show if not deep in a mode */}
                {!result && !analyzing && (
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8 mt-8">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 rounded-full mb-6">
                            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                            <span className="text-indigo-300 text-xs font-bold">الماسح القرآني الذكي</span>
                        </div>
                        {targetSurah && (
                            <h3 className="text-xl font-bold text-cyan-400 mb-2">اختبار: {targetSurah}</h3>
                        )}
                        <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-3 leading-tight">
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
                            className="bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan-500/50 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl transition-all group"
                        >
                            <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all text-cyan-400">
                                <Mic className="w-10 h-10" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-cyan-400 transition-colors">تلاوة صوتية</h3>
                                <p className="text-slate-400 text-sm font-bold">اقرأ بصوتك وسأستمع إليك</p>
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, translateY: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setMode('TEXT')}
                            className="bg-slate-800/80 hover:bg-slate-800 border-2 border-slate-700 hover:border-purple-500/50 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl transition-all group"
                        >
                            <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all text-purple-400">
                                <Keyboard className="w-10 h-10" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-purple-400 transition-colors">كتابة النص</h3>
                                <p className="text-slate-400 text-sm font-bold">اكتب الآيات التي تحفظها</p>
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
                                    <h3 className="text-white font-bold text-2xl mb-8">اضغط على الميكروفون للبدء</h3>
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-300 relative group ${isRecording
                                            ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_60px_rgba(239,68,68,0.3)]'
                                            : 'bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 text-cyan-400 hover:scale-105 hover:border-cyan-400 shadow-xl'
                                            }`}
                                    >
                                        {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-500 opacity-50 animate-ping"></div>}
                                        {isRecording ? <div className="w-12 h-12 bg-red-500 rounded-lg animate-pulse" /> : <Mic className="w-16 h-16 group-hover:text-cyan-300 transition-colors" />}
                                    </button>
                                    <p className={`mt-8 font-bold text-base ${isRecording ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                                        {isRecording ? 'جاري التسجيل... (اقرأ بوضوح)' : 'هل أنت جاهز؟'}
                                    </p>

                                    {/* Live Transcript Display */}
                                    {liveTranscript && (
                                        <div className="mt-6 p-6 bg-slate-950/50 border border-cyan-500/20 rounded-2xl w-full">
                                            <p className="text-xs text-cyan-400 mb-3 font-bold">ما قلته:</p>
                                            <p className="text-white text-xl font-cairo leading-loose text-center" dir="rtl">
                                                {liveTranscript}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center mb-2">
                                        <h3 className="text-white font-black text-2xl">اكتب ما تحفظ</h3>
                                        <p className="text-slate-400 text-sm mt-1 font-bold">يمكنك كتابة آية واحدة أو مقطع</p>
                                    </div>
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="بسم الله الرحمن الرحيم..."
                                        className="w-full h-48 bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 text-right font-cairo text-xl text-white focus:border-purple-500 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] focus:outline-none resize-none leading-relaxed placeholder:text-slate-600"
                                        dir="rtl"
                                    />
                                    <ArcadeButton onClick={handleTextSubmit} size="lg" variant="secondary" className="w-full font-bold">
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
                                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-cyan-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                <Activity className="absolute inset-0 m-auto text-cyan-500 w-10 h-10 animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">جاري المعالجة...</h2>
                            <p className="text-slate-400 font-bold">تحليل الأنماط الصوتية ومقارنتها</p>
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
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 p-6 rounded-[2rem] border border-slate-700 shadow-xl shrink-0 backdrop-blur-sm">
                                <div>
                                    <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                                        {result.surahName}
                                        <span className="text-sm bg-slate-700 text-slate-300 px-4 py-1.5 rounded-full font-bold">
                                            Verses {result.startVerse} - {result.endVerse || 'End'}
                                        </span>
                                    </h2>
                                    <p className="text-slate-300 text-base font-medium max-w-xl leading-relaxed">
                                        {result.diagnosis}
                                    </p>
                                </div>
                                <div className="flex gap-3 shrink-0 w-full md:w-auto">
                                    <ArcadeButton onClick={handleStartMission} variant="success" className="flex-1 md:flex-none animate-bounce-short font-bold">
                                        الآيات التالية <ArrowLeft className="w-4 h-4 mr-1" />
                                    </ArcadeButton>
                                    <button onClick={() => { setResult(null); setMode(null); }} className="px-5 py-3 rounded-2xl border-2 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all font-bold text-sm">
                                        <RefreshCcw className="w-5 h-5" />
                                    </button>
                                    <button onClick={onBack} className="px-6 py-3 rounded-2xl border-2 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all font-bold text-sm">
                                        قائمة الألعاب
                                    </button>
                                </div>
                            </div>

                            {/* 2. VOICE GRAPH VISUALIZATION */}
                            <div className="bg-slate-900 border-2 border-slate-700 rounded-[2rem] p-8 relative overflow-hidden shrink-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-50"></div>

                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
                                        <Activity size={20} /> المخطط الصوتي
                                    </h3>
                                    <span className="text-slate-500 text-xs font-bold tracking-widest">TIMELINE ANALYSIS</span>
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
                            {/* TEXT PREVIEW TOGGLE */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl">
                                <details className="group p-4">
                                    <summary className="flex items-center justify-between cursor-pointer text-slate-400 hover:text-white transition-colors list-none font-bold text-xs tracking-widest uppercase">
                                        <span>عرض النص الملتقط (Transcript)</span>
                                        <ArrowLeft size={16} className="group-open:-rotate-90 transition-transform" />
                                    </summary>
                                    <div className="mt-4 bg-black/40 p-4 rounded-xl text-center font-cairo text-slate-300 text-xl leading-loose border-2 border-slate-800">
                                        "{result.identifiedText}"
                                    </div>
                                </details>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>


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
                            className="w-full bg-cyan-500/30 rounded-full transition-all duration-500"
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
                                <p className="text-white text-xs font-medium line-clamp-2">{mistake.description}</p>
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

    const colorClasses: any = {
        blue: { text: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-500/30', lightBg: 'bg-blue-500/10' },
        purple: { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500/30', lightBg: 'bg-purple-500/10' },
        orange: { text: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500/30', lightBg: 'bg-orange-500/10' },
    };

    const theme = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`bg-slate-800 border-2 ${theme.border} rounded-[2rem] flex flex-col h-full overflow-hidden shadow-lg hover:-translate-y-1 transition-transform`}>
            {/* Header Score */}
            <div className="p-6 border-b border-slate-700/50 bg-slate-900/30">
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-black text-lg flex items-center gap-2 ${theme.text}`}>
                        {icon} {title}
                    </h3>
                    <span className="text-white font-black text-2xl">{score}%</span>
                </div>
                <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${theme.bg} shadow-[0_0_10px_currentColor]`}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 p-4 space-y-3 bg-slate-800/30 custom-scrollbar overflow-y-auto max-h-[400px]">
                {mistakes.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <div className={`p-4 rounded-full ${theme.lightBg} mb-3`}>
                            <CheckCircle2 size={32} className={`${theme.text}`} />
                        </div>
                        <p className="font-bold text-lg">أداء ممتاز!</p>
                        <p className="text-xs">لا توجد أخطاء في هذا القسم</p>
                    </div>
                ) : (
                    mistakes.map((mistake, i) => (
                        <div key={i} className="bg-slate-900/60 border border-slate-700 hover:border-slate-500 rounded-2xl p-4 transition-all group">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400 text-[11px] font-bold bg-slate-800 px-2.5 py-1 rounded-lg">
                                    Verse {mistake.verse}
                                </span>
                                {mistake.correction && (
                                    <span className="text-emerald-400 text-sm font-bold">{mistake.correction}</span>
                                )}
                            </div>

                            <div className="text-right">
                                <p className={`font-cairo font-bold text-xl ${theme.text} line-through decoration-white/20 mb-2 opacity-80`}>
                                    {mistake.text}
                                </p>
                                <p className="text-slate-300 text-sm font-medium leading-relaxed mb-3">
                                    {mistake.description}
                                </p>
                                {mistake.advice && (
                                    <div className={`mt-2 p-3 rounded-xl ${theme.lightBg} border border-slate-700/30 flex gap-3 items-start justify-end`}>
                                        <p className="text-slate-200 text-xs font-medium leading-relaxed">
                                            {mistake.advice}
                                        </p>
                                        <Lightbulb size={16} className="text-yellow-400 shrink-0 mt-0.5" />
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
