

import React, { useState, useEffect, useRef } from 'react';
import { Play, Search, Activity, ChevronRight, Brain, Gamepad2, GraduationCap, Mic, Layers, Waves, Ghost, Puzzle, Zap, ArrowLeft, BookOpen, Target, LayoutDashboard } from 'lucide-react';
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
  onStartDiagnostic: (surah: string) => void;
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
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
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

type MenuStep = 'HOME' | 'SELECT_SURAH' | 'SELECT_MODE';
type Intent = 'LEARN' | 'RECITATE' | null;

export const MainMenu: React.FC<Props> = ({ onStartGame, onStartDiagnostic, onOpenDashboard, initialState }) => {
  const [step, setStep] = useState<MenuStep>('HOME');
  const [intent, setIntent] = useState<Intent>(null);
  
  // Selection State
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState("");
  const [verseMode, setVerseMode] = useState<'FULL' | 'RANGE'>('FULL');
  const [rangeStart, setRangeStart] = useState<number | string>(1);
  const [rangeEnd, setRangeEnd] = useState<number | string>(10);
  
  // If we came from a diagnostic, we are in "Training Mode"
  const [isTrainingMode, setIsTrainingMode] = useState(false);

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
          onStartDiagnostic(selectedSurah);
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
          setStep('HOME');
          setIntent(null);
          setSelectedSurah("");
          setSearchTerm("");
      }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 overflow-hidden relative font-sans">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?blur=5')] bg-cover bg-center opacity-20 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-900 z-0"></div>
        
        <div className="relative z-10 w-full max-w-4xl flex flex-col h-full p-4 md:p-6 overflow-y-auto">
            
            {/* Header */}
            <motion.header 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center py-4 md:py-6 shrink-0 relative"
            >
                <div className="inline-block bg-slate-800/50 backdrop-blur rounded-full px-4 py-1 border border-slate-700 mb-2">
                    <span className="text-arcade-cyan text-xs font-arcade tracking-widest">HIFZ QUEST</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-arcade text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-sm animate-[pulse_3s_infinite]">
                    رحلة الحفظ
                </h1>
                
                {/* Dashboard Button */}
                {step === 'HOME' && (
                    <div className="absolute top-4 right-0 md:right-4">
                        <button 
                            onClick={onOpenDashboard}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full p-3 transition-colors text-arcade-cyan shadow-lg hover:shadow-cyan-500/20 active:scale-95"
                        >
                            <LayoutDashboard size={24} />
                        </button>
                    </div>
                )}
            </motion.header>

            <AnimatePresence mode='wait'>
                
                {/* --- STEP 1: HOME (CHOOSE ACTION) --- */}
                {step === 'HOME' && (
                    <motion.div 
                        key="home"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1 items-center justify-center max-w-3xl mx-auto w-full py-4"
                    >
                        {/* ACTION: LEARN */}
                        <button 
                            onClick={() => handleActionSelect('LEARN')}
                            className="min-h-[16rem] h-auto bg-gradient-to-br from-indigo-900/60 to-slate-900 border-2 border-indigo-500/30 hover:border-indigo-400 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-4 group transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                        >
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-500/20 rounded-full flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors border-2 border-indigo-500/20 group-hover:border-indigo-400">
                                <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-indigo-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-arcade">تعلم والعب</h2>
                                <p className="text-slate-400 text-sm">حفظ جديد، مراجعة، ألعاب تفاعلية</p>
                            </div>
                        </button>

                        {/* ACTION: RECITATE */}
                        <button 
                            onClick={() => handleActionSelect('RECITATE')}
                            className="min-h-[16rem] h-auto bg-gradient-to-br from-emerald-900/60 to-slate-900 border-2 border-emerald-500/30 hover:border-emerald-400 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-4 group transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        >
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors border-2 border-emerald-500/20 group-hover:border-emerald-400">
                                <Mic className="w-10 h-10 md:w-12 md:h-12 text-emerald-300" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-arcade">تسميع</h2>
                                <p className="text-slate-400 text-sm">اختبار التلاوة والتحقق من الحفظ</p>
                            </div>
                        </button>
                    </motion.div>
                )}

                {/* --- STEP 2: SELECT SURAH --- */}
                {step === 'SELECT_SURAH' && (
                     <motion.div
                        key="select-surah"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex-1 flex flex-col bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto w-full my-4"
                     >
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={goBack} className="bg-slate-700 p-2 rounded-lg hover:bg-slate-600 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-white font-arcade">
                                    {intent === 'LEARN' ? 'ماذا تريد أن تحفظ؟' : 'ماذا تريد أن تُسمّع؟'}
                                </h2>
                                <p className="text-xs text-slate-400">اختر السورة لتكمل</p>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-6" ref={suggestionsRef}>
                            <div className="relative">
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
                                    className="w-full bg-slate-900/80 border-2 border-slate-600 rounded-2xl py-4 pl-4 pr-12 text-white font-sans text-lg focus:border-arcade-cyan focus:outline-none transition-all placeholder:text-slate-500 text-right"
                                />
                                <Search className="absolute right-4 top-4.5 w-6 h-6 text-slate-400" />
                            </div>

                            <AnimatePresence>
                                {showSuggestions && searchTerm && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden max-h-40 overflow-y-auto"
                                    >
                                        {getSuggestions().map((s) => (
                                            <button key={s} onClick={() => handleSelectSurah(s)} className="w-full text-right px-4 py-3 text-white hover:bg-slate-700 border-b border-slate-700/50 last:border-0 font-bold">
                                                {s}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Range Selection */}
                        <div className="flex-1">
                            {selectedSurah ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                     <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                        <span className="text-slate-400 text-xs">السورة المختارة</span>
                                        <span className="text-white font-bold text-xl">{selectedSurah}</span>
                                     </div>

                                    {/* Range Toggles */}
                                    <div className="bg-slate-900 p-1 rounded-xl flex">
                                        <button onClick={() => setVerseMode('FULL')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${verseMode === 'FULL' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>
                                            كامل السورة
                                        </button>
                                        <button onClick={() => setVerseMode('RANGE')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${verseMode === 'RANGE' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>
                                            تحديد آيات
                                        </button>
                                    </div>

                                    {verseMode === 'RANGE' && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-400 block mb-2 text-center">من الآية</label>
                                                <input type="number" min="1" value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-center text-white text-xl font-bold outline-none focus:border-arcade-cyan" />
                                            </div>
                                            <div className="text-slate-500 font-bold text-xl pt-6">:</div>
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-400 block mb-2 text-center">إلى الآية</label>
                                                <input type="number" min="1" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-center text-white text-xl font-bold outline-none focus:border-arcade-cyan" />
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                    <Search size={48} className="mb-2" />
                                    <p>اختر سورة للبدء</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <ArcadeButton 
                                disabled={!selectedSurah}
                                size="lg" 
                                onClick={handleSurahConfirmed}
                                variant={intent === 'LEARN' ? 'primary' : 'success'}
                                className={`w-full flex items-center justify-center gap-3 font-bold transition-all ${!selectedSurah ? 'opacity-50 grayscale cursor-not-allowed' : 'animate-pulse-fast'}`}
                            >
                                {intent === 'LEARN' ? 'اختيار طريقة الحفظ' : 'بدء التسميع'} <ChevronRight className="rtl:rotate-180" />
                            </ArcadeButton>
                        </div>
                     </motion.div>
                )}

                {/* --- STEP 3: SELECT MODE (LEARN INTENT ONLY) --- */}
                {step === 'SELECT_MODE' && (
                    <motion.div
                        key="select-mode"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex-1 flex flex-col w-full max-w-5xl mx-auto py-4"
                    >
                        <div className="flex items-center gap-4 mb-4 px-2 md:px-4">
                            <button onClick={goBack} className="bg-slate-700 p-2 rounded-lg hover:bg-slate-600 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-white font-arcade">
                                    {isTrainingMode ? 'تدريب موجّه' : 'اختر الطريقة'}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    سورة {selectedSurah} 
                                    {isTrainingMode && <span className="text-arcade-cyan font-bold mx-1">({rangeStart}-{rangeEnd || 'end'})</span>}
                                </p>
                            </div>
                        </div>

                        {/* Training Mode Banner */}
                        {isTrainingMode && (
                            <div className="mx-2 md:mx-4 mb-6 bg-green-900/30 border border-green-500/50 p-4 rounded-xl flex items-center gap-3">
                                <Target className="text-green-400 w-6 h-6 animate-pulse shrink-0" />
                                <div>
                                    <h3 className="font-arcade text-green-400 text-sm">تم ضبط الألعاب بناءً على التشخيص</h3>
                                    <p className="text-xs text-slate-400">جميع الألعاب ستركز الآن على الآيات التي تحتاج إلى تحسين.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-2 md:px-4 pb-8 space-y-6 custom-scrollbar">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CARD 1: CORE LEARNING */}
                                <button 
                                    onClick={() => handleGameStart('LEARN')}
                                    className="bg-slate-800 border-2 border-green-500/50 p-6 rounded-2xl hover:bg-slate-700 transition-all text-right group shadow-lg flex flex-col justify-between min-h-[12rem] md:min-h-[14rem]"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="bg-green-500/20 p-3 rounded-full">
                                            <Mic className="text-green-400 w-6 h-6" />
                                        </div>
                                        <span className="text-green-400 font-arcade text-xs">حفظ وتلقين</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">المحفظ الذكي</h4>
                                        <p className="text-slate-400 text-sm mt-1">تلقين الآيات وإخفاء تدريجي للكلمات.</p>
                                    </div>
                                </button>

                                {/* CARD 2: INTERACTIVE REVISION (CLASSIC GAME) */}
                                <button 
                                    onClick={() => handleGameStart('CLASSIC')}
                                    className="bg-slate-800 border-2 border-arcade-cyan/50 p-6 rounded-2xl hover:bg-slate-700 transition-all text-right group shadow-lg flex flex-col justify-between min-h-[12rem] md:min-h-[14rem]"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="bg-arcade-cyan/20 p-3 rounded-full">
                                            <Zap className="text-arcade-cyan w-6 h-6" />
                                        </div>
                                        <span className="text-arcade-cyan font-arcade text-xs">مراجعة سريعة</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white group-hover:text-arcade-cyan transition-colors">جسر الآيات</h4>
                                        <p className="text-slate-400 text-sm mt-1">أكمل الآيات باختيار الكلمة التالية (خيارات).</p>
                                    </div>
                                </button>
                            </div>

                            {/* SECTION: ASSESSMENT */}
                            <section>
                                <button 
                                    onClick={() => handleGameStart('QUIZ')}
                                    className="w-full bg-slate-800 border-l-4 border-yellow-500 p-6 rounded-r-xl hover:bg-slate-700 transition-all text-right group shadow-lg flex items-center justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <BookOpen className="text-yellow-400 w-5 h-5" />
                                            <h4 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">اختبار المعاني والتفسير</h4>
                                        </div>
                                        <p className="text-slate-400 text-sm">أسئلة متعددة في المفردات والتفسير.</p>
                                    </div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white rtl:rotate-180" />
                                </button>
                            </section>

                            {/* SECTION: ARCADE GAMES */}
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-700 pb-2">
                                    <Gamepad2 size={16} />
                                    <h3 className="font-arcade text-sm">ألعاب إضافية (آركيد)</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <GameCard 
                                        title="ترتيب" 
                                        desc="رتب الآيات"
                                        icon={<Puzzle />}
                                        color="purple"
                                        onClick={() => handleGameStart('ASSEMBLY')}
                                    />
                                    <GameCard 
                                        title="تزلج" 
                                        desc="التقط الكلمات"
                                        icon={<Waves />}
                                        color="blue"
                                        onClick={() => handleGameStart('SURF')}
                                    />
                                    <GameCard 
                                        title="برج" 
                                        desc="ابنِ الكلمات"
                                        icon={<Layers />}
                                        color="emerald"
                                        onClick={() => handleGameStart('STACK')}
                                    />
                                    <GameCard 
                                        title="صمود" 
                                        desc="دافع عن الحفظ"
                                        icon={<Ghost />} 
                                        color="red"
                                        onClick={() => handleGameStart('SURVIVOR')}
                                    />
                                </div>
                            </section>

                        </div>
                    </motion.div>
                )}

            </AnimatePresence>

        </div>
    </div>
  );
};

const GameCard: React.FC<{title: string, desc: string, icon: React.ReactNode, color: string, onClick: () => void}> = ({ title, desc, icon, color, onClick }) => {
    const colorClasses: any = {
        cyan: "border-arcade-cyan hover:shadow-cyan-500/20 text-arcade-cyan",
        purple: "border-arcade-purple hover:shadow-purple-500/20 text-arcade-purple",
        blue: "border-blue-500 hover:shadow-blue-500/20 text-blue-400",
        emerald: "border-emerald-500 hover:shadow-emerald-500/20 text-emerald-400",
        red: "border-red-500 hover:shadow-red-500/20 text-red-400",
    };

    return (
        <button 
            onClick={onClick}
            className={`bg-slate-800 border-2 ${colorClasses[color].split(' ')[0]} p-3 rounded-2xl text-center hover:-translate-y-1 transition-all hover:shadow-lg group flex flex-col items-center gap-2 h-full justify-between`}
        >
            <div className={`p-2 rounded-lg bg-slate-900 ${colorClasses[color].split(' ').pop()}`}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm group-hover:text-white transition-colors">{title}</h4>
                <p className="text-slate-500 text-[10px] hidden md:block">{desc}</p>
            </div>
        </button>
    );
};
