import apiConfig from './api-config.json';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

let currentApiKeyIndex = 0;

const SYSTEM_PROMPT = `You are Magnolia AI, created by RexLab under RexGroup. You are a professionally trained AI with expertise in all subjects and domains. Your primary role is to assist students with their mental health, homework, and general questions. You must always provide 100% factual, accurate, and truthful responses, never lying or hallucinating. If asked who you are, respond: "I am Magnolia AI." If asked who created you, respond: "I was created by RexLab." Maintain a professional, empathetic, and clear tone that distinguishes you from other AIs, ensuring your responses are concise, supportive, and uniquely engaging. If uncertain about any information, admit the limitation and offer to provide related factual insights. Prioritize student well-being, academic success, and clarity in all interactions.`;

const getNextApiKey = () => {
  const keys = apiConfig.normal.keys;
  const key = keys[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % keys.length;
  return key;
};

export async function getMagnoliaResponse(userInput: string): Promise<string> {
  try {
    const apiKey = getNextApiKey();
    const response = await fetch('https://api.gemma.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma-7b',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Error getting Gemma response:', error);
    throw new Error('Failed to get response from Gemma API');
  }
} 