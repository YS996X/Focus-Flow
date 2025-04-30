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

type FeatureType = 'research' | 'advanced-research' | null;

let currentApiKeyIndex = 0;

const SYSTEM_PROMPT = `You are a helpful AI assistant focused on providing direct, factual information from sources. Your responses should be:

1. Direct and focused on the user's query
2. Based on the provided source information
3. Present the information as-is from the source
4. Do not add interpretations or perspectives
5. If Wikipedia is found in the sources, prioritize using that information

Only mention that you are an AI assistant if specifically asked about your identity or capabilities. Otherwise, focus on providing direct answers based on the source information.`;

const getNextApiKey = (tier: 'premium' | 'normal') => {
  const keys = apiConfig[tier].keys;
  const key = keys[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % keys.length;
  return key;
};

async function performSearch(query: string): Promise<string> {
  try {
    const response = await fetch('https://api.scraperx.com/api/v1/google/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '43b9bf6f09e6c5bb2505940a412a1fb3e5a5dce9303659663433357b0eba8ea1'
      },
      body: JSON.stringify({
        country: 'us',
        keyword: query,
        language: 'en',
        limit: 5,
        page: 1
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || typeof data !== 'object' || !data.data) {
      throw new Error('Invalid API response format');
    }

    // Find Wikipedia result if available
    const wikiResult = data.data.find((result: any) => 
      result.url && result.url.includes('wikipedia.org')
    );

    // Use Wikipedia if found, otherwise use the first result
    const sourceResult = wikiResult || data.data[0];
    
    if (!sourceResult) {
      throw new Error('No search results found');
    }

    // Scrape the content from the source
    const scrapeResponse = await fetch('https://api.scraperx.com/api/v1/web/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '43b9bf6f09e6c5bb2505940a412a1fb3e5a5dce9303659663433357b0eba8ea1'
      },
      body: JSON.stringify({
        url: sourceResult.url,
        format: 'markdown',
        enablejs: true
      })
    });

    if (!scrapeResponse.ok) {
      throw new Error(`HTTP error! status: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeData || typeof scrapeData !== 'object') {
      throw new Error('Invalid scraping response format');
    }

    return scrapeData.data || scrapeData.content || scrapeData.text || 'No content found';
  } catch (error) {
    console.error('Search error:', error);
    return 'Unable to retrieve information. Please try again or ask a different question.';
  }
}

export async function getMagnoliaResponse(
  userInput: string,
  feature: FeatureType = null,
  files: { type: string; name: string; content: string }[] = []
): Promise<string> {
  try {
    const apiKey = getNextApiKey('premium');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // First, get a search query from the AI
    let searchQuery = userInput;
    if (feature === 'research' || feature === 'advanced-research') {
      const searchPrompt = `Convert this question into an effective Google search query: "${userInput}"`;
      const searchResult = await model.generateContent(searchPrompt);
      searchQuery = searchResult.response.text();
    }

    // Perform the search and get content
    let sourceContent = '';
    if (feature === 'research' || feature === 'advanced-research') {
      try {
        sourceContent = await performSearch(searchQuery);
      } catch (error) {
        console.error('Search failed:', error);
        sourceContent = 'No source information available.';
      }
    }

    // Construct the final prompt
    let prompt = userInput;
    if (feature === 'research') {
      prompt = `Based on this source information: ${sourceContent}\n\nProvide a direct answer to: ${userInput}`;
    } else if (feature === 'advanced-research') {
      prompt = `Based on this source information: ${sourceContent}\n\nProvide a detailed answer to: ${userInput}`;
    }

    // Handle file attachments
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
    return response.text();
  } catch (error) {
    console.error("Error getting AI response:", error);
    throw new Error("Failed to get AI response");
  }
} 