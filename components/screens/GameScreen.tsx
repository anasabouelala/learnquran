
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, LevelData, PlayerStats, QuestionType, GameMode } from '../../types';
import { generateLevel } from '../../services/geminiService';
import { saveGameSession } from '../../services/storageService'; // Added
import { GameHUD } from '../game/GameHUD';
import { EchoBridge } from '../game/EchoBridge';
import { VerseAssembler } from '../game/VerseAssembler';
import { VerseSurferGame } from '../game/VerseSurferGame';
import { QuranStackGame } from '../game/QuranStackGame';
import { HifzSurvivorGame } from '../game/HifzSurvivorGame';
import { QuranMemorizer } from '../game/QuranMemorizer';
import { QuizGame } from '../game/QuizGame';
import { GameOver } from './GameOver';
import { Loader2 } from 'lucide-react';

interface Props {
  surahName: string;
  initialVerse?: number; 
  endVerse?: number; 
  gameMode: GameMode;
  config?: any; // Extra configuration (e.g. inputMode for Learn)
  onExit: () => void;
}

const MAX_LIVES = 3;
const TIME_BUDGET = 120;

export const GameScreen: React.FC<Props> = ({ surahName, initialVerse = 1, endVerse, gameMode, config, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Progression System
  const [startVerse, setStartVerse] = useState(initialVerse);
  
  // Game State
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_BUDGET);
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);

  // Gamification State
  const [feverMode, setFeverMode] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    highScore: 0,
    streak: 0,
    maxStreak: 0,
    accuracy: 0,
    correctAnswers: 0,
    totalQuestions: 0
  });

  // Load Data
  const loadLevel = useCallback(async (verseOffset: number) => {
    setLoading(true);
    const data = await generateLevel(surahName, verseOffset, gameMode);
    setLevelData(data);
    setCurrentQuestionIdx(0);
    setLoading(false);
    setGameState(GameState.PLAYING);
    // Reset timer
    setTimeLeft(TIME_BUDGET);
    setStats(prev => ({ ...prev, totalQuestions: prev.totalQuestions + data.questions.length }));
  }, [surahName, gameMode]);

  // Initial Load
  useEffect(() => {
    loadLevel(startVerse);
  }, [loadLevel, startVerse]);

  // Timer (Only for classic/assembly, Surfer/Stack/Survivor/Learn handle their own loop/time)
  useEffect(() => {
    if (gameState !== GameState.PLAYING || gameMode === 'SURF' || gameMode === 'STACK' || gameMode === 'SURVIVOR' || gameMode === 'LEARN') return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          handleAnswer(false);
          return 5; // Penalty pause
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameMode]);

  // Handle Fever Mode
  useEffect(() => {
      if (streak >= 3) {
          setFeverMode(true);
      } else {
          setFeverMode(false);
      }
  }, [streak]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (gameState !== GameState.PLAYING) return;

    if (isCorrect) {
      // Calculate Score
      const basePoints = 200; // Higher base for this mode
      const streakBonus = streak * 30;
      const feverMultiplier = feverMode ? 2 : 1;
      const points = (basePoints + streakBonus) * feverMultiplier;

      setScore(s => s + points); 
      setStreak(s => s + 1);
      setStats(s => ({
        ...s,
        correctAnswers: s.correctAnswers + 1,
        maxStreak: Math.max(s.maxStreak, streak + 1)
      }));

      // Advance (Surfer/Stack/Survivor/Learn mode handles its own internal progression)
      if (gameMode !== 'SURF' && gameMode !== 'STACK' && gameMode !== 'SURVIVOR' && gameMode !== 'LEARN') {
        if (currentQuestionIdx < (levelData?.questions.length || 0) - 1) {
            // Check if we reached the end verse within this batch (edge case)
            const nextVerseInBatch = levelData!.questions[currentQuestionIdx + 1].verseNumber;
            if (endVerse && nextVerseInBatch > endVerse) {
                handleLevelComplete();
                return;
            }
            setCurrentQuestionIdx(prev => prev + 1);
        } else {
            handleLevelComplete();
        }
      }

    } else {
      setLives(l => l - 1);
      setStreak(0); 
      if (lives - 1 <= 0) {
        endGame(false);
      }
    }
  }, [gameState, streak, lives, currentQuestionIdx, levelData, feverMode, endVerse, gameMode]);

  const handleLevelComplete = useCallback(() => {
      setScore(s => s + 1500); // Level completion bonus
      
      // Check if we should stop because of endVerse range
      const questionsCount = levelData?.questions.length || 0;
      const nextStart = startVerse + questionsCount;

      if (endVerse && nextStart > endVerse) {
          endGame(true); // Victory - Range Completed
      } else {
          // Continue to next batch?
          endGame(true);
      }
  }, [startVerse, levelData, endVerse]);

  const endGame = (victory: boolean) => {
    setGameState(victory ? GameState.VICTORY : GameState.GAME_OVER);
    
    // Save to Persistent Storage
    const finalScore = score;
    const totalQs = stats.totalQuestions || 1;
    const finalAccuracy = victory ? 100 : Math.round((stats.correctAnswers / totalQs) * 100);
    
    saveGameSession(surahName, finalScore, finalAccuracy, victory);

    setStats(s => ({ ...s, score: score }));
  };

  const handleNextLevel = () => {
    const nextOffset = startVerse + (levelData?.questions.length || 3);
    
    if (endVerse && nextOffset > endVerse) {
        return; 
    }
    setStartVerse(nextOffset);
  };

  const handleRestart = () => {
    setScore(0);
    setLives(MAX_LIVES);
    setStreak(0);
    setTimeLeft(TIME_BUDGET);
    setStats({
      score: 0,
      highScore: 0,
      streak: 0,
      maxStreak: 0,
      accuracy: 0,
      correctAnswers: 0,
      totalQuestions: 0
    });
    loadLevel(initialVerse); 
  };

  if (loading || !levelData) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-50">
        <Loader2 className="w-16 h-16 animate-spin text-arcade-cyan mb-4" />
        <p className="font-arcade text-arcade-yellow animate-pulse">جاري إنشاء الجسر العصبي {startVerse}...</p>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
    const nextStart = startVerse + (levelData?.questions.length || 0);
    const hasMore = !endVerse || nextStart <= endVerse;

    return (
        <GameOver 
            stats={stats} 
            isVictory={gameState === GameState.VICTORY} 
            nextStartVerse={nextStart}
            onRestart={handleRestart} 
            onNextLevel={hasMore ? handleNextLevel : onExit} 
            onHome={onExit} 
        />
    );
  }

  const currentQuestion = levelData.questions[currentQuestionIdx];

  // Full screen modes
  if (gameMode === 'SURF') {
      return (
          <VerseSurferGame 
              question={currentQuestion}
              surahName={surahName}
              onGameEnd={endGame}
          />
      );
  }
  if (gameMode === 'STACK') {
      return (
          <QuranStackGame
              question={currentQuestion}
              surahName={surahName}
              onGameEnd={endGame}
          />
      );
  }
  if (gameMode === 'SURVIVOR') {
      return (
          <HifzSurvivorGame
              question={currentQuestion}
              surahName={surahName}
              onGameEnd={endGame}
          />
      );
  }
  if (gameMode === 'LEARN') {
    return (
      <QuranMemorizer 
        surahName={surahName}
        questions={levelData.questions}
        initialInputMode={config?.inputMode}
        onGameEnd={endGame}
      />
    );
  }

  return (
    <div className={`fixed inset-0 bg-slate-900 transition-colors duration-1000 ${feverMode ? 'bg-emerald-950' : 'bg-slate-900'} flex flex-col overflow-hidden`}>
       {/* Background */}
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>

       <div className="relative z-10 flex flex-col h-full w-full max-w-5xl mx-auto p-4">
           {/* Top Bar */}
           <div className="flex justify-between items-center mb-2 shrink-0">
              <button onClick={onExit} className="text-slate-400 hover:text-white font-arcade text-xs z-50 relative">خروج</button>
              <h2 className="text-white font-arcade text-xs text-center tracking-widest text-shadow-neon">
                  {surahName} // {gameMode === 'ASSEMBLY' ? 'تركيب' : (gameMode === 'QUIZ' ? 'اختبار' : 'جسر')} {startVerse + currentQuestionIdx}
              </h2>
              <div className="w-8"></div>
           </div>

           {/* HUD */}
           <div className="shrink-0 mb-4">
              <GameHUD 
                  score={score}
                  lives={lives}
                  streak={streak}
                  timeLeft={timeLeft}
                  maxTime={TIME_BUDGET}
              />
           </div>

           {/* Game Viewport */}
           <div className="flex-1 w-full relative min-h-0">
               {currentQuestion.type === QuestionType.VERSE_ASSEMBLY ? (
                   <VerseAssembler 
                      key={currentQuestion.id}
                      question={currentQuestion}
                      onAnswer={handleAnswer}
                   />
               ) : currentQuestion.type === QuestionType.VERSE_QUIZ ? (
                   <QuizGame
                      key={currentQuestion.id}
                      question={currentQuestion}
                      onAnswer={handleAnswer}
                   />
               ) : (
                   <EchoBridge 
                      key={currentQuestion.id} 
                      question={currentQuestion}
                      feverMode={feverMode}
                      onAnswer={handleAnswer}
                   />
               )}
           </div>
       </div>
    </div>
  );
};
