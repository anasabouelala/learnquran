
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { authService } from '../../services/authService';

interface Props {
    initialKey?: string; // pre-filled from URL param
    onSuccess: () => void;
    onClose: () => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export const LicenseActivation: React.FC<Props> = ({ initialKey = '', onSuccess, onClose }) => {
    const [key, setKey] = useState(initialKey);
    const [status, setStatus] = useState<Status>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    // Auto-verify if the key came directly from the URL (Gumroad redirect)
    useEffect(() => {
        if (initialKey) {
            handleActivate(initialKey);
        }
    }, []);

    const handleActivate = async (licenseKey = key) => {
        if (!licenseKey.trim()) return;
        setStatus('loading');
        setErrorMsg('');

        const result = await authService.activateLicense(licenseKey.trim());

        if (result.success) {
            setStatus('success');
            if (result.premium_expires_at) {
                const d = new Date(result.premium_expires_at);
                setExpiresAt(d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }));
            }
            setTimeout(() => { onSuccess(); }, 2200);
        } else {
            setStatus('error');
            setErrorMsg(result.error || 'مفتاح الترخيص غير صحيح');
        }
    };

    return (
        <AnimatePresence>
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999]"
                    onClick={status !== 'loading' ? onClose : undefined}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                    className="fixed inset-0 flex items-center justify-center z-[1000] p-4"
                    dir="rtl"
                >
                    <div className="relative bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl font-cairo overflow-hidden">
                        {/* Glow */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Close */}
                        {status !== 'loading' && (
                            <button onClick={onClose} className="absolute top-5 left-5 text-slate-500 hover:text-white transition-colors">
                                <X size={22} />
                            </button>
                        )}

                        {/* ── SUCCESS ── */}
                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center gap-4"
                            >
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="text-emerald-400 w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-white">مرحباً بك في النسخة الكاملة! 🎉</h2>
                                <p className="text-slate-400 text-sm">
                                    تم تفعيل اشتراكك بنجاح.
                                    {expiresAt && <> اشتراكك ساري حتى <span className="text-white font-bold">{expiresAt}</span>.</>}
                                </p>
                                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-2">
                                    <motion.div
                                        className="h-full bg-emerald-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 2 }}
                                    />
                                </div>
                                <p className="text-slate-500 text-xs">جاري تحويلك إلى لوحة التحكم...</p>
                            </motion.div>
                        )}

                        {/* ── IDLE / LOADING / ERROR ── */}
                        {status !== 'success' && (
                            <>
                                <div className="flex justify-center mb-5">
                                    <div className="bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center">
                                        <KeyRound className="text-indigo-400 w-7 h-7" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-white text-center mb-1">تفعيل الاشتراك</h2>
                                <p className="text-slate-400 text-sm text-center mb-6">
                                    أدخل مفتاح الترخيص الذي وصلك عبر البريد الإلكتروني بعد الشراء.
                                </p>

                                {/* Key input */}
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => { setKey(e.target.value); setStatus('idle'); }}
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    dir="ltr"
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 text-white placeholder-slate-600
                    rounded-2xl px-5 py-4 text-base font-mono tracking-widest outline-none transition mb-4 text-center"
                                />

                                {/* Error */}
                                {status === 'error' && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                                        <XCircle size={16} className="shrink-0" />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                {/* Activate button */}
                                <button
                                    onClick={() => handleActivate()}
                                    disabled={status === 'loading' || !key.trim()}
                                    className="w-full flex items-center justify-center gap-2
                    bg-gradient-to-r from-indigo-600 to-blue-600
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-white font-black text-lg py-4 rounded-2xl
                    hover:scale-[1.02] active:scale-95 transition-all
                    shadow-[0_10px_40px_rgba(79,70,229,0.35)]"
                                >
                                    {status === 'loading'
                                        ? <><Loader2 size={20} className="animate-spin" /> جاري التحقق...</>
                                        : 'تفعيل الاشتراك ←'
                                    }
                                </button>
                                <p className="text-slate-600 text-xs text-center mt-3">
                                    لم تتلقَّ المفتاح؟ تحقق من بريدك الإلكتروني أو تواصل معنا.
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    );
};
