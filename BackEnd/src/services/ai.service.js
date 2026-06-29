const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

console.log("GOOGLE_GEMINI_KEY:", process.env.GOOGLE_GEMINI_KEY);

if (!process.env.GOOGLE_GEMINI_KEY) {
    throw new Error("Missing GOOGLE_GEMINI_KEY in environment variables!");
}

const ai = new GoogleGenAI({ 
    apiKey: process.env.GOOGLE_GEMINI_KEY 
});

async function generateContent(prompt) {
    try {
        const response = await ai.models.generateContent({
            // 👇 Updated to the current active model
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        console.log("AI Response:", response.text);
        return response.text;
    } catch (error) {
        console.error("AI Service Error:", error.message);
        return "Error: Unable to generate content.";
    }
}

module.exports = generateContent;