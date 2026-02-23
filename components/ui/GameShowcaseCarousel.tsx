import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Mic, Layers, Brain, Waves, Shield, Zap, CheckCircle2, XCircle, AlertCircle, Ghost, Puzzle, RotateCcw, LockOpen } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Slide 1 — Recitation Analysis (سورة طه) with highlighted mistakes
// ─────────────────────────────────────────────────────────────────────────────
const RecitationAnalysisSlide: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#0b1120] rounded-2xl overflow-hidden font-arabic" dir="rtl">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                {/* Header card */}
                <div className="bg-[#151e2e] rounded-xl p-5 border border-slate-800 relative mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1 items-start">
                            <span className="bg-slate-700/50 text-slate-300 font-sans text-[10px] font-bold px-2 py-0.5 rounded-full">Verses 1 - End</span>
                            <span className="text-white text-xl font-bold">الأعلى</span>
                        </div>
                        <button className="text-slate-500 hover:text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                        </button>
                    </div>
                    <div className="text-slate-400 text-[10px] leading-[1.8] mt-4 mb-4 text-justify pl-32">
                        يا بني، تلاوتك تحتاج إلى مراجعة دقيقة وتصحيح شامل. لقد ارتكبت أخطاء جسيمة في الحفظ في موضعين أساسيين: في الآية الثالثة بتبديل 'قَدَّرَ' إلى 'فَدَّرَ'، وفي الآية السادسة بتبديل 'فَلَا تَنْسَىٰ' بجملة 'إِلَّا مَا شَاءَ اللَّهُ'. هذه الأخطاء تؤثر على معنى الآيات بشكل مباشر وتدل على ضعف في تثبيت الحفظ. وهذا لا يجوز في كتاب الله. كما أن هناك العديد من الأخطاء في التشكيل ورسم المصحف، مثل إهمال الشدات والتنوين وهمزة الوصل، وعدم كتابة الألف المقصورة بشكلها القرآني الصحيح. نصيحتي لك هي أن تعود إلى المصحف الشريف، وتراجع الآيات كلمة بكلمة وحرفاً حرفاً، مع التركيز على ضبط الحركات والشدات ومخارج الحروف، وتأكد من أن حفظك سليم 100% قبل المضي قدمًا. استعن بشيخ متقن لتصحيح تلاوتك شفوياً أيضاً. فالمشافهة هي الأصل في تلقي القرآن.
                    </div>
                    {/* Two buttons */}
                    <div className="flex flex-col lg:flex-row gap-2 mt-4 absolute top-4 left-4">
                        <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors">الآيات التالية <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
                        <div className="flex gap-2">
                            <button className="bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 px-3 py-2 rounded-lg flex items-center justify-center transition-colors"><RotateCcw size={12} /></button>
                            <button className="bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 px-4 py-2 rounded-lg text-[10px] font-bold transition-colors">قائمة الألعاب</button>
                        </div>
                    </div>
                </div>

                {/* Timeline Analysis */}
                <div className="bg-[#151e2e] rounded-xl p-4 border border-slate-800 mb-4">
                    <div className="flex justify-between items-center mb-4 text-[9px] font-bold font-sans text-cyan-400 tracking-widest">
                        <span>TIMELINE ANALYSIS</span>
                        <div className="flex items-center gap-1 font-arabic text-xs">المخطط الصوتي <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400"><path d="M2 6c.6 0 1.2-.2 1.7-.6C4.8 4.3 6.1 4 7.5 4s2.7.3 3.8 1.4C11.8 5.8 12.4 6 13 6c.6 0 1.2-.2 1.7-.6C15.8 4.3 17.1 4 18.5 4c1.4 0 2.7.3 3.8 1.4.5.4 1.1.6 1.7.6V8c-.6 0-1.2.2-1.7.6C21.2 9.7 19.9 10 18.5 10s-2.7-.3-3.8-1.4c-.5-.4-1.1-.6-1.7-.6-.6 0-1.2.2-1.7.6C10.2 9.7 8.9 10 7.5 10 6.1 10 4.8 9.7 3.7 8.6 3.2 8.2 2.6 8 2 8V6Z" /><path d="M2 12c.6 0 1.2-.2 1.7-.6C4.8 10.3 6.1 10 7.5 10s2.7.3 3.8 1.4c.5.4 1.1.6 1.7.6.6 0 1.2-.2 1.7-.6C15.8 10.3 17.1 10 18.5 10c1.4 0 2.7.3 3.8 1.4.5.4 1.1.6 1.7.6v2c-.6 0-1.2.2-1.7.6C21.2 15.7 19.9 16 18.5 16s-2.7-.3-3.8-1.4c-.5-.4-1.1-.6-1.7-.6-.6 0-1.2.2-1.7.6C10.2 15.7 8.9 16 7.5 16 6.1 16 4.8 15.7 3.7 14.6 3.2 14.2 2.6 14 2 14v-2Z" /><path d="M2 18c.6 0 1.2-.2 1.7-.6C4.8 16.3 6.1 16 7.5 16s2.7.3 3.8 1.4c.5.4 1.1.6 1.7.6.6 0 1.2-.2 1.7-.6C15.8 16.3 17.1 16 18.5 16c1.4 0 2.7.3 3.8 1.4.5.4 1.1.6 1.7.6v2c-.6 0-1.2.2-1.7.6C21.2 21.7 19.9 22 18.5 22s-2.7-.3-3.8-1.4c-.5-.4-1.1-.6-1.7-.6-.6 0-1.2.2-1.7.6C10.2 21.7 8.9 22 7.5 22 6.1 22 4.8 21.7 3.7 20.6 3.2 20.2 2.6 20 2 20v-2Z" /></svg></div>
                    </div>
                    <div className="relative h-16 flex items-center mt-2 pb-4">
                        {/* Waveform graphic static representation */}
                        <div className="absolute inset-0 flex items-center px-4">
                            <div className="w-full h-8 flex items-center gap-[3px] justify-between">
                                {Array.from({ length: 45 }).map((_, i) => (
                                    <div key={i} className={`w-1 rounded-full ${i % 7 === 0 || i % 11 === 0 ? 'bg-cyan-600/60 h-8' : 'bg-cyan-800/40 h-4'}`} style={{ height: `${20 + (Math.sin(i) * 20) + (Math.random() * 10)}px` }} />
                                ))}
                            </div>
                        </div>
                        {/* Timeline nodes */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex items-center justify-between px-8 z-10 w-[85%]">
                            <div className="h-0.5 w-[calc(100%-2rem)] absolute top-1/2 -translate-y-1/2 left-4 bg-[#2a3855] -z-10" />
                            {[0, 1, 2, 3].map(i => <div key={i} className="w-4 h-4 rounded-full bg-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.6)] border-[3px] border-[#151e2e]" />)}
                            <div className="w-4 h-4 rounded-full bg-[#f43f5e] border-[3px] border-[#151e2e] shadow-[0_0_12px_rgba(244,63,94,0.8)] relative cursor-pointer group">
                                {/* Tooltip */}
                                <div className="absolute bottom-[100%] mb-1 left-1/2 -translate-x-1/2 w-[140px] bg-[#2a3855] border border-slate-600 rounded-lg p-2 text-center shadow-xl opacity-100 transition-opacity whitespace-normal pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-[#2a3855]">
                                    <div className="text-[8px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded inline-block mb-1">الآية 6</div>
                                    <div className="text-[8px] text-slate-200 leading-tight">خطأ فادح في الحفظ: استبدال جملة كاملة (فلا تنسى) بجملة...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Card 1 */}
                    <div className="bg-[#151e2e] rounded-xl p-4 border border-slate-800 flex flex-col h-[180px]">
                        <div className="flex justify-between items-center mb-2 font-bold font-arabic">
                            <span className="text-white text-[10px] font-sans">50%</span>
                            <span className="text-orange-400 text-xs flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg> المخارج والنطق</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1e293b] rounded-full mb-6 mt-1 overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full w-1/2" />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
                            <div className="w-10 h-10 rounded-full border-2 border-orange-500/30 flex items-center justify-center mb-2 bg-orange-500/5 text-orange-400">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                            </div>
                            <div className="text-xs text-white font-bold mb-1">أداء ممتاز!</div>
                            <div className="text-[9px] text-slate-500">لا توجد أخطاء في هذا القسم</div>
                        </div>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-[#151e2e] rounded-xl p-4 border border-slate-800 flex flex-col h-[180px]">
                        <div className="flex justify-between items-center mb-2 font-bold font-arabic">
                            <span className="text-white text-[10px] font-sans">50%</span>
                            <span className="text-[#a855f7] text-xs flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg> التجويد والأحكام</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1e293b] rounded-full mb-3 mt-1 overflow-hidden">
                            <div className="h-full bg-[#a855f7] rounded-full w-1/2" />
                        </div>
                        {/* Error item */}
                        <div className="bg-[#1e293b] rounded-lg p-3 py-2 overflow-y-auto custom-scrollbar flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[#4ade80] font-arabic text-sm font-bold">سَبِّحِ</span>
                                <span className="text-[9px] text-slate-500 font-sans tracking-wide">Verse 1</span>
                            </div>
                            <div className="text-[#a855f7] font-arabic text-sm font-bold mb-1">سَبِّحِ</div>
                            <div className="text-[9px] text-slate-300 mb-2 leading-[1.6]">خطأ في التشكيل: إهمال كسرة حرف الحاء، وهي كسرة فعل الأمر (سَبِّحِ) لعدم التقاء ساكنين في الوصل، كذلك إهمال الشدة على حرف الباء.</div>
                            <div className="bg-[#3b0764]/40 text-[#d8b4fe] text-[9px] p-2 rounded-md border border-[#7e22ce]/30 flex gap-1.5 items-start leading-[1.6]">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-[#a855f7]"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                <span>يرجى الانتباه لضبط أواخر الكلمات وحركاتها والشدات: فتغيير الحركة قد يغير المعنى...</span>
                            </div>
                        </div>
                    </div>
                    {/* Card 3 */}
                    <div className="bg-[#151e2e] rounded-xl p-4 border border-slate-800 flex flex-col h-[180px]">
                        <div className="flex justify-between items-center mb-2 font-bold font-arabic">
                            <span className="text-white text-[10px] font-sans">40%</span>
                            <span className="text-[#38bdf8] text-xs flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg> الحفظ والإتقان</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1e293b] rounded-full mb-3 mt-1 overflow-hidden">
                            <div className="h-full bg-[#38bdf8] rounded-full w-[40%]" />
                        </div>
                        {/* Error item */}
                        <div className="bg-[#1e293b] rounded-lg p-3 py-2 overflow-y-auto custom-scrollbar flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[#4ade80] font-arabic text-sm font-bold">وَٱلَّذِى</span>
                                <span className="text-[9px] text-slate-500 font-sans tracking-wide">Verse 3</span>
                            </div>
                            <div className="text-[#38bdf8] font-arabic text-sm font-bold mb-1">و ٱلذي</div>
                            <div className="text-[9px] text-slate-300 mb-2 leading-[1.6]">خطأ في رسم المصحف والتجويد: نقص حرف الألف بعد الواو، وإهمال الشدة على حرف اللام.</div>
                            <div className="bg-[#0c4a6e]/40 text-[#bae6fd] text-[9px] p-2 rounded-md border border-[#0284c7]/30 flex gap-1.5 items-start leading-[1.6] mt-4">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-[#38bdf8]"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                <span>لا بد من مراجعة الآية جيدا للتأكد من كل حروفها وتشكيلها.</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Slide 2 — Smart Memorizer (إخفاء تدريجي)
// ─────────────────────────────────────────────────────────────────────────────
const MemorizerSlide: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#0b1120] rounded-2xl overflow-hidden font-arabic" dir="rtl">
            <div className="flex-1 flex flex-col p-4 gap-3 bg-[#0b1120]">

                {/* Rows */}
                <div className="bg-[#151e2e] border border-slate-800 rounded-xl p-4 flex justify-between pr-8 items-center text-white text-xl relative h-16 shadow-lg">
                    <div className="flex-1 text-center font-bold">سَبِّحِ</div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative bg-emerald-900/40 border-[1.5px] border-[#22c55e] rounded-lg px-4 py-1 text-[#4ade80] font-bold shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                            ٱسۡمَ
                            <div className="absolute -top-2 -right-2 bg-[#22c55e] rounded-full p-[3px] shadow-sm"><CheckCircle2 size={12} className="text-[#0b1120]" strokeWidth={3} /></div>
                        </div>
                    </div>
                    <div className="flex-1 text-center font-bold whitespace-nowrap">رَبِّكَ ٱلۡأَعۡلَىٰ</div>
                    <div className="w-5 h-5 rounded-full bg-[#1e293b] text-slate-500 border border-slate-700 flex items-center justify-center font-sans text-[10px] absolute right-3 top-1/2 -translate-y-1/2 font-bold">1</div>
                </div>

                <div className="bg-[#151e2e] border border-slate-800 rounded-xl p-4 flex justify-between pr-8 items-center text-white text-xl relative h-16 shadow-lg">
                    <div className="flex-1 text-center font-bold">ٱلَّذِى</div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative bg-[#064e3b]/30 border-[1.5px] border-[#10b981] rounded-lg px-4 py-1 text-[#34d399] font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            خَلَقَ
                            <div className="absolute -top-2 -right-2 bg-[#10b981] rounded-full p-[3px] shadow-sm"><CheckCircle2 size={12} className="text-[#0b1120]" strokeWidth={3} /></div>
                        </div>
                    </div>
                    <div className="flex-1 text-center font-bold">فَسَوَّىٰ</div>
                    <div className="w-5 h-5 rounded-full bg-[#1e293b] text-slate-500 border border-slate-700 flex items-center justify-center font-sans text-[10px] absolute right-3 top-1/2 -translate-y-1/2 font-bold">2</div>
                </div>

                <div className="bg-[#151e2e] border border-slate-800 rounded-xl p-4 flex justify-between pr-8 items-center text-white text-xl relative h-16 shadow-lg">
                    <div className="flex-1 text-center font-bold">وَٱلَّذِى</div>
                    <div className="flex-1 flex justify-center">
                        <div className="min-w-[50px] h-8 border-[1.5px] border-dashed border-[#475569] rounded-lg bg-[#0f172a]/80 flex items-center justify-center text-slate-500 font-sans tracking-[0.2em] text-sm">...</div>
                    </div>
                    <div className="flex-1 text-center font-bold">فَهَدَىٰ</div>
                    <div className="w-5 h-5 rounded-full bg-[#1e293b] text-slate-500 border border-slate-700 flex items-center justify-center font-sans text-[10px] absolute right-3 top-1/2 -translate-y-1/2 font-bold">3</div>
                </div>

                <div className="bg-[#151e2e] border border-slate-800 rounded-xl p-4 flex justify-between pr-8 items-center text-white text-xl relative h-16 shadow-lg opacity-[0.85]">
                    <div className="flex-1 text-center font-bold whitespace-nowrap">وَٱلَّذِىٓ أَخۡرَجَ</div>
                    <div className="flex-1 flex justify-center">
                        <div className="min-w-[50px] h-8 border-[1.5px] border-dashed border-[#475569] rounded-lg bg-[#0f172a]/80 flex items-center justify-center text-slate-500 font-sans tracking-[0.2em] text-sm md:-ml-12">...</div>
                    </div>
                    <div className="flex-1"></div>
                    <div className="w-5 h-5 rounded-full bg-[#1e293b] text-slate-500 border border-slate-700 flex items-center justify-center font-sans text-[10px] absolute right-3 top-1/2 -translate-y-1/2 font-bold">4</div>
                </div>


                {/* Bottom Nav Area */}
                <div className="mt-auto flex flex-col w-full items-center relative pt-8 pb-2">
                    {/* Toggle */}
                    <div className="absolute top-0 flex gap-0.5 bg-[#0f172a] border border-slate-800 rounded-full p-1 shadow-lg">
                        <button className="px-5 py-2 rounded-full bg-[#06b6d4] hover:bg-cyan-400 text-[#0f172a] text-[11px] font-bold flex items-center gap-1.5 transition-colors">تلاوة <Mic size={14} /></button>
                        <button className="px-5 py-2 rounded-full text-slate-400 text-[11px] font-bold flex items-center gap-1.5 hover:text-white transition-colors">كتابة <Puzzle size={14} /></button>
                    </div>

                    <div className="bg-[#4a3619]/20 border border-[#b45309]/30 text-[#fbbf24] text-[9px] w-[80%] max-w-xs text-center font-bold px-4 py-2 rounded-full flex gap-1.5 items-center justify-center mb-4 mt-2">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>تنبيه: اقرأ الآية كاملة بشكل متصل لملء الفراغات</span>
                    </div>

                    <div className="w-[80%] max-w-sm flex gap-3 relative z-10 items-center justify-between">
                        {/* Name badge small */}
                        <div className="absolute -top-12 -right-4 border border-[#0f766e] rounded-full px-3 py-1 bg-[#064e3b]/30 flex gap-1 items-center text-[10px] text-[#2dd4bf] font-bold hidden md:flex">
                            <Mic size={10} /> اسم داق
                        </div>
                        <button className="flex-1 bg-gradient-to-r from-[#06b6d4] to-[#0ea5e9] hover:brightness-110 text-[#0f172a] font-black py-4 rounded-xl text-xs shadow-[0_4px_15px_rgba(6,182,212,0.3)] border-b-[3px] border-[#0891b2] flex justify-between px-6 items-center transition-all">
                            المستوى التالي (50%)
                            <ChevronLeft size={16} strokeWidth={3} />
                        </button>
                        <button className="bg-[#1e293b] border-2 border-[#ef4444]/30 text-[#ef4444] rounded-xl h-[52px] w-[60px] flex items-center justify-center shadow-lg relative overflow-hidden group hover:border-red-500/50 transition-colors shrink-0">
                            <div className="absolute inset-0 bg-[#ef4444]/10 animate-pulse"></div>
                            <Mic size={22} className="relative z-10" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Slide 3 — Quran Stack (برج الحفظ)
// ─────────────────────────────────────────────────────────────────────────────
const StackerSlide: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#111827] rounded-2xl overflow-hidden font-arabic relative" dir="rtl">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 to-[#111827]/10" />

            <div className="relative z-10 h-full flex flex-col">
                <div className="w-full pt-6 pb-2 flex items-center justify-center gap-2">
                    <span className="text-slate-300 font-bold text-[11px] font-sans">المستوى 4</span>
                    <Zap size={14} className="text-[#f97316] fill-[#f97316]" />
                </div>

                <div className="flex-1 relative flex justify-center items-end pb-12 overflow-hidden">
                    <div className="w-[180px] sm:w-[220px] flex flex-col items-center">
                        {/* The flying active block */}
                        <div className="mb-2 w-[110%] relative z-20">
                            <div className="bg-[#8b5cf6] w-full h-[46px] rounded-lg flex items-center justify-center border-b-[3px] border-b-[#6d28d9] shadow-[0_4px_10px_rgba(139,92,246,0.3)] relative border border-purple-400/20 box-border hover:brightness-110 cursor-pointer">
                                <div className="absolute inset-0 bg-white/5 rounded-lg border-t border-white/10 pointer-events-none" />
                                <span className="text-white text-lg font-bold drop-shadow-md">ٱلۡقُرۡءَانَ</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center relative z-10 translate-x-1">
                            {/* Blue Block */}
                            <div className="bg-[#3b82f6] w-[230px] sm:w-[245px] h-[46px] rounded-lg flex items-center justify-center border-b-[3px] border-b-[#2563eb] shadow-[0_4px_10px_rgba(59,130,246,0.2)] -mt-[2px] cursor-pointer relative z-[15] filter grayscale-[10%] brightness-[1.05]">
                                <div className="absolute inset-0 bg-white/10 rounded-lg pointer-events-none" />
                                <span className="text-white text-lg font-bold drop-shadow-md">عَلَيۡكَ</span>

                                {/* Mouse cursor overlay */}
                                <div className="absolute z-50 left-[50%] -bottom-4 translate-y-1">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg scale-150">
                                        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.04c.45 0 .67-.54.35-.85L5.5 3.21z" fill="white" stroke="#333" strokeWidth="1.2" />
                                    </svg>
                                </div>
                            </div>

                            {/* Cyan Block */}
                            <div className="bg-[#06b6d4] w-[240px] sm:w-[255px] h-[46px] rounded-lg flex items-center justify-center border-b-[3px] border-b-[#0891b2] -mt-[4px] relative z-[14] filter grayscale-[20%] brightness-95">
                                <span className="text-white text-xl font-bold drop-shadow-md">أَنزَلۡنَا</span>
                            </div>

                            {/* Green Block 1 */}
                            <div className="bg-[#10b981] w-[250px] sm:w-[265px] h-[46px] rounded-lg flex items-center justify-center border-b-[3px] border-b-[#059669] -mt-[4px] relative z-[13] filter grayscale-[25%] brightness-90">
                                <span className="text-white text-xl font-bold drop-shadow-md">مَا</span>
                            </div>

                            {/* Green Block 2 (base) */}
                            <div className="bg-[#10b981] w-[250px] sm:w-[265px] h-[46px] rounded-lg flex items-center justify-center border-b-[3px] border-b-[#047857] -mt-[4px] relative z-[12] filter grayscale-[25%] brightness-90 translate-x-1 shadow-[0_8px_15px_rgba(0,0,0,0.5)]">
                                <span className="text-white text-xl font-bold drop-shadow-md">طه</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Slide 5 — Echo Bridge (جسر الآيات)
// ─────────────────────────────────────────────────────────────────────────────
const BridgeSlide: React.FC = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setStep(s => (s + 1) % 3), 1500);
        return () => clearInterval(t);
    }, []);

    const words = [
        { word: 'إِلَّا', active: step === 0 },
        { word: 'إِنَّمَا', active: step === 1 },
        { word: 'بَل', active: step === 2 },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Zap size={12} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-300">جسر الآيات</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">سورة طه • ٢➔٣</span>
                <span className="text-[10px] text-indigo-400 font-bold">1/5 ⚡</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6 bg-slate-950 px-6">
                <div className="w-full text-center">
                    <span className="text-[10px] text-slate-500 font-bold mb-4 block">اربط الآية بالتي تليها</span>
                    <div className="text-xl text-white font-arabic bg-slate-900 p-4 rounded-xl border border-slate-800 leading-loose">
                        ...عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ <br /> <span className="inline-block border-b-2 border-indigo-500 text-indigo-400 mx-1 w-16 text-center pt-2">_____</span> تَذْكِرَةً لِمَنْ يَخْشَىٰ
                    </div>
                </div>

                <div className="flex gap-3 justify-center w-full">
                    {words.map((w, i) => (
                        <motion.div
                            key={i}
                            animate={w.active ? { scale: 1.05, y: -4, boxShadow: '0 0 15px rgba(99,102,241,0.5)' } : { scale: 1, y: 0, boxShadow: 'none' }}
                            className={`flex justify-center items-center py-3 px-4 rounded-lg border-2 flex-1 cursor-default transition-all ${w.active ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                        >
                            <span className="font-arabic font-bold text-sm">{w.word}</span>
                        </motion.div>
                    ))}
                </div>
                <div className="w-full h-1 bg-slate-800 rounded mt-4 overflow-hidden relative">
                    <motion.div className="h-full bg-indigo-500" animate={{ width: `${(step + 1) * 33}%` }} transition={{ duration: 0.5 }} />
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Slide 6 — Survivor (الناجي الأخير)
// ─────────────────────────────────────────────────────────────────────────────
// Slide 6 — Survivor (الناجي الأخير)
// ─────────────────────────────────────────────────────────────────────────────
const SurvivorSlide: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#0b1120] rounded-2xl overflow-hidden font-arabic" dir="rtl">
            <div className="flex justify-between items-center pt-5 pb-3 px-4">
                <div className="flex gap-1 items-center">
                    <Zap size={14} className="text-slate-800 fill-slate-800" />
                    <span className="text-[10px] text-[#475569] font-sans font-bold mt-0.5">x0</span>
                </div>
                <div className="text-center w-24">
                    <div className="text-[9px] text-[#38bdf8] font-bold mb-0.5 tracking-wide">النقاط</div>
                    <div className="text-white font-sans text-sm tracking-[0.2em] font-black leading-none bg-[#1e293b] py-1 rounded">00000</div>
                </div>
                <div className="flex gap-0.5 items-center">
                    {[1, 2, 3].map(i => <div key={i} className="text-red-500 text-sm drop-shadow-md">❤️</div>)}
                </div>
            </div>

            <div className="w-[90%] mx-auto h-[5px] bg-[#1e293b] rounded-full overflow-hidden border border-[#334155] mb-2">
                <div className="h-full bg-[#0ea5e9] rounded-full w-[25%]" />
            </div>

            <div className="flex-1 bg-[#0b1120] border border-[#1e293b] rounded-t-[2rem] mx-2 flex flex-col relative overflow-hidden mt-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                {/* Verse display */}
                <div className="flex-1 flex flex-col items-center justify-center pb-24">
                    <div className="text-[9px] text-slate-500 font-bold mb-3 tracking-wide text-[#475569]">الآية الحالية</div>
                    <div className="font-bold text-4xl text-white tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pb-8">طه</div>
                </div>

                {/* Options box */}
                <div className="bg-[#1e293b] rounded-t-[1.5rem] px-4 pb-6 pt-3 border-t border-[#334155]/50 w-full absolute bottom-0">
                    <div className="flex justify-center items-center gap-1.5 mb-3">
                        <span className="text-[#22c55e] font-bold text-[9px] -mt-0.5">تم السماح بالدخول: اختر الرابط</span>
                        <LockOpen size={12} className="text-[#22c55e]" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="w-full bg-[#334155]/50 border border-[#475569]/30 rounded-lg p-3 text-center cursor-pointer shadow-sm pb-4">
                            <span className="text-white font-bold text-sm tracking-wide">مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ</span>
                        </div>
                        <div className="w-full bg-[#334155]/80 border-[1.5px] border-[#60a5fa]/40 rounded-lg p-3 text-center cursor-pointer shadow-[inset_0_0_15px_rgba(96,165,250,0.15),0_2px_8px_rgba(0,0,0,0.3)] relative group flex items-center min-h-[50px] overflow-visible pb-4">
                            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none rounded-lg"></div>
                            <span className="text-white font-bold text-[10px] leading-relaxed px-1 w-full truncate">مَا أَصَابَكَ مِن حَسَنَةٍ فَمِنَ اللَّهِ ۖ وَمَا أَصَابَكَ مِن سَيِّئَةٍ فَمِن نَّفْسِكَ ۚ وَأَرْسَلْنَاكَ لِلنَّاسِ رَسُولًا ۚ وَكَفَىٰ بِاللَّهِ شَهِيدًا</span>

                            {/* Mouse cursor overlapping between 2 & 3 */}
                            <div className="absolute z-50 left-[45%] top-[80%]">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl scale-[1.3] -rotate-12">
                                    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.04c.45 0 .67-.54.35-.85L5.5 3.21z" fill="white" stroke="#222" strokeWidth="1.2" />
                                </svg>
                            </div>
                        </div>
                        <div className="w-full bg-[#334155]/50 border border-[#475569]/30 rounded-lg p-3 text-center cursor-pointer shadow-sm pb-4">
                            <span className="text-white font-bold text-sm tracking-wide">مَا أَنتَ بِنِعْمَةِ رَبِّكَ بِمَجْنُونٍ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Slide 7 — Verse Assembler (ترتيب الآيات)
// ─────────────────────────────────────────────────────────────────────────────
const AssemblerSlide: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[#0f172a] rounded-2xl overflow-hidden font-arabic" dir="rtl">
            <div className="relative z-10 flex flex-col h-full px-4 pt-4 pb-0">

                {/* Header */}
                <div className="flex items-center justify-between pb-3">
                    <div className="flex gap-1.5 items-center">
                        <Zap size={16} className="text-slate-700 fill-[#fcd34d]" />
                        <span className="text-[10px] text-white font-sans font-bold">x1</span>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-[#38bdf8] font-bold mb-0.5">النقاط</div>
                        <div className="text-white font-sans font-black text-sm tracking-[0.2em] px-1 py-0.5 rounded leading-none text-center">00200</div>
                    </div>
                    <div className="flex gap-1 items-center">
                        {[1, 2, 3].map(i => <div key={i} className="text-red-500 text-sm">❤️</div>)}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-[95%] mx-auto h-1.5 bg-[#1e293b] rounded-full mt-2 mb-4 overflow-hidden border border-[#334155]">
                    <div className="h-full bg-gradient-to-l from-cyan-400 to-blue-500 rounded-full w-[25%]" />
                </div>

                <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 flex flex-col mb-4">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <AlertCircle size={14} className="text-slate-400" />
                        <div className="text-right">
                            <div className="text-[9px] text-cyan-400 font-bold mb-0.5">وضع التجميع</div>
                            <div className="text-[10px] text-white/90">الآية 2</div>
                        </div>
                    </div>

                    <div className="flex gap-2 w-[90%] md:w-3/4 self-center mb-6 h-12">
                        {/* 3 boxes going right to left */}
                        <div className="w-1/3 h-full border border-dashed border-slate-600 rounded-lg flex items-center justify-center font-sans text-[10px] text-slate-500">2</div>
                        <div className="w-1/3 h-full border border-dashed border-slate-600 rounded-lg flex items-center justify-center font-sans text-[10px] text-slate-500">1</div>
                        <div className="w-1/3 h-14 bg-[#7c3aed] border border-purple-400/30 border-b-4 border-b-[#5b21b6] rounded-lg flex items-center justify-center shadow-lg -mt-1 transform scale-105 z-10 shrink-0">
                            <span className="text-white font-bold text-sm px-1">مَا أَنزَلْنَا</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-end">
                    {/* Pool */}
                    <div className="flex flex-wrap gap-x-2 gap-y-3 justify-center mb-6 relative px-2">
                        <div className="bg-[#1e293b] border border-slate-600 rounded-md px-3 font-bold text-[#cbd5e1] text-xs h-[30px] flex items-center justify-center pb-1 shadow-sm opacity-90">إِنَّا أَنزَلْنَا إِلَيْكَ الْكِتَابَ</div>

                        <div className="absolute top-2 left-[28%] z-50 transform -translate-x-1/2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg scale-[1.3] -rotate-12">
                                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.04c.45 0 .67-.54.35-.85L5.5 3.21z" fill="white" stroke="#333" strokeWidth="1" />
                            </svg>
                        </div>

                        <div className="bg-[#1e293b] border border-slate-600 rounded-md px-3 font-bold text-[#cbd5e1] text-xs flex items-center h-[30px] justify-center pb-1 shadow-sm">لِتَشْقَىٰ</div>
                        <div className="bg-[#1e293b] border border-slate-600 rounded-md px-3 font-bold text-[#cbd5e1] text-[11px] flex h-[30px] items-center justify-center pb-1 shadow-sm">فَأَنزَلَ اللَّهُ الْكِتَابَ وَالْمِيزَانَ</div>
                        <div className="bg-[#1e293b] border border-slate-600 rounded-md px-3 font-bold text-[#cbd5e1] text-[11px] flex h-[30px] items-center justify-center pb-1 shadow-sm">وَمَا أَنزَلْنَا عَلَيْكَ الْكِتَابَ</div>
                        <div className="bg-[#1e293b] border border-slate-600 rounded-md px-3 font-bold text-[#cbd5e1] text-xs h-[30px] flex items-center justify-center pb-1 shadow-sm">عَلَيْكَ الْقُرْآنَ</div>
                        <div className="bg-[#1e293b] border border-slate-600 rounded-md px-3 font-bold text-[#cbd5e1] text-[10px] h-[30px] flex items-center justify-center pb-1 shadow-sm">الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ</div>
                    </div>

                    <div className="flex gap-2 px-6 pb-6">
                        <button className="flex-1 bg-[#334155]/50 text-slate-400 font-sans font-bold text-[10px] rounded-xl h-11 border-b-2 border-[#1e293b] flex justify-center items-center pointer-events-none">
                            تحقق من الترتيب
                        </button>
                        <button className="bg-[#8b5cf6] text-white rounded-xl w-14 h-11 flex items-center justify-center border-b-2 border-[#6d28d9] shadow-md hover:brightness-110 shrink-0">
                            <RotateCcw size={16} className="" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
const SurferSlide: React.FC = () => {
    const [playerX, setPlayerX] = useState(45);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const t = setInterval(() => {
            setStep(s => s + 1);
            setPlayerX(prev => {
                const next = prev + (Math.sin(step * 0.3) * 5);
                return Math.max(5, Math.min(85, next));
            });
        }, 200);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const correctWord = 'أَنزَلنَا';
    const wrongWords = ['خَلَقنَا', 'جَعَلنَا'];
    const lanes = [
        { word: wrongWords[0], x: 15, speed: 1.5, color: 'from-red-800 to-red-600 border-red-500' },
        { word: correctWord, x: 42, speed: 2, color: 'from-emerald-800 to-emerald-600 border-emerald-400' },
        { word: wrongWords[1], x: 68, speed: 1.2, color: 'from-red-800 to-red-600 border-red-500' },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Waves size={12} className="text-cyan-400" />
                    <span className="text-xs font-bold text-slate-300">متزلج الكلمات</span>
                </div>
                <div className="text-center mt-1">
                    <span className="text-[10px] text-slate-400 block -mb-1">الآية ٢</span>
                    <span className="text-sm text-white font-bold font-arabic rtl-text block leading-none pt-1">مَا <span className="inline-block border-b-2 border-cyan-400 text-cyan-400 px-1 w-10 text-center">_____</span> عَلَيكَ</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-cyan-400 font-bold">x3 🏅</span>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
                {/* Road lines */}
                {[25, 50, 75].map(x => (
                    <div key={x} className="absolute top-0 bottom-0 w-px bg-slate-700/30" style={{ left: `${x}%` }} />
                ))}

                {/* Scrolling lane dots */}
                {[0, 1, 2].map(lane => (
                    Array.from({ length: 5 }, (_, i) => (
                        <motion.div
                            key={`${lane}-${i}`}
                            className="absolute w-0.5 h-4 bg-slate-600/50 rounded"
                            style={{ left: `${25 * lane + 11}%` }}
                            animate={{ y: ['0%', '2000%'] }}
                            transition={{ duration: 2 - lane * 0.2, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
                        />
                    ))
                ))}

                {/* Falling word cards */}
                {lanes.map((lane, i) => (
                    <motion.div
                        key={i}
                        className={`absolute bg-gradient-to-b ${lane.color} border rounded-xl px-2 py-2 shadow-lg text-center`}
                        style={{ left: `${lane.x}%`, width: '24%' }}
                        animate={{ y: ['10%', '85%'] }}
                        transition={{ duration: 2.5 / lane.speed, repeat: Infinity, ease: 'linear', delay: i * 0.6 }}
                    >
                        <span className="font-arabic text-white text-sm font-bold block leading-tight">{lane.word}</span>
                        {lane.word === correctWord && (
                            <div className="w-full h-0.5 bg-emerald-400/50 rounded mt-1" />
                        )}
                    </motion.div>
                ))}

                {/* Player icon */}
                <motion.div
                    className="absolute bottom-8 flex flex-col items-center z-10"
                    style={{ left: `${playerX}%` }}
                    animate={{ x: [0, 5, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                        <Shield size={18} className="text-cyan-500" />
                    </div>
                    <div className="text-[9px] text-cyan-300 font-bold mt-1">أنت</div>
                </motion.div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main carousel
// ─────────────────────────────────────────────────────────────────────────────
const slides = [
    {
        id: 'analysis',
        label: 'تحليل التلاوة',
        icon: Mic,
        color: 'from-cyan-500 to-blue-600',
        glow: 'shadow-cyan-500/20',
        desc: 'AI يصحح مخارج الحروف والأخطاء فوراً',
        component: RecitationAnalysisSlide,
    },
    {
        id: 'memorizer',
        label: 'المُحفظ الذكي',
        icon: Brain,
        color: 'from-yellow-500 to-orange-500',
        glow: 'shadow-yellow-500/20',
        desc: 'إخفاء تدريجي يجعل الحفظ طبيعياً',
        component: MemorizerSlide,
    },
    {
        id: 'stacker',
        label: 'برج الحفظ',
        icon: Layers,
        color: 'from-emerald-500 to-teal-500',
        glow: 'shadow-emerald-500/20',
        desc: 'ابنِ البرج كلمة كلمة بدقة متناهية',
        component: StackerSlide,
    },
    {
        id: 'surfer',
        label: 'متزلج الكلمات',
        icon: Waves,
        color: 'from-purple-500 to-pink-500',
        glow: 'shadow-purple-500/20',
        desc: 'اختر الكلمة الصحيحة وأنت تتزلج',
        component: SurferSlide,
    },
    {
        id: 'bridge',
        label: 'جسر الآيات',
        icon: Zap,
        color: 'from-indigo-500 to-purple-600',
        glow: 'shadow-indigo-500/20',
        desc: 'أكمل الفراغات بسرعة لعبور الجسر',
        component: BridgeSlide,
    },
    {
        id: 'survivor',
        label: 'الناجي الأخير',
        icon: Ghost,
        color: 'from-red-500 to-rose-600',
        glow: 'shadow-red-500/20',
        desc: 'دافع ضد الكلمات الخاطئة وانجُ بنفسك',
        component: SurvivorSlide,
    },
    {
        id: 'assembler',
        label: 'ترتيب الآيات',
        icon: Puzzle,
        color: 'from-orange-500 to-amber-500',
        glow: 'shadow-orange-500/20',
        desc: 'ركّب الكلمات المبعثرة بالترتيب الصحيح',
        component: AssemblerSlide,
    },
];

export const GameShowcaseCarousel: React.FC = () => {
    const [active, setActive] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = () => {
        intervalRef.current = setInterval(() => {
            setActive(prev => (prev + 1) % slides.length);
        }, 4500);
    };

    useEffect(() => {
        if (!isPaused) startTimer();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPaused]);

    const go = (dir: 1 | -1) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setActive(prev => (prev + dir + slides.length) % slides.length);
        if (intervalRef.current) clearInterval(intervalRef.current);
        startTimer();
    };

    const Slide = slides[active].component;
    const slide = slides[active];
    const Icon = slide.icon;

    return (
        <div
            className="w-full max-w-6xl mx-auto px-4 mb-32"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-bold mb-4">
                    <Zap size={12} className="animate-pulse" />
                    <span>معاينة حية للألعاب</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                    جرّب التجربة قبل أن تبدأ
                </h2>
                <p className="text-slate-400 text-lg max-w-xl mx-auto">
                    شاهد كيف يتعلم طفلك القرآن من خلال ألعاب تفاعلية مبنية على علم الأعصاب التربوي.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-center">
                {/* Left — Tab picker */}
                <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-56 shrink-0">
                    {slides.map((s, i) => {
                        const SI = s.icon;
                        const isActive = i === active;
                        return (
                            <button
                                key={s.id}
                                onClick={() => { setActive(i); if (intervalRef.current) clearInterval(intervalRef.current); startTimer(); }}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-2xl border text-right transition-all duration-300 flex-1 lg:flex-none
                                    ${isActive
                                        ? `bg-gradient-to-r ${s.color} border-transparent text-white shadow-xl ${s.glow}`
                                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                    }
                                `}
                            >
                                <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-700'}`}>
                                    <SI size={16} />
                                </div>
                                <div className="text-right hidden lg:block">
                                    <div className="text-xs font-black leading-tight">{s.label}</div>
                                    {isActive && <div className="text-[10px] opacity-80 leading-tight mt-0.5">{s.desc}</div>}
                                </div>
                                <div className="lg:hidden text-xs font-bold truncate">{s.label}</div>
                            </button>
                        );
                    })}
                </div>

                {/* Right — Game screen */}
                <div className="flex-1 w-full">
                    {/* Phone mock */}
                    <div className="relative mx-auto max-w-sm">
                        {/* Glow */}
                        <div className={`absolute inset-4 bg-gradient-to-b ${slide.color} blur-2xl opacity-20 -z-10 rounded-3xl`} />

                        {/* Device frame */}
                        <div className="bg-slate-900 rounded-[2rem] border-2 border-slate-700 shadow-2xl overflow-hidden">
                            {/* Status bar */}
                            <div className="bg-slate-800 px-6 py-2 flex justify-between items-center border-b border-slate-700">
                                <span className="text-[10px] text-slate-400 font-mono">20:17</span>
                                <div className="flex gap-1.5 items-center">
                                    <div className="flex gap-0.5 h-2 items-end">
                                        {[40, 70, 100, 60].map((h, i) => (
                                            <div key={i} className="w-0.5 bg-slate-400 rounded-t" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                    <div className="text-[10px] text-slate-400">●●●</div>
                                </div>
                            </div>

                            {/* Game content */}
                            <div className="h-[450px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={active}
                                        initial={{ opacity: 0, x: 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -40 }}
                                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                                        className="h-full"
                                    >
                                        <Slide />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Nav controls */}
                    <div className="flex items-center justify-center gap-4 mt-6">
                        <button
                            onClick={() => go(-1)}
                            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>

                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setActive(i); if (intervalRef.current) clearInterval(intervalRef.current); startTimer(); }}
                                className={`transition-all duration-300 rounded-full ${i === active ? `w-6 h-2 bg-gradient-to-r ${slides[i].color}` : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'}`}
                            />
                        ))}

                        <button
                            onClick={() => go(1)}
                            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
