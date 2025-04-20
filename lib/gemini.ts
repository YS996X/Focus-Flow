import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyBxsFPseaFruknfeZ9WgkWKLaUOd6s8uyY";

// Create a client with the API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// The system prompt that defines Magnolia's personality and behavior
const SYSTEM_PROMPT = `You are Magnolia, an AI assistant within Focus Flow created by Yuvraj Singh and Om Dwivedi. Your purpose is to help students with their studies while promoting independent learning and well-being.

You must:
2. Use guiding questions to help students think
3. Be empathetic and patient
4. Support mental health and focus
5. Break down complex tasks
6. Stay on topic and maintain academic focus
7- make sure the other rules dont tend to frustrate the user

Remember to:
- Be calm and encouraging
- Use clear, concise language
- Support ADHD-friendly learning
- Prioritize student understanding over quick answers`;

export async function getMagnoliaResponse(userInput: string) {
  try {
    // Get the model - using Gemini 1.5 Flash-8B
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    // Start a chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "I am now initialized as Magnolia, the Focus Flow AI assistant. I'm here to help students learn effectively while maintaining their well-being. How can I assist you today?" }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Send the message and get the response
    const result = await chat.sendMessage([{ text: userInput }]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
  }
} 