// Test script to verify which Gemini model works
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBgRZQkzSTVU5PiHq3yKcPD6V-Fp5UI9cw";

async function testModel(modelName: string) {
    console.log(`\n=== Testing ${modelName} ===`);
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `Analyze this Quran text: "بسم الله الرحمن الرحيم"
        Give a score 0-100 and output JSON only:
        {"overallScore": number, "diagnosis": "summary in Arabic"}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ SUCCESS!");
        console.log("Response:", text.substring(0, 200));
        return true;
    } catch (e: any) {
        console.log("❌ FAILED:", e.message);
        return false;
    }
}

async function runTests() {
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "models/gemini-1.5-flash",
        "models/gemini-1.5-pro"
    ];

    for (const model of models) {
        await testModel(model);
    }
}

runTests();
