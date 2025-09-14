import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import apiConfig from './api-config.json';
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  files?: {
    type: string;
    name: string;
    content: string;
  }[];
}
type FeatureType = 'image' | 'research' | 'advanced-research' | null;
let currentApiKeyIndex = 0;
const SYSTEM_PROMPT = `You are a helpful AI assistant focused on supporting students and learners. Your responses should be:
1. Direct and focused on the user's query
2. Factual and accurate
3. Concise but thorough
4. Empathetic and encouraging
5. Structured with clear points when appropriate
Only mention that you are an AI assistant if specifically asked about your identity or capabilities. Otherwise, focus on providing helpful responses to the user's questions.
When handling image generation requests:
1. If the user requests an image, respond with a clear, educational description
2. Format the response as: "IMAGE_GENERATION: [detailed description]"
3. Focus on educational, study-related, or academic themes
4. Keep descriptions appropriate for a learning environment
5. Avoid any potentially sensitive topics
6. If the request seems inappropriate, suggest an educational alternative
For research and advanced research:
1. Break down complex topics into clear, understandable points
2. Provide relevant examples and analogies
3. Include key facts and data when available
4. Suggest practical applications or next steps
Remember to maintain a professional yet approachable tone, and always prioritize the user's learning needs.`;
const getNextApiKey = (tier: 'premium' | 'normal') => {
  const keys = apiConfig[tier].keys;
  const key = keys[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % keys.length;
  return key;
};
export async function getMagnoliaResponse(
  userInput: string,
  feature: FeatureType = null,
  files: { type: string; name: string; content: string }[] = []
): Promise<string> {
  try {
    const apiKey = getNextApiKey('premium');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: feature === 'image' ? "gemini-2.0-flash-exp-image-generation" : "gemini-2.0-flash" 
    });
    let prompt = userInput;
    if (feature === 'image') {
      prompt = `Generate an image of: ${userInput}. 
      Make it appropriate for a general audience.`;
    } else if (feature === 'research') {
      prompt = `Research and explain: ${userInput}`;
    } else if (feature === 'advanced-research') {
      prompt = `Provide a detailed analysis of: ${userInput}`;
    }
    if (files && files.length > 0) {
      const fileDescriptions = files.map(file => 
        `File: ${file.name} (${file.type})`
      ).join('\n');
      prompt = `${prompt}\n\nAttached files:\n${fileDescriptions}`;
    }
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });
    const response = await result.response;
    let text = response.text();
    if (feature === 'image' && text) {
      if (text.startsWith('data:image/')) {
        text = `IMAGE_DATA: ${text}`;
      } else {
        text = `IMAGE_GENERATION_ERROR: ${text}`;
      }
    } else if (userInput.toLowerCase().includes('image') || userInput.toLowerCase().includes('generate') || userInput.toLowerCase().includes('create')) {
      text = "I'm sorry, but I can only generate images when the Image Generation mode is enabled. Please click the Image Generation button to enable this feature.";
    }
    return text;
  } catch (error) {
    console.error("Error getting AI response:", error);
    throw new Error("Failed to get AI response");
  }
}