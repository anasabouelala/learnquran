// Quick Test Script to Debug the Issue
const removeTashkeel = (text) => text.replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/g, "");

// Test Case: Surah Taha, Verse 1
const verseText = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ طه";

console.log("Original Text:", verseText);
console.log("Without Tashkeel:", removeTashkeel(verseText));

const plain = removeTashkeel(verseText);
const START_BASMALAH_PLAIN = "بسم ٱلله"; // FIXED: Uses Alif Wasla (ٱ)

if (plain.startsWith(START_BASMALAH_PLAIN)) {
    console.log("✓ Basmalah detected!");
    const words = verseText.split(' ');
    console.log("Total words:", words.length);
    console.log("Words:", words);

    if (words.length > 4) {
        const result = words.slice(4).join(' ');
        console.log("After removing first 4 words:", result);
    } else {
        console.log("ERROR: Not enough words to remove!");
    }
} else {
    console.log("✗ Basmalah NOT detected");
    console.log("Expected start:", START_BASMALAH_PLAIN);
    console.log("Actual start:", plain.substring(0, 20));
}

// Test Bridge Game Logic
console.log("\n--- Testing Bridge Game Logic ---");
const verses = [
    { numberInSurah: 1, text: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ طه" },
    { numberInSurah: 2, text: "مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ" },
    { numberInSurah: 3, text: "إِلَّا تَذْكِرَةً لِمَن يَخْشَىٰ" }
];

const verse = verses[0];
const nextVerse = verses[1];

if (nextVerse) {
    const nextWords = nextVerse.text.split(' ');
    const correctAnswer = nextWords.slice(0, 2).join(' ');
    console.log("Next verse first 2 words:", correctAnswer);

    // Generate distractors
    let rawDistractors = verses
        .filter(v => v.numberInSurah !== verse.numberInSurah && v.numberInSurah !== nextVerse.numberInSurah)
        .map(v => v.text.split(' ').slice(0, 2).join(' '))
        .filter(s => s && s.trim().length > 2);

    console.log("Raw distractors:", rawDistractors);

    const distractors = rawDistractors.slice(0, 2);

    if (distractors.length < 2) {
        console.log("WARNING: Not enough distractors, adding fallbacks");
        distractors.push("وَٱللَّهُ عَلِيمٌ");
        distractors.push("إِنَّ ٱللَّهَ");
    }

    const finalSet = new Set([correctAnswer, ...distractors]);
    console.log("Final options:", Array.from(finalSet));
}
