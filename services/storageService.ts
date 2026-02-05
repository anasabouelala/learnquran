
import { GlobalStats, SurahStats, UserGoal } from "../types";

const KEYS = {
  GLOBAL: 'hq_global_stats',
  SURAHS: 'hq_surah_stats'
};

const INITIAL_GLOBAL: GlobalStats = {
  totalXp: 0,
  level: 1,
  totalGamesPlayed: 0,
  streakDays: 1,
  lastLoginDate: new Date().toISOString().split('T')[0],
  achievements: [],
  goals: []
};

// Helper to calculate level based on XP
// Level 1: 0-1000, Level 2: 1000-2500, etc.
const getLevelFromXp = (xp: number) => {
    return Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
};

export const getGlobalStats = (): GlobalStats => {
  try {
    const stored = localStorage.getItem(KEYS.GLOBAL);
    if (!stored) return INITIAL_GLOBAL;
    
    const parsed = JSON.parse(stored);
    
    // Robust Merge: Ensure all fields from INITIAL_GLOBAL exist in the result
    const stats: GlobalStats = {
        ...INITIAL_GLOBAL,
        ...parsed,
        // Ensure arrays are arrays (merge might overwrite with undefined if parsed has it as undefined)
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : []
    };

    // Check Streak logic
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastLoginDate !== today) {
        const last = new Date(stats.lastLoginDate);
        const now = new Date();
        // Handle invalid date in storage
        if (isNaN(last.getTime())) {
             stats.lastLoginDate = today;
             stats.streakDays = 1;
        } else {
            const diffTime = Math.abs(now.getTime() - last.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) {
                stats.streakDays += 1;
            } else if (diffDays > 1) {
                stats.streakDays = 1;
            }
            stats.lastLoginDate = today;
        }
        localStorage.setItem(KEYS.GLOBAL, JSON.stringify(stats));
    }
    
    return stats;
  } catch (e) {
    console.error("Error loading global stats", e);
    return INITIAL_GLOBAL;
  }
};

export const getSurahStats = (): Record<string, SurahStats> => {
  try {
    const stored = localStorage.getItem(KEYS.SURAHS);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

export const addGoal = (surahName: string, targetDate?: string): UserGoal | null => {
    const global = getGlobalStats();
    
    // Check if active goal for this surah already exists
    if (global.goals.some(g => g.surahName === surahName && !g.isCompleted)) {
        return null;
    }

    const newGoal: UserGoal = {
        id: Date.now().toString(),
        surahName,
        targetDate,
        isCompleted: false,
        createdAt: Date.now()
    };
    
    global.goals.push(newGoal);
    localStorage.setItem(KEYS.GLOBAL, JSON.stringify(global));
    return newGoal;
};

export const removeGoal = (id: string) => {
    const global = getGlobalStats();
    global.goals = global.goals.filter(g => g.id !== id);
    localStorage.setItem(KEYS.GLOBAL, JSON.stringify(global));
};

export const completeGoal = (id: string) => {
    const global = getGlobalStats();
    const goal = global.goals.find(g => g.id === id);
    if (goal) {
        goal.isCompleted = true;
        // Bonus XP for goal completion
        global.totalXp = (global.totalXp || 0) + 500; 
        localStorage.setItem(KEYS.GLOBAL, JSON.stringify(global));
    }
};

export const saveGameSession = (
    surahName: string, 
    score: number, 
    accuracy: number, // 0-100
    isVictory: boolean
) => {
    const global = getGlobalStats();
    const surahs = getSurahStats();

    // 1. Update Global Stats
    const xpGain = score + (isVictory ? 500 : 100);
    global.totalXp = (global.totalXp || 0) + xpGain;
    global.totalGamesPlayed = (global.totalGamesPlayed || 0) + 1;
    global.level = getLevelFromXp(global.totalXp);
    
    // Check goals for auto-completion
    if (!global.goals) global.goals = [];
    global.goals.forEach(goal => {
        if (!goal.isCompleted && goal.surahName === surahName && accuracy >= 90) {
            goal.isCompleted = true;
            // Bonus for completing a goal naturally
            global.totalXp += 1000; 
        }
    });

    localStorage.setItem(KEYS.GLOBAL, JSON.stringify(global));

    // 2. Update Surah Stats
    const currentSurah = surahs[surahName] || {
        surahName,
        masteryLevel: 0,
        stars: 0,
        highScore: 0,
        lastPlayed: 0,
        gamesPlayed: 0,
        versesMastered: 0
    };

    // Calculate Stars
    let newStars: 0 | 1 | 2 | 3 = 0;
    if (accuracy >= 95) newStars = 3;
    else if (accuracy >= 80) newStars = 2;
    else if (accuracy >= 60) newStars = 1;

    currentSurah.gamesPlayed = (currentSurah.gamesPlayed || 0) + 1;
    currentSurah.lastPlayed = Date.now();
    currentSurah.highScore = Math.max(currentSurah.highScore || 0, score);
    currentSurah.stars = Math.max(currentSurah.stars || 0, newStars) as 0|1|2|3;
    
    // Mastery logic
    if (accuracy > 80) {
        currentSurah.masteryLevel = Math.min(100, (currentSurah.masteryLevel || 0) + 5);
    }
    
    if (newStars === 3) {
        currentSurah.masteryLevel = Math.max(currentSurah.masteryLevel || 0, 100);
    }

    surahs[surahName] = currentSurah;
    localStorage.setItem(KEYS.SURAHS, JSON.stringify(surahs));

    return { xpGain, newLevel: global.level };
};

export const saveDiagnosticResult = (
    surahName: string, 
    overallScore: number
) => {
    return saveGameSession(surahName, overallScore * 10, overallScore, overallScore > 60);
};