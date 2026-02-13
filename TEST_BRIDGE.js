// Test the new robust Bridge game logic
const fallbackPool = [
    "وَٱللَّهُ عَلِيمٌ", "إِنَّ ٱللَّهَ", "قَالَ رَبِّ", "يَٰٓأَيُّهَا ٱلَّذِينَ",
    "وَمَا كَانَ", "فَلَمَّا رَأَىٰ", "وَقَالَ ٱلَّذِينَ", "إِنَّمَا يَخۡشَى",
    "قُلۡ هُوَ", "ٱلۡحَمۡدُ لِلَّهِ", "وَلَقَدۡ ءَاتَيۡنَا", "كَذَٰلِكَ نَقُصُّ"
];

// Simulate different scenarios
console.log("=== SCENARIO 1: Only 2 verses (worst case) ===");
const scenario1 = [
    { numberInSurah: 1, text: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ طه" },
    { numberInSurah: 2, text: "مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ" }
];

const verse = scenario1[0];
const nextVerse = scenario1[1];
const nextWords = nextVerse.text.split(' ').filter(w => w.trim().length > 0);
const correctAnswer = nextWords.slice(0, 2).join(' ');

console.log("Correct answer:", correctAnswer);

let rawDistractors = scenario1
    .filter(v => v.numberInSurah !== verse.numberInSurah && v.numberInSurah !== nextVerse.numberInSurah)
    .map(v => {
        const vWords = v.text.split(' ').filter(w => w.trim().length > 0);
        return vWords.length >= 2 ? vWords.slice(0, 2).join(' ') : null;
    })
    .filter(s => s && s.trim().length > 2);

console.log("Verse distractors found:", rawDistractors.length);

const shuffledDistractors = rawDistractors.sort(() => Math.random() - 0.5);
const shuffledFallbacks = [...fallbackPool].sort(() => Math.random() - 0.5);
const combinedPool = [...shuffledDistractors, ...shuffledFallbacks];

const distractors = [];
for (const option of combinedPool) {
    if (option !== correctAnswer && !distractors.includes(option)) {
        distractors.push(option);
        if (distractors.length === 2) break;
    }
}

const allOptions = new Set([correctAnswer, ...distractors]);
let optionsArray = Array.from(allOptions);

let fallbackIndex = 0;
while (optionsArray.length < 3 && fallbackIndex < shuffledFallbacks.length) {
    if (!optionsArray.includes(shuffledFallbacks[fallbackIndex])) {
        optionsArray.push(shuffledFallbacks[fallbackIndex]);
    }
    fallbackIndex++;
}

optionsArray = optionsArray.slice(0, 3);

console.log("Final options (3):", optionsArray);
console.log("All are valid Quranic text:", optionsArray.every(opt => opt && opt.trim().length > 0));
console.log("All are unique:", optionsArray.length === new Set(optionsArray).size);
console.log("Contains correct answer:", optionsArray.includes(correctAnswer));

console.log("\n=== SCENARIO 2: Many verses ===");
const scenario2 = [
    { numberInSurah: 1, text: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ طه" },
    { numberInSurah: 2, text: "مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ" },
    { numberInSurah: 3, text: "إِلَّا تَذْكِرَةً لِمَن يَخْشَىٰ" },
    { numberInSurah: 4, text: "تَنزِيلًا مِمَّنْ خَلَقَ الْأَرْضَ" },
    { numberInSurah: 5, text: "الرَّحْمَٰنُ عَلَى الْعَرْشِ اسْتَوَىٰ" }
];

const verse2 = scenario2[0];
const nextVerse2 = scenario2[1];
const nextWords2 = nextVerse2.text.split(' ').filter(w => w.trim().length > 0);
const correctAnswer2 = nextWords2.slice(0, 2).join(' ');

let rawDistractors2 = scenario2
    .filter(v => v.numberInSurah !== verse2.numberInSurah && v.numberInSurah !== nextVerse2.numberInSurah)
    .map(v => {
        const vWords = v.text.split(' ').filter(w => w.trim().length > 0);
        return vWords.length >= 2 ? vWords.slice(0, 2).join(' ') : null;
    })
    .filter(s => s && s.trim().length > 2);

console.log("Verse distractors found:", rawDistractors2.length);
console.log("Sample distractors:", rawDistractors2.slice(0, 3));
