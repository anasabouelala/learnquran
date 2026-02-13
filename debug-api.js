
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";

// Load .env.local manually
try {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log("Could not load .env.local.");
}

const apiKey = process.env.VITE_API_KEY;

if (!apiKey) {
    console.error("❌ ERROR: VITE_API_KEY is not set.");
    process.exit(1);
}

console.log(`🔑 Using API Key: ${apiKey.substring(0, 10)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`\n🔄 Testing '${modelName}'...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello?");
        const response = await result.response;
        console.log(`✅ SUCCESS: '${modelName}' is working!`);
        console.log("Response:", response.text());
    } catch (error) {
        console.error(`❌ FAILURE: '${modelName}' failed.`);
        // Clean up error message for readability
        const msg = error.message || "";
        if (msg.includes("404")) console.error("   -> 404 Not Found (Model not available for this key)");
        else console.error("   -> Error:", msg);
    }
}

async function runTests() {
    await testModel("gemini-3-flash-preview");
    await testModel("gemini-2.5-flash"); // Previously thought to be hypothetical, now confirmed by user
    await testModel("gemini-1.5-flash");
}

runTests();
