// Test Enhanced Verse Assembly Distractor Generation
console.log("=== Testing Enhanced Assembly Distractors ===\n");

// Mock verse data
const mockVerse = {
    numberInSurah: 2,
    text: "مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ إِلَّا تَذْكِرَةً لِمَن يَخْشَىٰ"
};

const mockOtherVerses = [
    { numberInSurah: 1, text: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ" },
    { numberInSurah: 3, text: "تَنزِيلًا مِمَّنْ خَلَقَ الْأَرْضَ وَالسَّمَاوَاتِ الْعُلَى" },
    { numberInSurah: 4, text: "الرَّحْمَٰنُ عَلَى الْعَرْشِ اسْتَوَىٰ" },
    { numberInSurah: 5, text: "لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ" }
];

const allFetched = [mockVerse, ...mockOtherVerses];

// Generate correct fragments
const words = mockVerse.text.split(' ').filter(w => w.trim().length > 0);
const numFragments = Math.min(4, Math.max(3, Math.floor(words.length / 3)));
const fragmentSize = Math.ceil(words.length / numFragments);

console.log("Original verse:", mockVerse.text);
console.log("Total words:", words.length);
console.log("Number of correct fragments:", numFragments);
console.log("Average fragment size:", fragmentSize, "words\n");

const fragments = [];

// Correct fragments
console.log("=== CORRECT FRAGMENTS ===");
for (let i = 0; i < numFragments; i++) {
    const start = i * fragmentSize;
    const end = Math.min(start + fragmentSize, words.length);
    const fragmentWords = words.slice(start, end);

    if (fragmentWords.length > 0) {
        const fragment = {
            id: `c-${i}`,
            text: fragmentWords.join(' '),
            type: 'CORRECT',
            orderIndex: i
        };
        fragments.push(fragment);
        console.log(`  ${i + 1}. [${fragmentWords.length} words] ${fragment.text}`);
    }
}

// Distractors
console.log("\n=== DISTRACTOR FRAGMENTS ===");
const distractorCount = Math.min(4, allFetched.length - 1);
const avgFragmentSize = Math.ceil(words.length / numFragments);

console.log(`Generating ${distractorCount} distractors...\n`);

const otherVerses = allFetched
    .filter(v => v.numberInSurah !== mockVerse.numberInSurah)
    .sort(() => Math.random() - 0.5)
    .slice(0, distractorCount);

otherVerses.forEach((otherVerse, idx) => {
    const otherWords = otherVerse.text.split(' ').filter(w => w.trim().length > 0);

    const distractorSize = Math.min(
        avgFragmentSize + Math.floor(Math.random() * 2 - 1),
        otherWords.length
    );

    const maxStart = Math.max(0, otherWords.length - distractorSize);
    const startPos = Math.floor(Math.random() * (maxStart + 1));

    const fragment = {
        id: `d-${idx}`,
        text: otherWords.slice(startPos, startPos + distractorSize).join(' '),
        type: 'DISTRACTOR',
        orderIndex: -1
    };

    fragments.push(fragment);
    console.log(`  ${idx + 1}. [${distractorSize} words] ${fragment.text}`);
    console.log(`     From verse ${otherVerse.numberInSurah}`);
});

// Summary
console.log("\n=== SUMMARY ===");
console.log("Total fragments for player:", fragments.length);
console.log("  - Correct:", fragments.filter(f => f.type === 'CORRECT').length);
console.log("  - Distractors:", fragments.filter(f => f.type === 'DISTRACTOR').length);
console.log("\n✓ OLD: 4 correct + 1 distractor = 5 total");
console.log(`✓ NEW: ${fragments.filter(f => f.type === 'CORRECT').length} correct + ${fragments.filter(f => f.type === 'DISTRACTOR').length} distractors = ${fragments.length} total`);
console.log("\nChallenge level: SIGNIFICANTLY INCREASED! 🎯");
