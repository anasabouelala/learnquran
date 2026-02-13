import { GlobalStats, SurahStats, UserGoal } from "../types";
import { getSurahVerseCount } from "../utils/quranData";
import { supabase } from "./supabaseClient";

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

    // Trigger cloud sync if logged in
    pushToCloud();

    return newGoal;
};

export const removeGoal = (id: string) => {
    const global = getGlobalStats();
    global.goals = global.goals.filter(g => g.id !== id);
    localStorage.setItem(KEYS.GLOBAL, JSON.stringify(global));
    pushToCloud();
};

export const completeGoal = (id: string) => {
    const global = getGlobalStats();
    const goal = global.goals.find(g => g.id === id);
    if (goal) {
        goal.isCompleted = true;
        // Bonus XP for goal completion
        global.totalXp = (global.totalXp || 0) + 500;
        localStorage.setItem(KEYS.GLOBAL, JSON.stringify(global));
        pushToCloud();
    }
};

export const saveGameSession = (
    surahName: string,
    score: number,
    accuracy: number, // 0-100
    isVictory: boolean,
    versesPlayed: number[] = []
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
        versesMastered: 0,
        masteredVersesList: []
    };

    // Calculate Stars
    let newStars: 0 | 1 | 2 | 3 = 0;
    if (accuracy >= 95) newStars = 3;
    else if (accuracy >= 80) newStars = 2;
    else if (accuracy >= 60) newStars = 1;

    currentSurah.gamesPlayed = (currentSurah.gamesPlayed || 0) + 1;
    currentSurah.lastPlayed = Date.now();
    currentSurah.highScore = Math.max(currentSurah.highScore || 0, score);
    currentSurah.stars = Math.max(currentSurah.stars || 0, newStars) as 0 | 1 | 2 | 3;

    // Mastery Logic with Verses Tracking
    const totalVerses = getSurahVerseCount(surahName);

    // Initialize list if missing
    if (!currentSurah.masteredVersesList) {
        currentSurah.masteredVersesList = [];
    }

    // If played with good accuracy, mark these verses as mastered
    if (accuracy >= 85 && versesPlayed.length > 0) {
        const set = new Set(currentSurah.masteredVersesList);
        versesPlayed.forEach(v => set.add(v));
        currentSurah.masteredVersesList = Array.from(set);
    }
    // Fallback: If no versesProvided (legacy), we rely on heuristic but cap it
    else if (accuracy >= 90 && versesPlayed.length === 0) {
        // If we don't know which verses, we can't accurately add to list.
        // We will just leave it.  The UI will eventually force users to play to get credit properly.
    }

    currentSurah.versesMastered = currentSurah.masteredVersesList.length;

    // Calculate Percentage
    if (totalVerses > 0) {
        currentSurah.masteryLevel = (currentSurah.versesMastered / totalVerses) * 100;
        // Cap at 100
        if (currentSurah.masteryLevel > 100) currentSurah.masteryLevel = 100;
    } else {
        // Fallback for unknown surahs
        if (accuracy > 80) {
            currentSurah.masteryLevel = Math.min(100, (currentSurah.masteryLevel || 0) + 5);
        }
    }

    surahs[surahName] = currentSurah;
    localStorage.setItem(KEYS.SURAHS, JSON.stringify(surahs));

    // Trigger Cloud Sync
    pushToCloud();

    return { xpGain, newLevel: global.level };
};

export const saveDiagnosticResult = (
    surahName: string,
    overallScore: number,
    startVerse?: number,
    endVerse?: number
) => {
    const versesPlayed: number[] = [];
    if (startVerse) {
        const end = endVerse || startVerse;
        for (let i = startVerse; i <= end; i++) {
            versesPlayed.push(i);
        }
    }
    return saveGameSession(surahName, overallScore * 10, overallScore, overallScore > 80, versesPlayed);
};


// --- CLOUD SYNC LOGIC ---

export const pushToCloud = async () => {
    if (!supabase) return; // Supabase not configured

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return; // Not logged in

    const user = session.user;
    const globalParams = getGlobalStats();

    // 1. Upsert Profile
    await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            total_xp: globalParams.totalXp,
            level: globalParams.level,
            streak_days: globalParams.streakDays,
            last_login_date: globalParams.lastLoginDate,
            updated_at: new Date()
        });

    // Note: Goals and Surah Stats would be synced here in a real app
    // For this MVP, we just sync the high-level profile stats to Supabase 'profiles' table.
    // Full sync requires 'surah_progress' tables etc.
};

export const syncFromCloud = async () => {
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profile && !error) {
        // Merge cloud profile into local stats
        const local = getGlobalStats();

        // We generally trust cloud stats for XP and Level if they exist
        local.totalXp = Math.max(local.totalXp, profile.total_xp || 0);
        local.level = Math.max(local.level, profile.level || 1);
        local.streakDays = Math.max(local.streakDays, profile.streak_days || 0);
        local.lastLoginDate = profile.last_login_date || local.lastLoginDate;

        localStorage.setItem(KEYS.GLOBAL, JSON.stringify(local));
    }
};