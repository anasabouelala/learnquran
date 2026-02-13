import React from 'react';
import { PlayerStats } from '../../types';
import { ArcadeButton } from '../ui/ArcadeButton';
import { RotateCcw, Home, ArrowLeft } from 'lucide-react'; // Changed ArrowRight to ArrowLeft for RTL
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface Props {
  stats: PlayerStats;
  isVictory: boolean;
  nextStartVerse: number;
  onRestart: () => void;
  onNextLevel: () => void;
  onHome: () => void;
}

export const GameOver: React.FC<Props> = ({ stats, isVictory, nextStartVerse, onRestart, onNextLevel, onHome }) => {
  const chartData = [
    { name: 'صحيح', value: stats.correctAnswers, color: '#22c55e' },
    { name: 'خطأ', value: stats.totalQuestions - stats.correctAnswers, color: '#ef4444' },
    { name: 'تتابع', value: stats.maxStreak, color: '#eab308' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className={`absolute inset-0 ${isVictory ? 'bg-indigo-900' : 'bg-slate-900'} z-0`}>
        <div className={`absolute inset-0 bg-stardust opacity-20`}></div>
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-slate-800/90 border-4 border-slate-600 rounded-3xl p-8 max-w-2xl w-full shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 animate-float">{isVictory ? '🌟' : '💪'}</div>
          <h2 className={`text-3xl md:text-4xl font-arcade mb-2 ${isVictory ? 'text-arcade-yellow' : 'text-slate-300'}`}>
            {isVictory ? 'تم اجتياز القطاع!' : 'استمر في المحاولة!'}
          </h2>
          <p className="text-slate-400 font-arcade text-sm">
            {isVictory ? `جاهز للآيات ${nextStartVerse}+` : 'كل محاولة تقربك من الإتقان ✨'}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 flex flex-col items-center w-full">
            <span className="text-arcade-cyan font-arcade text-[12px] mb-2">مجموع النقاط</span>
            <span className="text-4xl font-arcade text-white drop-shadow-lg">{stats.score}</span>
          </div>
        </div>

        {/* Stats Chart */}
        <div className="h-40 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fill: 'white', fontFamily: 'Changa', fontSize: 14, textAnchor: 'end' }}
                orientation="right"
              />
              <Bar dataKey="value" barSize={15} radius={[4, 0, 0, 4]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3">
          {isVictory && (
            <ArcadeButton onClick={onNextLevel} variant="success" size="lg" className="flex items-center justify-center gap-2 animate-bounce-short">
              الآيات التالية <ArrowLeft className="w-5 h-5" />
            </ArcadeButton>
          )}

          <div className="grid grid-cols-2 gap-3">
            <ArcadeButton onClick={onRestart} variant="primary" className="flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> إعادة
            </ArcadeButton>
            <ArcadeButton onClick={onHome} variant="secondary" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> قائمة الألعاب
            </ArcadeButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
