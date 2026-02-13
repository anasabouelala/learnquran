// Test Complete Verse Bridge Implementation
console.log("=== Testing Complete Verse Bridge Data Generation ===\n");

// Simulate data structure
const mockVerse = {
    numberInSurah: 1,
    text: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ طه"
};

const mockNextVerse = {
    numberInSurah: 2,
    text: "مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ"
};

const mockAllVerses = [
    mockVerse,
    mockNextVerse,
    { numberInSurah: 3, text: "إِلَّا تَذْكِرَةً لِمَن يَخْشَىٰ" },
    { numberInSurah: 4, text: "تَنزِيلًا مِمَّنْ خَلَقَ الْأَرْضَ" },
    { numberInSurah: 5, text: "مَا لَكُمْ مِنْ إِلَٰهٍ غَيْرُهُ" } // Another verse starting with "مَا"
];

const nextWords = mockNextVerse.text.split(' ').filter(w => w.trim().length > 0);
const firstWord = nextWords[0];
const fullNextVerse = mockNextVerse.text;

console.log("Current verse:", mockVerse.text);
console.log("Next verse:", fullNextVerse);
console.log("First word:", firstWord);
console.log();

// STEP 1: Just the word
console.log("✓ STEP 1 (Typing): User types:", firstWord);
console.log();

// STEP 2: Word distractors
console.log("=== STEP 2: Word Distractors (3 single words) ===");
const wordPool = mockAllVerses
    .filter(v => v.numberInSurah !== mockNextVerse.numberInSurah)
    .map(v => {
        const words = v.text.split(' ').filter(w => w.trim().length > 0);
        return words[0];
    })
    .filter(w => w && w !== firstWord);

let wordDistractors = Array.from(new Set(wordPool))
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

const fallbackWords = ["قَالَ", "وَمَا", "إِنَّ", "فَلَمَّا"];
while (wordDistractors.length < 2) {
    wordDistractors.push(fallbackWords[wordDistractors.length]);
}

const wordOptions = [firstWord, ...wordDistractors].sort(() => Math.random() - 0.5);
console.log("Word options shown:", wordOptions);
console.log("✓ Correct word:", firstWord);
console.log("✓ Total options:", wordOptions.length);
console.log("✓ All different:", wordOptions.length === new Set(wordOptions).size);
console.log();

// STEP 3: Full verse options (all starting with same word)
console.log("=== STEP 3: Full Verse Options (all start with same word) ===");
const sameStartVerses = mockAllVerses
    .filter(v => {
        const words = v.text.split(' ').filter(w => w.trim().length > 0);
        return words[0] === firstWord && v.numberInSurah !== mockNextVerse.numberInSurah;
    })
    .map(v => v.text)
    .slice(0, 2);

let verseOptions = sameStartVerses;

// Fallback if needed
const fallbackVersePool = [
    `${firstWord} هُوَ ٱللَّهُ ٱلۡعَلِيمُ ٱلۡحَكِيمُ`,
    `${firstWord} رَبُّكُمۡ أَعۡلَمُ بِمَا فِي نُفُوسِكُمۡ`
];

while (verseOptions.length < 2) {
    verseOptions.push(fallbackVersePool[verseOptions.length]);
}

const allVerseOptions = [fullNextVerse, ...verseOptions.slice(0, 2)]
    .sort(() => Math.random() - 0.5);

console.log("Verse options:");
allVerseOptions.forEach((v, i) => {
    const isCorrect = v === fullNextVerse;
    const startsCorrectly = v.startsWith(firstWord);
    console.log(`  ${i + 1}. ${v.substring(0, 40)}...`);
    console.log(`     ${isCorrect ? '✓ CORRECT' : '✗ Wrong'} | Starts with "${firstWord}": ${startsCorrectly ? '✓' : '✗'}`);
});

console.log();
console.log("✓ Total verse options:", allVerseOptions.length);
console.log("✓ All start with same word:", allVerseOptions.every(v => v.startsWith(firstWord)));
console.log("✓ Contains correct answer:", allVerseOptions.includes(fullNextVerse));
console.log();

// Final Structure
console.log("=== Final Question Data Structure ===");
const question = {
    nextVerseFirstWord: firstWord,
    wordDistractors: wordDistractors,
    correctAnswer: fullNextVerse,
    options: allVerseOptions
};

console.log(JSON.stringify(question, null, 2));
