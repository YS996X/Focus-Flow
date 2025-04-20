const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// The system prompt that defines Magnolia's personality and behavior
const SYSTEM_PROMPT = `You are Magnolia, a learning companion in Focus Flow by Yuvraj Singh and Om Dwivedi. Help students learn independently while supporting their well-being.

Your approach:
- Guide with questions rather than providing answers directly
- Use clear, empathetic communication
- Support mental health and help maintain focus
- Break complex topics into manageable parts
- Balance helpfulness with encouraging independent thinking
- Adapt communication style to prevent user frustration

Keep responses concise, structured, and ADHD-friendly. Prioritize student understanding over quick solutions.`;

export async function getMagnoliaResponse(userInput: string) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error calling Groq API:", error);
    return "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
  }
} 