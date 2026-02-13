
// utils/alignment.ts

// Basic Levenshtein distance for individual word comparison
export const levenshtein = (a: string, b: string): number => {
    if (!a || !b) return (a || b).length;
    const matrix: number[][] = [];
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

export const normalizeArabic = (text: string) => {
    if (!text) return "";
    return text
        .replace(/[\u064B-\u065F]/g, "") // Remove Tashkeel
        .replace(/\u0640/g, "") // Remove Tatweel
        .replace(/[\u06D6-\u06ED]/g, "") // Remove Symbols
        .replace(/[أإآٱ]/g, "ا") // Normalize Alifs
        .replace(/ى/g, "ي") // Normalize Ya
        .replace(/ة/g, "ه") // Normalize Ta Marbuta
        .trim();
};

interface AlignmentResult {
    referenceIndex: number;
    hypothesisIndex: number;
    type: 'MATCH' | 'MISMATCH' | 'INSERTION' | 'DELETION';
    score: number;
}

export const alignSequences = (reference: string[], hypothesis: string[]): AlignmentResult[] => {
    const MATCH_SCORE = 10;
    const MISMATCH_PENALTY = -5;
    const GAP_PENALTY = -5;

    const n = reference.length;
    const m = hypothesis.length;

    // dp[i][j] stores the best score for aligning ref[0..i-1] with hyp[0..j-1]
    const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

    // Initialize base cases (gaps)
    for (let i = 0; i <= n; i++) dp[i][0] = i * GAP_PENALTY;
    for (let j = 0; j <= m; j++) dp[0][j] = j * GAP_PENALTY;

    // Fill DP table
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const refWord = normalizeArabic(reference[i - 1]);
            const hypWord = normalizeArabic(hypothesis[j - 1]);

            // Fuzzy match check
            const dist = levenshtein(refWord, hypWord);
            const maxDist = refWord.length > 4 ? 2 : 1;
            const isMatch = dist <= maxDist;

            const matchScore = isMatch ? MATCH_SCORE : MISMATCH_PENALTY;

            dp[i][j] = Math.max(
                dp[i - 1][j - 1] + matchScore, // Match/Mismatch
                dp[i - 1][j] + GAP_PENALTY,    // Deletion (Gap in Hyp)
                dp[i][j - 1] + GAP_PENALTY     // Insertion (Gap in Ref)
            );
        }
    }

    // Traceback
    const alignment: AlignmentResult[] = [];
    let i = n;
    let j = m;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0) {
            const refWord = normalizeArabic(reference[i - 1]);
            const hypWord = normalizeArabic(hypothesis[j - 1]);
            const dist = levenshtein(refWord, hypWord);
            const maxDist = refWord.length > 4 ? 2 : 1;
            const isMatch = dist <= maxDist;
            const matchScore = isMatch ? MATCH_SCORE : MISMATCH_PENALTY;

            if (dp[i][j] === dp[i - 1][j - 1] + matchScore) {
                alignment.unshift({
                    referenceIndex: i - 1,
                    hypothesisIndex: j - 1,
                    type: isMatch ? 'MATCH' : 'MISMATCH',
                    score: matchScore
                });
                i--;
                j--;
                continue;
            }
        }

        if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + GAP_PENALTY)) {
            // Deletion (Gap in Hypothesis) - User skipped a word
            alignment.unshift({
                referenceIndex: i - 1,
                hypothesisIndex: -1,
                type: 'DELETION',
                score: GAP_PENALTY
            });
            i--;
        } else {
            // Insertion (Gap in Reference) - User added an extra word
            alignment.unshift({
                referenceIndex: -1,
                hypothesisIndex: j - 1,
                type: 'INSERTION', // We likely ignore these in UI unless we want to show them
                score: GAP_PENALTY
            });
            j--;
        }
    }

    return alignment;
};
