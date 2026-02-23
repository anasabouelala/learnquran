import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, ChevronRight, Activity, Laptop as StartNew, Tablet, Smartphone } from 'lucide-react';

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

const ActiveLearnersCounter: React.FC = () => {
    const [activeLearners, setActiveLearners] = useState(23);
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveLearners(prev => {
                const change = Math.random() > 0.6 ? 1 : Math.random() > 0.5 ? -1 : 0;
                let next = prev + change;
                if (next < 18) next = 18;
                if (next > 45) next = 45;
                return next;
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 text-indigo-200 text-sm font-bold px-4 py-2 bg-indigo-900/30 rounded-full border border-indigo-500/20">
            <div className="relative flex items-center justify-center w-3 h-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <p><span className="text-white font-black text-base mx-1">{activeLearners}</span> طفل يتعلمون القرآن الآن</p>
        </div>
    );
};

const LiveActivityFeed: React.FC = () => {
    const [currentActivity, setCurrentActivity] = useState<string | null>(null);

    useEffect(() => {
        const activityInterval = setInterval(() => {
            const randomActivity = MOCK_ACTIVITIES[Math.floor(Math.random() * MOCK_ACTIVITIES.length)];
            setCurrentActivity(randomActivity);
            setTimeout(() => setCurrentActivity(null), 5000);
        }, 8000 + Math.random() * 5000);

        return () => clearInterval(activityInterval);
    }, []);

    return (
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
    );
};

interface HeroSectionProps {
    onLoginClick: () => void;
    onRegisterClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLoginClick, onRegisterClick }) => {
    return (
        <motion.div
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
                    <span className="font-extrabold text-xl tracking-tight text-white font-cairo">hafed.app</span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        className="hidden md:block text-slate-300 font-bold hover:text-white transition-colors text-sm"
                    >
                        تواصل معنا
                    </button>
                    <button
                        className="text-white font-bold hover:text-cyan-300 transition-colors px-4 py-2"
                        onClick={onLoginClick}
                    >
                        دخول
                    </button>
                    <button
                        onClick={onRegisterClick}
                        className="bg-white text-slate-900 px-6 py-3 rounded-full font-black text-sm shadow-[0_4px_0_#cbd5e1] hover:-translate-y-1 hover:shadow-[0_8px_0_#cbd5e1] active:translate-y-0 active:shadow-none transition-all flex items-center gap-2"
                    >
                        جرب مجانـاً ⚡
                    </button>
                </div>
            </div>

            {/* Live Activity Notification */}
            <LiveActivityFeed />

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
                        onClick={onRegisterClick}
                        className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-[0_10px_40px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        ابدأ رحلة الحفظ مجاناً
                        <ChevronRight className="rtl:rotate-180" />
                    </button>

                    <ActiveLearnersCounter />
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
        </motion.div>
    );
};
