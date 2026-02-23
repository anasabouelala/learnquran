import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request, response) {
    // Enable CORS
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ error: 'Server Configuration Error: API Key missing' });
    }

    try {
        const { modelName, systemInstruction, prompt, modelParams, jsonMode } = request.body;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName || "gemini-1.5-flash",
            systemInstruction: systemInstruction,
            generationConfig: {
                responseMimeType: jsonMode ? "application/json" : "text/plain",
                ...modelParams
            }
        });

        // The prompt can be a string or an array of parts (for audio/images)
        // If it sends { inlineData: ... }, it works with the SDK directly
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return response.status(200).json({ text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return response.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
