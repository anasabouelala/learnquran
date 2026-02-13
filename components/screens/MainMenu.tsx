
import React, { useState, useEffect, useRef } from 'react';
import { Play, Search, Activity, ChevronRight, Brain, Gamepad2, GraduationCap, Mic, Layers, Waves, Ghost, Puzzle, Zap, ArrowLeft, BookOpen, Target, LayoutDashboard, Settings, Key, User, Mail, Lock, Shield, Sparkles, Keyboard, Laptop as StartNew, Tablet, Smartphone } from 'lucide-react';
import { ArcadeButton } from '../ui/ArcadeButton';
import { motion, AnimatePresence } from 'framer-motion';
import { GameMode } from '../../types';

interface MenuState {
    step: 'SELECT_MODE';
    surah: string;
    range: { start: number, end?: number };
}

interface Props {
    onStartGame: (surah: string, startVerse?: number, endVerse?: number, mode?: GameMode, config?: any) => void;
    onStartDiagnostic: (surah: string, startVerse?: number, endVerse?: number) => void;
    onOpenDashboard: () => void;
    initialState?: MenuState;
}



const QURAN_SURAHS = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الخاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
];

const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
};

type MenuStep = 'HOME' | 'AUTH' | 'USER_HOME' | 'SELECT_SURAH' | 'SELECT_MODE';
type Intent = 'LEARN' | 'RECITATE' | null;

import { authService } from '../../services/authService';
import { syncFromCloud } from '../../services/storageService';
import { UserProfile } from '../../types';

export const MainMenu: React.FC<Props> = ({ onStartGame, onStartDiagnostic, onOpenDashboard, initialState }) => {
    const [step, setStep] = useState<MenuStep>('HOME');
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [intent, setIntent] = useState<Intent>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const u = await authService.getCurrentUser();
            if (u) {
                setUser(u);
                await syncFromCloud();
            }
        };
        checkAuth();

        const { data } = authService.onAuthStateChange((u) => {
            setUser(u);
        });

        return () => {
            data?.subscription.unsubscribe();
        };
    }, []);


    // Selection State
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSurah, setSelectedSurah] = useState("");
    const [verseMode, setVerseMode] = useState<'FULL' | 'RANGE'>('FULL');
    const [rangeStart, setRangeStart] = useState<number | string>(1);
    const [rangeEnd, setRangeEnd] = useState<number | string>(10);

    // If we came from a diagnostic, we are in "Training Mode"
    const [isTrainingMode, setIsTrainingMode] = useState(false);

    // Social Proof Simulation
    const [activeLearners, setActiveLearners] = useState(23);
    const [currentActivity, setCurrentActivity] = useState<string | null>(null);

    const MOCK_ACTIVITIES = [
        "أحمد أتم حفظ سورة الفاتحة اليوم! 🌟",
        "سارة وصلت لليوم السابع من الحفظ المتواصل 🔥",
        "عبد الله اختار القرآن بدل الألعاب اليوم 🎮",
        "ليلى أتمت مراجعة جزء عم كاملاً 📚",
        "محمد صحح 15 خطأ في التلاوة 🎯",
        "فاطمة حصلت على وسام الختمة الأولى 👑",
        "يوسف يقضي 20 دقيقة يومياً في الحفظ ❤️",
        "نورة ختمت سورة الكهف بإتقان ✨"
    ];

    useEffect(() => {
        // Active Learners simulation
        const interval = setInterval(() => {
            setActiveLearners(prev => {
                const change = Math.random() > 0.6 ? 1 : Math.random() > 0.5 ? -1 : 0;
                let next = prev + change;
                if (next < 18) next = 18;
                if (next > 45) next = 45;
                return next;
            });
        }, 4000);

        // Activity Feed simulation
        const activityInterval = setInterval(() => {
            if (step === 'HOME') {
                const randomActivity = MOCK_ACTIVITIES[Math.floor(Math.random() * MOCK_ACTIVITIES.length)];
                setCurrentActivity(randomActivity);
                setTimeout(() => setCurrentActivity(null), 5000);
            }
        }, 8000 + Math.random() * 5000);

        return () => {
            clearInterval(interval);
            clearInterval(activityInterval);
        };
    }, [step]);

    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Handle deep link state from props
        if (initialState) {
            setStep(initialState.step);
            setSelectedSurah(initialState.surah);
            setRangeStart(initialState.range.start);
            if (initialState.range.end) {
                setRangeEnd(initialState.range.end);
                setVerseMode('RANGE');
            } else {
                setVerseMode('FULL');
            }
            setIntent('LEARN');
            setIsTrainingMode(true);
        }
    }, [initialState]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getSuggestions = () => {
        if (!searchTerm) return [];
        const exactMatches = QURAN_SURAHS.filter(s => s.includes(searchTerm));
        if (exactMatches.length > 0) return exactMatches;
        return QURAN_SURAHS
            .map(s => ({ name: s, dist: levenshtein(s, searchTerm) }))
            .filter(item => item.dist <= 2)
            .sort((a, b) => a.dist - b.dist)
            .map(item => item.name)
            .slice(0, 3);
    };

    const handleSelectSurah = (surah: string) => {
        setSelectedSurah(surah);
        setSearchTerm(surah);
        setShowSuggestions(false);
    };

    const handleActionSelect = (selectedIntent: Intent) => {
        setIntent(selectedIntent);
        setStep('SELECT_SURAH');
    };

    const handleSurahConfirmed = () => {
        if (!selectedSurah) return;

        if (intent === 'RECITATE') {
            // Direct Action: Start Diagnostic
            const start = parseInt(rangeStart.toString()) || 1;
            const end = verseMode === 'RANGE' ? (parseInt(rangeEnd.toString()) || undefined) : undefined;
            onStartDiagnostic(selectedSurah, start, end);
        } else {
            // Go to Mode Selection for Learning
            setStep('SELECT_MODE');
        }
    };

    const handleGameStart = (mode: GameMode) => {
        const start = parseInt(rangeStart.toString()) || 1;
        const end = parseInt(rangeEnd.toString()) || 10;
        const finalEnd = verseMode === 'RANGE' ? end : undefined;

        const config = mode === 'LEARN' ? { inputMode: 'AUDIO' } : {};
        onStartGame(selectedSurah, start, finalEnd, mode, config);
    };

    const goBack = () => {
        if (isTrainingMode) {
            // If in training mode (from diagnostic), back goes home
            setStep('HOME');
            setIntent(null);
            setSelectedSurah("");
            setIsTrainingMode(false);
            return;
        }

        if (step === 'SELECT_MODE') setStep('SELECT_SURAH');
        else if (step === 'SELECT_SURAH') {
            setStep('USER_HOME'); // Back to User Home if logged in, else Home? Actually flow is User Home -> Select Surah
            setIntent(null);
            setSelectedSurah("");
            setSearchTerm("");
        } else if (step === 'USER_HOME') {
            // Logout or go back to landing?
            // Let's say back to Landing for now to allow "Logout" feel
            setStep('HOME');
            setUser(null);
        } else if (step === 'AUTH') {
            setStep('HOME');
        }
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (authMode === 'LOGIN') {
                await authService.signIn(email, password);
                // Authentication state change will trigger the listener
                await syncFromCloud();
                setStep('USER_HOME');
            } else {
                await authService.signUp(email, password, name);
                alert("Account created! Please sign in.");
                setAuthMode('LOGIN');
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-900 overflow-hidden relative font-sans">
            {/* Ambient Background (CSS-only, no external URLs) */}
            <div className="absolute inset-0 bg-ambient z-0"></div>
            <div className="absolute inset-0 bg-stardust opacity-40 z-0"></div>

            <div className="relative z-10 w-full max-w-4xl flex flex-col h-full p-4 md:p-6 overflow-y-auto overflow-x-hidden">

                {/* Header */}
                {step !== 'HOME' && (
                    <motion.header
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-center py-4 md:py-8 shrink-0 relative z-20"
                    >
                        <div className="inline-flex items-center gap-2 bg-slate-900/40 backdrop-blur rounded-full px-4 py-1.5 border border-slate-800/50">
                            <span className="text-slate-500 text-[10px] font-arcade tracking-widest opacity-80">HIFZ QUEST</span>
                        </div>
                    </motion.header>
                )}



                <AnimatePresence mode='wait'>

                    {/* --- STEP 1: LANDING PAGE (HIGH CONVERSION) --- */}
                    {step === 'HOME' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex-1 flex flex-col font-cairo"
                        >
                            {/* 1. Navbar (Conversion Focused) */}
                            <div className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto w-full sticky top-0 z-50">
                                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-xl">
                                    <div className="bg-gradient-to-tr from-cyan-400 to-blue-600 w-9 h-9 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                        <Gamepad2 size={18} className="text-white" />
                                    </div>
                                    <span className="font-extrabold text-xl tracking-tight text-white font-cairo">HIFZ QUEST</span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        className="hidden md:block text-slate-300 font-bold hover:text-white transition-colors text-sm"
                                        onClick={() => { }}
                                    >
                                        تواصل معنا
                                    </button>
                                    <button
                                        className="text-white font-bold hover:text-cyan-300 transition-colors px-4 py-2"
                                        onClick={() => { setStep('AUTH'); setAuthMode('LOGIN'); }}
                                    >
                                        دخول
                                    </button>
                                    <button
                                        onClick={() => { setStep('AUTH'); setAuthMode('REGISTER'); }}
                                        className="bg-white text-slate-900 px-6 py-3 rounded-full font-black text-sm shadow-[0_4px_0_#cbd5e1] hover:-translate-y-1 hover:shadow-[0_8px_0_#cbd5e1] active:translate-y-0 active:shadow-none transition-all flex items-center gap-2"
                                    >
                                        جرب مجانـاً ⚡
                                    </button>
                                </div>
                            </div>

                            {/* Live Activity Notification */}
                            {/* Live Activity Notification - Bottom Right (Less intrusive) */}
                            <AnimatePresence>
                                {currentActivity && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                                        className="fixed bottom-8 right-4 md:right-8 z-50 bg-slate-900/95 backdrop-blur border border-slate-700/50 text-white px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 max-w-sm border-r-4 border-r-emerald-500"
                                    >
                                        <div className="bg-emerald-500/10 p-2 rounded-full shrink-0">
                                            <Activity size={18} className="text-emerald-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold mb-0.5">حدث الآن</span>
                                            <span className="text-sm font-bold leading-tight">{currentActivity}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 2. Hero Section (Persuasive & Emotional) */}
                            <div className="text-center py-12 md:py-20 relative px-4 max-w-5xl mx-auto">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold mb-8 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                >
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                                    متاح الآن: الإصدار التعليمي الجديد 2.0 🚀
                                </motion.div>

                                {/* 🏆 FIRST IN ISLAMIC WORLD STAMP */}
                                {/* 🏆 FIRST IN ISLAMIC WORLD STAMP */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: -12 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                                    className="absolute -top-6 -left-6 md:top-0 md:-left-8 z-20 hidden md:block select-none pointer-events-none opacity-90"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 border-[4px] border-amber-500/30 rounded-full animate-ping opacity-20"></div>
                                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-[3px] border-amber-500/80 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm text-center p-2 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                            <span className="text-white text-xs md:text-sm font-black leading-tight">
                                                الأول في <br /> العالم الإسلامي
                                            </span>
                                            <div className="w-8 h-0.5 bg-amber-500/80 my-1"></div>
                                            <span className="text-amber-400 text-[9px] font-bold">لتعليم الأطفال ✨</span>
                                        </div>
                                        {/* Star decoration */}
                                        <div className="absolute -top-1 -right-1 text-amber-400/80 text-xl">✦</div>
                                        <div className="absolute -bottom-1 -left-1 text-amber-400/80 text-lg">✦</div>
                                    </div>
                                </motion.div>

                                <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.2] text-white">
                                    ازرع نور القرآن <br className="hidden md:block" />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 relative">
                                        في قلب طفلك
                                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-500 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                                        </svg>
                                    </span>
                                </h1>
                                <p className="text-slate-300 text-lg md:text-2xl max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
                                    أول تطبيق تفاعلي يجمع بين "التعلم باللعب" وبين دقة التلاوة والحفظ. <br className="hidden md:block" />
                                    <span className="text-white font-bold">حوّلنا رحلة حفظ القرآن</span> من مهمة صعبة إلى مغامرة ممتعة ينتظرها طفلك كل يوم بشوق.
                                </p>

                                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
                                    <button
                                        onClick={() => { setStep('AUTH'); setAuthMode('REGISTER'); }}
                                        className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-[0_10px_40px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        ابدأ رحلة الحفظ مجاناً
                                        <ChevronRight className="rtl:rotate-180" />
                                    </button>

                                    <div className="flex items-center gap-2 text-indigo-200 text-sm font-bold px-4 py-2 bg-indigo-900/30 rounded-full border border-indigo-500/20">
                                        <div className="relative flex items-center justify-center w-3 h-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </div>
                                        <p><span className="text-white font-black text-base mx-1">{activeLearners}</span> طفل يتعلمون القرآن الآن</p>
                                    </div>
                                </div>
                            </div>

                            {/* 📱 DEVICE SUPPORT INFO */}
                            <div className="flex flex-col items-center justify-center gap-3 mb-16 opacity-80">
                                <p className="text-slate-400 text-xs md:text-sm font-bold tracking-wide">
                                    متوفر الآن على جميع أجهزتك المفضلة
                                </p>
                                <div className="flex items-center gap-4 text-slate-500">
                                    <span className="flex items-center gap-1 text-xs"><StartNew className="w-4 h-4" /> Laptop</span>
                                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                    <span className="flex items-center gap-1 text-xs"><Tablet className="w-4 h-4" /> iPad</span>
                                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                    <span className="flex items-center gap-1 text-xs"><Smartphone className="w-4 h-4" /> Smartphone</span>
                                </div>
                            </div>

                            {/* 💬 SCROLLING TESTIMONIALS (MOVED TO BOTTOM) */}

                            {/* 2.5 Gameplay Showcase (Visual Proof) */}
                            <div className="w-full max-w-6xl mx-auto px-4 mb-24">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">شاهد كيف نعلمهم باللعب</h2>
                                    <p className="text-slate-400 text-lg">تجربة بصرية مذهلة تجذب الطفل من التلاوة الأولى.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Mock Screen 1: The Game */}
                                    <motion.div whileHover={{ y: -5 }} className="bg-slate-800 rounded-3xl p-4 border border-slate-700 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                                        <div className="bg-slate-900 rounded-2xl h-64 overflow-hidden relative mb-4 border border-slate-700/50 flex flex-col">
                                            {/* Header Mock */}
                                            <div className="bg-slate-800 h-8 flex items-center px-3 justify-between">
                                                <div className="flex gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono">Game.exe</div>
                                            </div>
                                            {/* Game Body Mock */}
                                            <div className="flex-1 p-4 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900">
                                                <div className="text-center mb-3">
                                                    <div className="text-indigo-400 text-xs mb-1 font-bold">سورة الفاتحة</div>
                                                    <div className="bg-slate-800 px-3 py-1 rounded-lg text-white font-serif text-lg border border-slate-700 shadow-inner">
                                                        ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full justify-center">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/50 animate-pulse"></div>
                                                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600"></div>
                                                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-white text-lg mb-1">واجهة تفاعلية</h3>
                                            <p className="text-slate-500 text-xs">ألوان وأصوات تشجيعية تجذب انتباه الطفل</p>
                                        </div>
                                    </motion.div>

                                    {/* Mock Screen 2: AI Review */}
                                    <motion.div whileHover={{ y: -5 }} className="bg-slate-800 rounded-3xl p-4 border border-slate-700 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                                        <div className="bg-slate-900 rounded-2xl h-64 overflow-hidden relative mb-4 border border-slate-700/50 flex flex-col">
                                            <div className="bg-slate-800 h-8 flex items-center px-3 justify-between">
                                                <div className="flex gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                                </div>
                                                <Mic size={12} className="text-slate-500" />
                                            </div>
                                            <div className="flex-1 p-4 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-900 to-slate-900">
                                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-4 relative">
                                                    <Mic size={24} className="text-emerald-400 relative z-10" />
                                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                                                </div>
                                                <div className="flex justify-center gap-0.5 h-6 items-end w-full px-8">
                                                    {[4, 7, 3, 8, 5, 9, 4, 6, 3, 7].map((h, i) => (
                                                        <div key={i} className="flex-1 bg-emerald-500/80 rounded-t-sm" style={{ height: `${h}0%` }}></div>
                                                    ))}
                                                </div>
                                                <div className="bg-emerald-900/50 text-emerald-300 text-[10px] px-2 py-1 rounded-md mt-3 border border-emerald-500/30">
                                                    "ممتاز! أحسنت في المد"
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-white text-lg mb-1">تصحيح فوري</h3>
                                            <p className="text-slate-500 text-xs">تحليل صوتي دقيق لمخارج الحروف</p>
                                        </div>
                                    </motion.div>

                                    {/* Mock Screen 3: Rewards */}
                                    <motion.div whileHover={{ y: -5 }} className="bg-slate-800 rounded-3xl p-4 border border-slate-700 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                                        <div className="bg-slate-900 rounded-2xl h-64 overflow-hidden relative mb-4 border border-slate-700/50 flex flex-col">
                                            <div className="bg-slate-800 h-8 flex items-center px-3 justify-end">
                                                <Target size={12} className="text-slate-500" />
                                            </div>
                                            <div className="flex-1 p-4 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-slate-900 to-slate-900">
                                                <div className="relative mb-4">
                                                    <div className="text-6xl filter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">🏆</div>
                                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">+50 XP</div>
                                                </div>
                                                <div className="w-full bg-slate-700/50 rounded-full h-2 mb-1 overflow-hidden">
                                                    <div className="bg-yellow-400 h-full w-3/4 rounded-full"></div>
                                                </div>
                                                <div className="flex justify-between w-full text-[10px] text-slate-400 font-bold px-1">
                                                    <span>Level 4</span>
                                                    <span>Level 5</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-bold text-white text-lg mb-1">مكافآت وجوائز</h3>
                                            <p className="text-slate-500 text-xs">نظام تحفيزي مستمر لبناء العادة</p>
                                        </div>
                                    </motion.div>

                                </div>
                            </div>

                            {/* 3. Core Features Grid (The "Why" - Solution Aware) */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-24 w-full max-w-7xl mx-auto px-4">

                                {/* Feature 1: Gamification (The Hook) */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    onClick={() => { setStep('AUTH'); setAuthMode('REGISTER'); }}
                                    className="md:col-span-7 bg-slate-800/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-colors"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="relative z-10">
                                        <div className="bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                                            <Gamepad2 size={32} />
                                        </div>
                                        <h3 className="text-3xl font-black mb-4 text-white">نظام "Quest" التعليمي</h3>
                                        <p className="text-slate-300 text-lg leading-relaxed max-w-lg mb-6">
                                            بدلاً من التكرار الممل، يقوم الطفل بمهام يومية تفاعلية. يجمع النقاط، يفتح الصناديق، ويطور مستواه.
                                            <span className="text-indigo-300 font-bold block mt-2">عالجنا مشكلة "فقدان الشغف" نهائياً.</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-slate-700/50 rounded-lg text-xs font-bold text-slate-300">نظام مكافآت</span>
                                            <span className="px-3 py-1 bg-slate-700/50 rounded-lg text-xs font-bold text-slate-300">تحديات يومية</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Feature 2: AI Tech (The Trust) */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    onClick={() => { setStep('AUTH'); setAuthMode('REGISTER'); }}
                                    className="md:col-span-5 bg-slate-800/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-colors"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="relative z-10">
                                        <div className="bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                                            <Mic size={32} />
                                        </div>
                                        <h3 className="text-3xl font-black mb-4 text-white">مصحح التلاوة الذكي</h3>
                                        <p className="text-slate-300 text-lg leading-relaxed mb-6">
                                            لا وقت للتسميع؟ ذكاؤنا الاصطناعي يستمع لطفلك ويصحح له الأخطاء ومخارج الحروف بدقة 99%.
                                            <span className="text-emerald-300 font-bold block mt-2">معلم خاص متوفر 24 ساعة.</span>
                                        </p>

                                        {/* Live Demo UI */}
                                        <div className="bg-slate-900/50 rounded-xl p-3 flex items-center gap-3 border border-emerald-500/20">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                            <div className="text-xs text-slate-400">جاري الاستماع...</div>
                                            <div className="flex-1 flex justify-end gap-1 h-3 items-end">
                                                {[40, 70, 30, 80, 50, 90, 40].map((h, i) => (
                                                    <div key={i} className="w-1 bg-emerald-500/50 rounded-full" style={{ height: `${h}%` }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Feature 3: Parent Control (The Convenience) */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    onClick={() => { setStep('AUTH'); setAuthMode('REGISTER'); }} // All paths lead to Auth first now
                                    className="md:col-span-12 bg-gradient-to-r from-slate-800/60 to-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer hover:border-slate-600 transition-colors"
                                >
                                    <div className="flex-1 text-center md:text-right">
                                        <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-yellow-500/20">
                                            💎 ميزة للآباء
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black mb-3 text-white">لوحة متابعة وبناء عادات</h3>
                                        <p className="text-slate-400 text-lg max-w-2xl">
                                            تابع تقدم طفلك، عدد الآيات المحفوظة، وأيام الالتزام دون الحاجة لسؤاله. استقبل تقارير أسبوعية عن مستوى الحفظ والمراجعة.
                                        </p>
                                    </div>

                                    {/* Stats Preview */}
                                    <div className="flex gap-4 md:gap-8 shrink-0">
                                        <div className="text-center">
                                            <div className="text-3xl md:text-4xl font-black text-white mb-1">15</div>
                                            <div className="text-slate-500 text-xs font-bold uppercase">يوم متواصل</div>
                                        </div>
                                        <div className="w-px bg-slate-700 h-12 self-center"></div>
                                        <div className="text-center">
                                            <div className="text-3xl md:text-4xl font-black text-emerald-400 mb-1">98%</div>
                                            <div className="text-slate-500 text-xs font-bold uppercase">دقة الحفظ</div>
                                        </div>
                                    </div>
                                </motion.div>

                            </div>

                            {/* 4. Social Proof Ticker (Credibility - Enhanced & Scrolling) */}
                            <div className="w-full bg-slate-900/50 border-y border-white/5 py-6 mb-20 overflow-hidden relative">
                                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10"></div>
                                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10"></div>

                                <div className="flex relative overflow-hidden">
                                    <motion.div
                                        className="flex gap-16 whitespace-nowrap px-4"
                                        animate={{ x: [0, -2000] }}
                                        transition={{
                                            repeat: Infinity,
                                            ease: "linear",
                                            duration: 80
                                        }}
                                    >
                                        {[
                                            { t: '🌟 "تطبيق غيّر حياة ابني، أصبح يحب ورد القرآن اليومي"', a: 'أم عبد الرحمن' },
                                            { t: '🏆 "الذكاء الاصطناعي دقيق جداً في كشف الأخطاء، كأنه شيخ يصحح لي"', a: 'عبدالله، 12 سنة' },
                                            { t: '💎 "أفضل استثمار فعلته لتربية أبنائي، أنصح به كل أم"', a: 'أم شهد' },
                                            { t: '🎮 "تصميم رائع يجذب الأطفال، ولدي أدمن عليه بدل الألعاب الإلكترونية!"', a: 'أبو خالد' },
                                            { t: '🚀 "مستوى ابنتي تحسن بشكل ملحوظ في شهر واحد فقط"', a: 'أم ريم' },
                                            { t: '✨ "طريقة التحفيز بالمكافآت والقصص جعلت الحفظ ممتعاً جداً"', a: 'يوسف، 9 سنوات' },
                                            { t: '🤖 "لم أتوقع أن يكون المصحح الآلي بهذه الدقة، مذهل!"', a: 'مبرمج سابق' },
                                            { t: '❤️ "جزاكم الله خيراً على هذا العمل الرائع، سهل علينا المراجعة"', a: 'عائلة الصالح' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-slate-300 font-bold text-lg">
                                                <span>{item.t}</span>
                                                <span className="text-indigo-400 text-sm font-bold opacity-80">- {item.a}</span>
                                                {i !== 7 && <span className="text-slate-700 mx-4">•</span>}
                                            </div>
                                        ))}
                                        {/* Duplicate for infinite loop illusion */}
                                        {[
                                            { t: '🌟 "تطبيق غيّر حياة ابني، أصبح يحب ورد القرآن اليومي"', a: 'أم عبد الرحمن' },
                                            { t: '🏆 "الذكاء الاصطناعي دقيق جداً في كشف الأخطاء، كأنه شيخ يصحح لي"', a: 'عبدالله، 12 سنة' },
                                            { t: '💎 "أفضل استثمار فعلته لتربية أبنائي، أنصح به كل أم"', a: 'أم شهد' },
                                            { t: '🎮 "تصميم رائع يجذب الأطفال، ولدي أدمن عليه بدل الألعاب الإلكترونية!"', a: 'أبو خالد' },
                                        ].map((item, i) => (
                                            <div key={`dup-${i}`} className="flex items-center gap-3 text-slate-300 font-bold text-lg">
                                                <span>{item.t}</span>
                                                <span className="text-indigo-400 text-sm font-bold opacity-80">- {item.a}</span>
                                                <span className="text-slate-700 mx-4">•</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                </div>
                            </div>
                            {/* Floating Settings Button (Still accessible but cleaner) */}


                        </motion.div>
                    )}

                    {/* --- STEP 1.5: AUTH SCREEN --- */}
                    {step === 'AUTH' && (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full flex-1 flex flex-col items-center justify-center px-4 font-cairo"
                        >
                            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500"></div>

                                <button onClick={() => setStep('HOME')} className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors">
                                    <ArrowLeft size={24} />
                                </button>

                                <div className="text-center mb-8">
                                    <div className="bg-indigo-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                                        <User size={32} />
                                    </div>
                                    <h2 className="text-2xl font-black text-white mb-2">{authMode === 'LOGIN' ? 'مرحباً بعودتك' : 'أنشئ حساب جديد'}</h2>
                                    <p className="text-slate-400 text-sm">{authMode === 'LOGIN' ? 'لإكمال رحلة حفظ القرآن' : 'للبدء في مغامرة الحفظ'}</p>
                                </div>

                                <form onSubmit={handleAuthSubmit} className="space-y-4">
                                    {authMode === 'REGISTER' && (
                                        <div className="relative">
                                            <User className="absolute right-4 top-3.5 text-slate-500 w-5 h-5" />
                                            <input
                                                type="text"
                                                placeholder="الاسم الكامل"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white text-right focus:border-indigo-500 outline-none"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="relative">
                                        <Mail className="absolute right-4 top-3.5 text-slate-500 w-5 h-5" />
                                        <input
                                            type="email"
                                            placeholder="البريد الإلكتروني"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white text-right focus:border-indigo-500 outline-none"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute right-4 top-3.5 text-slate-500 w-5 h-5" />
                                        <input
                                            type="password"
                                            placeholder="كلمة المرور"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white text-right focus:border-indigo-500 outline-none"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all mt-4 disabled:opacity-50">
                                        {loading ? 'جاري التحميل...' : (authMode === 'LOGIN' ? 'تسجيل الدخول' : 'إنشاء الحساب')}
                                    </button>
                                </form>

                                <div className="mt-6 text-center text-sm text-slate-400">
                                    {authMode === 'LOGIN' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                                    <button
                                        onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                                        className="text-indigo-400 font-bold mr-2 hover:underline"
                                    >
                                        {authMode === 'LOGIN' ? 'سجل الآن' : 'سجل دخولك'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- STEP 1.6: USER DASHBOARD (New Home) --- */}
                    {step === 'USER_HOME' && user && (
                        <motion.div
                            key="user-home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex-1 flex flex-col font-cairo max-w-6xl mx-auto px-4"
                        >
                            {/* Dashboard Header */}
                            <div className="flex items-center justify-between py-6 mb-8">
                                <div
                                    onClick={onOpenDashboard}
                                    className="flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 p-3 rounded-3xl transition-all group"
                                >
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-black text-white border-4 border-slate-800 shadow-xl group-hover:scale-105 transition-transform">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-900 w-6 h-6 rounded-full flex items-center justify-center">
                                            <Sparkles size={12} className="text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">مرحباً، {user.name} 👋</h2>
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                                            <span className="flex items-center gap-1 text-yellow-400"><Target size={14} /> المستوى {user.level}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                            <span className="text-indigo-400">{user.xp} XP</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-600 rtl:rotate-180 group-hover:text-white transition-colors mr-2" />
                                </div>
                                <button onClick={() => setStep('HOME')} className="text-slate-500 hover:text-white text-sm font-bold">تسجيل خروج</button>
                            </div>

                            {/* Main Actions Grid (12-Column Layout) */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">

                                {/* 1. Continue Journey (Focus - 8 Cols) */}
                                <button
                                    onClick={() => handleActionSelect('LEARN')}
                                    className="md:col-span-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-right relative overflow-hidden group shadow-lg hover:-translate-y-1 transition-transform"
                                >
                                    <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="bg-white/20 w-fit p-3 rounded-2xl mb-4 backdrop-blur-sm">
                                                <Play className="text-white w-8 h-8 fill-current" />
                                            </div>
                                            <h3 className="text-3xl font-black text-white mb-2">أكمل رحلتك</h3>
                                            <p className="text-indigo-100 text-lg mb-6">توقفت عند: سورة البقرة - الآية 25</p>
                                        </div>
                                        <div className="w-full md:w-1/2 bg-black/20 rounded-2xl p-4 border border-white/10">
                                            <div className="flex justify-between text-xs text-indigo-200 font-bold mb-2">
                                                <span>التقدم في السورة</span>
                                                <span>65%</span>
                                            </div>
                                            <div className="w-full bg-black/20 rounded-full h-3">
                                                <div className="bg-yellow-400 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* 2. Start New (Secondary - 4 Cols) */}
                                <button
                                    onClick={() => handleActionSelect('LEARN')}
                                    className="md:col-span-4 bg-slate-800 border border-slate-700 rounded-[2.5rem] p-8 text-right hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="bg-emerald-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-400">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-1">حفظ جديد</h3>
                                        <p className="text-slate-400 text-sm">ابدأ سورة جديدة</p>
                                    </div>
                                    <div className="border-t border-slate-700 mt-4 pt-4 flex items-center justify-between">
                                        <span className="text-xs text-slate-500">اختر من المصحف</span>
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors text-slate-400">
                                            <ChevronRight className="rtl:rotate-180" size={16} />
                                        </div>
                                    </div>
                                </button>

                                {/* 3. Recitation Corrector (6 Cols) */}
                                <button
                                    onClick={() => handleActionSelect('RECITATE')}
                                    className="md:col-span-6 bg-slate-800 border border-slate-700 rounded-[2.5rem] p-8 text-right hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div>
                                            <div className="bg-indigo-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors text-indigo-400">
                                                <Mic className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-black text-white mb-1">مصحح التلاوة</h3>
                                            <p className="text-slate-400 text-sm">ذكاء اصطناعي يصحح تلاوتك</p>
                                        </div>
                                        <div className="text-slate-700 opacity-20 group-hover:opacity-40 transition-opacity">
                                            <Waves size={100} />
                                        </div>
                                    </div>
                                </button>

                                {/* 4. Quiz (6 Cols) */}
                                <button
                                    onClick={() => handleGameStart('QUIZ')}
                                    className="md:col-span-6 bg-slate-800 border border-slate-700 rounded-[2.5rem] p-8 text-right hover:border-yellow-500/50 hover:bg-slate-800/80 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div>
                                            <div className="bg-yellow-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:bg-yellow-500 group-hover:text-white transition-colors text-yellow-400">
                                                <Brain className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-black text-white mb-1">اختبر حفظك</h3>
                                            <p className="text-slate-400 text-sm">مراجعة سريعة وتثبيت للحفظ</p>
                                        </div>
                                        <div className="text-slate-700 opacity-20 group-hover:opacity-40 transition-opacity">
                                            <Puzzle size={100} />
                                        </div>
                                    </div>
                                </button>

                                {/* 5. Full Stats (12 Cols) */}
                                <button
                                    onClick={onOpenDashboard}
                                    className="md:col-span-12 bg-slate-800 border border-slate-700 rounded-[2.5rem] p-8 text-right hover:border-purple-500/50 hover:bg-slate-800/80 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-purple-500/20 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors text-purple-400 shrink-0">
                                                <Activity className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white mb-1">إحصائياتك الكاملة</h3>
                                                <p className="text-slate-400 text-sm">اضغط لعرض تفاصيل تقدمك، عدد الآيات المحفوظة، وأيام الالتزام.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 w-full md:w-auto">
                                            <div className="flex-1 md:flex-none text-center bg-slate-900 px-6 py-3 rounded-2xl border border-slate-700">
                                                <div className="text-2xl font-black text-white mb-1">12</div>
                                                <div className="text-[10px] text-slate-500 font-bold">يوم متواصل</div>
                                            </div>
                                            <div className="flex-1 md:flex-none text-center bg-slate-900 px-6 py-3 rounded-2xl border border-slate-700">
                                                <div className="text-2xl font-black text-emerald-400 mb-1">A+</div>
                                                <div className="text-[10px] text-slate-500 font-bold">معدل الدقة</div>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                            </div>

                        </motion.div>
                    )}

                    {/* --- STEP 2: SELECT SURAH (QUEST LOG STYLE) --- */}
                    {step === 'SELECT_SURAH' && (
                        <motion.div
                            key="select-surah"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="flex-1 flex flex-col w-full max-w-4xl mx-auto my-4 px-4 font-cairo"
                        >
                            {/* Navigation Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <button onClick={goBack} className="bg-slate-800/80 p-3 rounded-full hover:bg-slate-700 hover:scale-110 transition-all border border-slate-700 shadow-lg text-white">
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white">
                                        {intent === 'LEARN' ? '📜 اختر سورة للحفظ' : '🎤 اختر سورة للتسميع'}
                                    </h2>
                                    <p className="text-indigo-300 text-sm font-bold">رحلتك تبدأ هنا</p>
                                </div>
                            </div>

                            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-[2rem] p-6 md:p-8 shadow-2xl flex-1 flex flex-col">

                                {/* Search Input (RPG Inventory Search Style) */}
                                <div className="relative mb-8" ref={suggestionsRef}>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setSelectedSurah("");
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder="ابحث عن السورة..."
                                            className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl py-4 pl-4 pr-14 text-white font-bold text-lg focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.3)] focus:outline-none transition-all placeholder:text-slate-500 text-right"
                                        />
                                        <Search className="absolute right-5 top-5 w-6 h-6 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>

                                    <AnimatePresence>
                                        {showSuggestions && searchTerm && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                                            >
                                                {getSuggestions().map((s) => (
                                                    <button key={s} onClick={() => handleSelectSurah(s)} className="w-full text-right px-6 py-4 text-slate-200 hover:bg-indigo-600/20 hover:text-white border-b border-slate-800 last:border-0 font-bold transition-colors flex justify-between items-center group">
                                                        <span>{s}</span>
                                                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 text-indigo-400 transform rotate-180" />
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Selection Details Panel */}
                                {selectedSurah ? (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">

                                        {/* Surah Card */}
                                        <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl mb-6 flex items-center justify-between shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5 pointer-events-none"></div>
                                            <div>
                                                <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1 block">السورة المختارة</span>
                                                <span className="text-white font-black text-4xl drop-shadow-md">{selectedSurah}</span>
                                            </div>
                                            <div className="bg-indigo-500/20 p-4 rounded-full border border-indigo-500/30">
                                                <BookOpen className="text-indigo-400 w-8 h-8" />
                                            </div>
                                        </div>

                                        {/* Range Selection Toggles (Gamified Segmented Control) */}
                                        <div className="bg-slate-900/80 p-1.5 rounded-2xl flex mb-6 shadow-inner">
                                            <button onClick={() => setVerseMode('FULL')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${verseMode === 'FULL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                                                كامل السورة 🌟
                                            </button>
                                            <button onClick={() => setVerseMode('RANGE')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${verseMode === 'RANGE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                                                آيات محددة 🎯
                                            </button>
                                        </div>

                                        {verseMode === 'RANGE' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 mb-6">
                                                <div className="flex-1">
                                                    <label className="text-xs text-indigo-300 font-bold block mb-2 text-center">من الآية</label>
                                                    <div className="relative">
                                                        <input type="number" min="1" value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl p-3 text-center text-white text-2xl font-black outline-none focus:border-indigo-500 transition-colors" />
                                                    </div>
                                                </div>
                                                <div className="text-slate-600 font-black text-2xl pt-6">⬅️</div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-indigo-300 font-bold block mb-2 text-center">إلى الآية</label>
                                                    <div className="relative">
                                                        <input type="number" min="1" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl p-3 text-center text-white text-2xl font-black outline-none focus:border-indigo-500 transition-colors" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="mt-auto">
                                            <button
                                                onClick={handleSurahConfirmed}
                                                className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg transform transition-all active:scale-[0.98] flex items-center justify-center gap-3
                                                    ${intent === 'LEARN'
                                                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40'
                                                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40'
                                                    }
                                                `}
                                            >
                                                {intent === 'LEARN' ? 'التالي: اختر اللعبة' : 'ابدأ التسميع الآن'}
                                                <div className="bg-white/20 rounded-full p-1">
                                                    <ChevronRight size={20} className="rtl:rotate-180" />
                                                </div>
                                            </button>
                                        </div>

                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 opacity-60">
                                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                            <Search size={40} className="text-slate-600" />
                                        </div>
                                        <p className="font-bold text-lg">ابحث عن سورة لتبدأ المغامرة</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* --- STEP 3: SELECT MODE (GAME SELECTION) --- */}
                    {step === 'SELECT_MODE' && (
                        <motion.div
                            key="select-mode"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 flex flex-col w-full max-w-6xl mx-auto my-4 px-4 font-cairo"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <button onClick={goBack} className="bg-slate-800/80 p-3 rounded-full hover:bg-slate-700 hover:scale-110 transition-all border border-slate-700 shadow-lg text-white">
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white">
                                        {intent === 'RECITATE' ? 'الماسح القرآني الذكي' : (isTrainingMode ? '🏋️‍♂️ تدريب خاص' : '🎮 اختر وضع اللعب')}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-bold">
                                        سورة {selectedSurah}
                                        {isTrainingMode && <span className="text-indigo-400 mx-2">({rangeStart}-{rangeEnd || 'end'})</span>}
                                    </p>
                                </div>
                            </div>

                            {/* --- RECITATE INTENT DESIGN (Smart Scanner) --- */}
                            {intent === 'RECITATE' ? (
                                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[50vh]">

                                    <div className="flex flex-col items-center text-center mb-12">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold mb-6 animate-pulse">
                                            <Activity size={16} />
                                            <span>تحليل فوري بالذكاء الاصطناعي</span>
                                        </div>
                                        <h2 className="text-xl text-indigo-400 font-bold mb-2">اختبار: <span className="text-white">سورة {selectedSurah}</span></h2>
                                        <h1 className="text-4xl md:text-6xl font-black text-white mt-2 leading-tight">
                                            كيف تريد أن <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">تُسمّع؟</span>
                                        </h1>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                                        {/* Card 1: Typing (Mapped to Classic/Bridge for now) */}
                                        <button
                                            onClick={() => onStartGame(selectedSurah, rangeStart, rangeEnd ? parseInt(rangeEnd) : undefined, 'CLASSIC')}
                                            className="bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700 hover:border-purple-500 rounded-[2.5rem] p-8 aspect-[4/3] flex flex-col items-center justify-center gap-6 group transition-all hover:scale-[1.02] shadow-2xl"
                                        >
                                            <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all duration-300 border border-purple-500/20 group-hover:border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                                                <Keyboard size={40} className="text-purple-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-purple-300 transition-colors">كتابة النص</h3>
                                                <p className="text-slate-400 text-sm font-medium group-hover:text-slate-300">اكتب الآيات التي تحفظها غيباً</p>
                                            </div>
                                        </button>

                                        {/* Card 2: Voice */}
                                        <button
                                            onClick={() => onStartDiagnostic(selectedSurah, rangeStart, rangeEnd ? parseInt(rangeEnd) : undefined)}
                                            className="bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan-500 rounded-[2.5rem] p-8 aspect-[4/3] flex flex-col items-center justify-center gap-6 group transition-all hover:scale-[1.02] shadow-2xl"
                                        >
                                            <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center group-hover:bg-cyan-500 group-hover:scale-110 transition-all duration-300 border border-cyan-500/20 group-hover:border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                                                <Mic size={40} className="text-cyan-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-cyan-300 transition-colors">تلاوة صوتية</h3>
                                                <p className="text-slate-400 text-sm font-medium group-hover:text-slate-300">اقرأ بصوتك وسأصحح لك الأخطاء</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* --- STANDARD GAME SELECTION --- */
                                <>
                                    {isTrainingMode && (

                                        <div className="mb-6 bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                            <div className="bg-emerald-500/20 p-2 rounded-full animate-pulse">
                                                <Target className="text-emerald-400 w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-emerald-400 text-base">تم ضبط المهمة: تركيز على الأخطاء</h3>
                                                <p className="text-sm text-emerald-200/70">الألعاب ستركز الآن على الآيات التي تحتاج إلى تحسين.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex-1 overflow-y-auto pb-8 space-y-8 custom-scrollbar">

                                        {/* PRIMARY MODES (Hero Cards) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* CARD 1: CORE MEMORIZER */}
                                            <button
                                                onClick={() => handleGameStart('LEARN')}
                                                className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-indigo-500/30 hover:border-indigo-400 p-8 rounded-[2rem] text-right group shadow-lg flex flex-col justify-between min-h-[220px] transition-all hover:-translate-y-1 hover:shadow-indigo-500/20"
                                            >
                                                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_rgba(99,102,241,0.1),_transparent_60%)]"></div>

                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-indigo-500/20 p-3 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                                            <Mic className="w-8 h-8 text-indigo-400 group-hover:text-white" />
                                                        </div>
                                                        <span className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">أساسي</span>
                                                    </div>
                                                    <h4 className="text-3xl font-black text-white mb-2 group-hover:text-indigo-300 transition-colors">المحفظ الذكي</h4>
                                                    <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-xs ml-auto">
                                                        نظام التلقين الذكي الذي يخفي الكلمات تدريجياً ويسمع لك.
                                                    </p>
                                                </div>
                                            </button>

                                            {/* CARD 2: VERSE BRIDGE */}
                                            <button
                                                onClick={() => handleGameStart('CLASSIC')}
                                                className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 hover:border-cyan-400 p-8 rounded-[2rem] text-right group shadow-lg flex flex-col justify-between min-h-[220px] transition-all hover:-translate-y-1 hover:shadow-cyan-500/20"
                                            >
                                                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,_rgba(6,182,212,0.1),_transparent_60%)]"></div>

                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-cyan-500/20 p-3 rounded-2xl group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300">
                                                            <Zap className="w-8 h-8 text-cyan-400 group-hover:text-white" />
                                                        </div>
                                                        <span className="bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/20">سريع</span>
                                                    </div>
                                                    <h4 className="text-3xl font-black text-white mb-2 group-hover:text-cyan-300 transition-colors">جسر الآيات</h4>
                                                    <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-xs ml-auto">
                                                        اختبر سرعة حفظك بإكمال الآيات الناقصة في وقت قياسي.
                                                    </p>
                                                </div>
                                            </button>
                                        </div>

                                        {/* SECTION: ASSESSMENT (QUIZ) */}
                                        <button
                                            onClick={() => handleGameStart('QUIZ')}
                                            className="w-full bg-gradient-to-r from-slate-800 to-slate-900 border border-yellow-500/30 p-6 rounded-[1.5rem] hover:bg-slate-800 transition-all text-right group shadow-lg flex items-center justify-between relative overflow-hidden"
                                        >
                                            <div className="absolute left-0 top-0 h-full w-2 bg-yellow-500"></div>
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className="bg-yellow-500/20 p-4 rounded-2xl">
                                                    <Brain className="text-yellow-400 w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-black text-white group-hover:text-yellow-400 transition-colors">التحدي الذكي (Quiz)</h4>
                                                    <p className="text-slate-400 text-sm font-medium mt-1">ألغاز تدبرية، معاني كلمات، واختبارات فهم عميق.</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-600 group-hover:text-yellow-400 rtl:rotate-180 w-8 h-8 transition-colors" />
                                        </button>

                                        {/* SECTION: ARCADE MINI-GAMES */}
                                        <div>
                                            <div className="flex items-center gap-3 mb-6 text-slate-400 border-b border-slate-700 pb-4">
                                                <Gamepad2 size={24} className="text-purple-400" />
                                                <h3 className="font-black text-lg text-white">ألعاب الآركيد (للترفيه)</h3>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                                <GameCard
                                                    title="ترتيب الآيات"
                                                    desc="لغز بصري"
                                                    icon={<Puzzle size={24} />}
                                                    color="purple"
                                                    onClick={() => handleGameStart('ASSEMBLY')}
                                                />
                                                <GameCard
                                                    title="متزلج الكلمات"
                                                    desc="التقط الكلمات"
                                                    icon={<Waves size={24} />}
                                                    color="blue"
                                                    onClick={() => handleGameStart('SURF')}
                                                />
                                                <GameCard
                                                    title="برج الحفظ"
                                                    desc="ابنِ الكلمات"
                                                    icon={<Layers size={24} />}
                                                    color="emerald"
                                                    onClick={() => handleGameStart('STACK')}
                                                />
                                                <GameCard
                                                    title="الناجي الأخير"
                                                    desc="دافع عن القرآن"
                                                    icon={<Ghost size={24} />}
                                                    color="red"
                                                    onClick={() => handleGameStart('SURVIVOR')}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>

            </div>
        </div>
    );
};

const GameCard: React.FC<{ title: string, desc: string, icon: React.ReactNode, color: string, onClick: () => void }> = ({ title, desc, icon, color, onClick }) => {
    const colorMap: Record<string, { border: string, text: string, hover: string }> = {
        cyan: { border: 'border-arcade-cyan', text: 'text-arcade-cyan', hover: 'hover:shadow-cyan-500/20' },
        purple: { border: 'border-arcade-purple', text: 'text-arcade-purple', hover: 'hover:shadow-purple-500/20' },
        blue: { border: 'border-blue-500', text: 'text-blue-400', hover: 'hover:shadow-blue-500/20' },
        emerald: { border: 'border-emerald-500', text: 'text-emerald-400', hover: 'hover:shadow-emerald-500/20' },
        red: { border: 'border-red-500', text: 'text-red-400', hover: 'hover:shadow-red-500/20' },
    };
    const c = colorMap[color] || colorMap.cyan;

    return (
        <button
            onClick={onClick}
            className={`bg-slate-800 border-2 ${c.border} ${c.hover} p-4 rounded-2xl text-center hover:-translate-y-1 transition-all hover:shadow-lg group flex flex-col items-center gap-3 h-full justify-between min-h-[5rem]`}
        >
            <div className={`p-2.5 rounded-xl bg-slate-900/80 ${c.text}`}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm group-hover:text-white transition-colors">{title}</h4>
                <p className="text-slate-500 text-[11px]">{desc}</p>
            </div>
        </button>
    );
};
