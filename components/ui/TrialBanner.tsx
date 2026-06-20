
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Gift, Lock } from 'lucide-react';

const GUMROAD_URL = 'https://hafedapp.gumroad.com/l/mfkxjl?wanted=true';

interface TrialBannerProps {
    daysLeft: number;
    ended: boolean;
    gumroadUrl?: string;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ daysLeft, ended, gumroadUrl = GUMROAD_URL }) => {
    const daysLabel = daysLeft >= 2 ? 'يومان' : 'يوم واحد';

    return (
        <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 240, delay: 0.3 }}
            className="fixed top-0 inset-x-0 z-50 font-cairo"
            dir="rtl"
        >
            <div
                className={`flex items-center justify-between gap-3 px-4 py-2.5 shadow-[0_6px_32px_rgba(0,0,0,0.6)]
                    ${ended
                        ? 'bg-gradient-to-l from-red-700 via-rose-600 to-red-700'
                        : 'bg-gradient-to-l from-orange-600 via-amber-500 to-orange-600'}`}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    {ended
                        ? <Lock size={20} className="text-white shrink-0" />
                        : <Gift size={20} className="text-white shrink-0" />}
                    <div className="flex flex-col min-w-0">
                        <span className="text-white font-black text-sm sm:text-base leading-tight">
                            {ended ? '🔒 انتهت الفترة التجريبية المجانية' : `🎁 تجربة مجانية — باقي ${daysLabel}`}
                        </span>
                        <span className="text-white/85 text-[11px] sm:text-xs font-bold leading-tight">
                            {ended
                                ? 'اشترك لمواصلة الاستعمال الكامل بلا حدود'
                                : 'استمتع بكامل المزايا قبل انتهاء التجربة'}
                        </span>
                    </div>
                </div>

                {/* CTA — direct link to the Gumroad checkout */}
                <a
                    href={gumroadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-red-600 hover:bg-orange-50 min-h-[44px] active:scale-95 transition-all shadow-lg shadow-black/30"
                >
                    <Zap size={15} className="shrink-0 text-orange-500" />
                    <span className="font-black text-sm whitespace-nowrap">اشترك الآن</span>
                </a>
            </div>
        </motion.div>
    );
};
