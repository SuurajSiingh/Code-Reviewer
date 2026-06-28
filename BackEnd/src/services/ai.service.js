const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();  

// Debugging to ensure API key is loaded
console.log("GOOGLE_GEMINI_KEY:", process.env.GOOGLE_GEMINI_KEY);  

if (!process.env.GOOGLE_GEMINI_KEY) {
    throw new Error("Missing GOOGLE_GEMINI_KEY in environment variables!");
}

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `
        You are a Senior Code Reviewer (7+ years experience).
        Your job is to analyze, review, and improve code.
        - Ensure best practices, performance, security, and scalability.
        - Highlight issues and suggest improvements with examples.
        - Be direct, precise, and use simple explanations.
    `
});

// Function to generate content
async function generateContent(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response; // Fix: Extract response properly
        console.log("AI Response:", response.text()); // Debugging
        return response.text();
    } catch (error) {
        console.error("AI Service Error:", error.message);
        return "Error: Unable to generate content.";
    }
}

module.exports = generateContent;
