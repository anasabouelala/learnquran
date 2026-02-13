export interface Word {
    id: string;
    text: string;
    isHidden: boolean;
    isPinned: boolean;
    userInput: string;
    isCorrect: boolean;
    isError: boolean;
}

export interface VerseData {
    verseNumber: number;
    words: Word[];
}

// Levenshtein distance for fuzzy matching
export const levenshtein = (a: string, b: string): number => {
    if (!a || !b) return (a || b).length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export const normalizeArabic = (text: string): string => {
    return text
        .replace(/[^\u0600-\u06FF\s]/g, "") // Remove non-Arabic chars (except space)
        .replace(/[\u064B-\u065F]/g, "") // Remove Tashkeel
        .replace(/\u0640/g, "") // Remove Tatweel
        .replace(/[\u06D6-\u06ED]/g, "") // Remove Symbols
        .replace(/[أإآٱ]/g, "ا") // Normalize Alifs
        .replace(/ى/g, "ي") // Normalize Ya
        .replace(/ة/g, "ه") // Normalize Ta Marbuta
        .trim();
};

export const calculateGlobalAlignment = (verses: VerseData[], spokenWords: string[]): VerseData[] => {
    // Create deep copy
    const newVerses = verses.map(v => ({ ...v, words: v.words.map(w => ({ ...w })) }));

    // Flatten target words for alignment
    const targetFlat: { word: Word, verseIdx: number, wordIdx: number }[] = [];
    newVerses.forEach((v, vIdx) => {
        v.words.forEach((w, wIdx) => {
            targetFlat.push({ word: w, verseIdx: vIdx, wordIdx: wIdx });
        });
    });

    const n = targetFlat.length;
    const m = spokenWords.length;

    // DP Matrix for Alignment Score
    const score: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
    const path: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
    // Path: 1=Diagnol (Match/Mismatch), 2=Up (Gap in Spoken/Skipped Target), 3=Left (Extra Spoken)

    // Initialization: Penalize gaps
    for (let i = 0; i <= n; i++) score[i][0] = i * -2;
    for (let j = 0; j <= m; j++) score[0][j] = j * -2;

    // Fill DP Table
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const tNorm = normalizeArabic(targetFlat[i - 1].word.text);
            const sNorm = normalizeArabic(spokenWords[j - 1]);

            const dist = levenshtein(sNorm, tNorm);
            const maxDist = tNorm.length > 5 ? 2 : 1;
            const isMatch = (sNorm === tNorm || dist <= maxDist);

            const matchScore = isMatch ? 10 : -3;
            const gapScore = -2;

            const diag = score[i - 1][j - 1] + matchScore;
            const up = score[i - 1][j] + gapScore;
            const left = score[i][j - 1] + gapScore;

            if (diag >= up && diag >= left) {
                score[i][j] = diag;
                path[i][j] = 1;
            } else if (up >= left) {
                score[i][j] = up; // Gap in Spoken (Target skipped)
                path[i][j] = 2;
            } else {
                score[i][j] = left; // Gap in Target (Extra spoken)
                path[i][j] = 3;
            }
        }
    }

    // Backtrack to find alignment
    let i = n;
    let j = m;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && path[i][j] === 1) {
            // Aligned: Target[i-1] <-> Spoken[j-1]
            const targetObj = targetFlat[i - 1];
            const spokenWord = spokenWords[j - 1];

            if (targetObj.word.isHidden && !targetObj.word.isPinned) {
                const tNorm = normalizeArabic(targetObj.word.text);
                const sNorm = normalizeArabic(spokenWord);
                const dist = levenshtein(sNorm, tNorm);
                const maxDist = tNorm.length > 5 ? 2 : 1;

                if (sNorm === tNorm || dist <= maxDist) {
                    targetObj.word.isCorrect = true;
                    targetObj.word.userInput = targetObj.word.text; // Show correct word
                    targetObj.word.isError = false;
                } else {
                    // Mismatch in global alignment: User said WRONG word
                    targetObj.word.isCorrect = false;
                    targetObj.word.userInput = spokenWord;
                    targetObj.word.isError = true;
                }
            }
            i--; j--;
        } else if (i > 0 && (path[i][j] === 2 || j === 0)) {
            // Gap in Spoken (Target word [i-1] skipped)
            const targetObj = targetFlat[i - 1];
            if (targetObj.word.isHidden && !targetObj.word.isPinned) {
                // Reset if it was previously filled but now alignment says skipped
                targetObj.word.userInput = "";
                targetObj.word.isCorrect = false;
                targetObj.word.isError = false;
            }
            i--;
        } else {
            // Extra spoken word
            j--;
        }
    }

    return newVerses;
};
