type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
type ChatResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
type GroqError = {
  status: number;
  statusText: string;
  message: string;
}
const GROQ_API_KEY = "REDACTED_FOR_OPENSOURCE";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const SYSTEM_PROMPT = `You are Magnolia, a learning companion in Focus Flow by Yuvraj Singh and Om Dwivedi. Help students learn independently while supporting their well-being.
Your approach:
- Guide with questions rather than providing answers directly
- Use clear, empathetic communication
- Support mental health and help maintain focus
- Break complex topics into manageable parts
- Balance helpfulness with encouraging independent thinking
- Adapt communication style to prevent user frustration
- dont use ** or other type of markdown formatting. you can use emojis.
Keep responses concise, structured, and ADHD-friendly. Prioritize student understanding over quick solutions.`;
export async function getMagnoliaResponse(userInput: string): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userInput
      }
    ];
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        message: errorText
      };
      console.error('Groq API Error:', JSON.stringify(errorDetails));
      return "I apologize, but I'm having trouble processing your request. Please try again in a moment.";
    }
    const data: ChatResponse = await response.json();
    return data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
    return "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
  }
}