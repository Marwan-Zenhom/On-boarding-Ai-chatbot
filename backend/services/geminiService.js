import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { searchKnowledgeBase } from './knowledgeBaseService.js';
import { searchKnowledgeBaseKeyword } from './keywordSearchService.js';
import { AI_MODELS } from '../constants/index.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Gemini generation configuration
const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048
};

const SYSTEM_INSTRUCTION = `You are a friendly, helpful colleague at NovaTech. You're here to help new employees feel welcome and answer their questions naturally, like a friend would. You have excellent memory of the conversation and always understand context. Be warm, conversational, and supportive - never stiff or robotic.`;

// Initialize Gemini model
const model = genAI.getGenerativeModel({ 
  model: AI_MODELS.DEFAULT,
  generationConfig: GENERATION_CONFIG,
  systemInstruction: SYSTEM_INSTRUCTION
});

export const generateResponse = async (userMessage, conversationHistory = []) => {
  try {
    console.log('Generating response for:', userMessage);
    
    // Handle greetings and basic conversation (no knowledge base needed)
    const greetingPatterns = /^(hi|hello|hey|good morning|good afternoon|good evening|greetings|howdy|thanks|thank you|bye|goodbye|ok|okay|got it|understood|cool|great|awesome|nice|perfect)[\s!?.]*$/i;
    const basicQuestions = /^(how are you|what('?s| is) your name|who are you|what can you do|help|can you help me)[\s?!.]*$/i;
    
    const isGreeting = greetingPatterns.test(userMessage.trim());
    const isBasicQuestion = basicQuestions.test(userMessage.trim());
    
    if (isGreeting || isBasicQuestion) {
      console.log('💬 Handling greeting/basic conversation');
      
      // Generate contextual greeting response
      const greetingPrompt = `You're a friendly colleague at NovaTech helping a new employee. They just said: "${userMessage}"

Respond like you're chatting with a friend - be warm, natural, and brief (1-2 sentences). If they ask about you, explain you're here to help them learn about NovaTech. Keep it casual and welcoming.

Your response:`;
      
      // Retry logic for greetings too
      let text;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await model.generateContent(greetingPrompt);
          const response = await result.response;
          text = response.text();
          break;
        } catch (error) {
          if (error.status === 503 && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`⚠️ Gemini overloaded, retrying in ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
      
      return {
        success: true,
        content: text.trim(),
        model: 'gemini-2.5-flash-greeting'
      };
    }
    
    // Try semantic search first (more accurate), fallback to keyword search
    let relevantDocs = [];
    
    try {
      console.log('🔍 Using semantic search...');
      relevantDocs = await searchKnowledgeBase(userMessage, 3);
      
      // If semantic search returns no results, try keyword search
      if (relevantDocs.length === 0) {
        console.log('⚠️ Semantic search returned 0 results, trying keyword search...');
        relevantDocs = await searchKnowledgeBaseKeyword(userMessage, 3, conversationHistory);
      }
    } catch (error) {
      console.error('⚠️ Semantic search failed, using keyword search fallback:', error.message);
      relevantDocs = await searchKnowledgeBaseKeyword(userMessage, 3, conversationHistory);
    }
    
    // If no relevant documents found, refuse to answer
    if (relevantDocs.length === 0) {
      console.log('No relevant documents found in knowledge base');
      return {
        success: false,
        content: "Hmm, I don't have that information on hand. Your best bet would be to check with HR - they'll be able to help you out with that! 😊",
        model: 'knowledge-base-only'
      };
    }
    
    // Build context from knowledge base with better formatting
    let kbContext = "\n\n=== COMPANY KNOWLEDGE BASE ===\n";
    relevantDocs.forEach((doc, idx) => {
      kbContext += `\n[Source ${idx + 1}] Category: ${doc.category.toUpperCase()}\n`;
      
      // If we have metadata, format it nicely
      if (doc.metadata && Object.keys(doc.metadata).length > 0) {
        Object.entries(doc.metadata).forEach(([key, value]) => {
          if (value && value.toString().trim()) {
            kbContext += `  ${key}: ${value}\n`;
          }
        });
      } else {
        // Fallback to raw content if no metadata
        kbContext += `  ${doc.content}\n`;
      }
    });
    kbContext += "\n=== END OF KNOWLEDGE BASE ===\n";
    
    // Friendly, conversational system prompt
    const SYSTEM_PROMPT = `Hey! You're a friendly colleague at NovaTech, helping a new employee get to know the company. Here's what you know from the company records:

${kbContext}

HOW TO HELP:
- Chat naturally like you would with a friend - be warm, supportive, and conversational
- Read the conversation history to remember what you talked about earlier
- When they say "he", "she", "his", etc. - you know who they mean from earlier messages
- Answer their questions using the information above
- If you don't have the info they need: "I don't have that info on hand, but HR can definitely help you with that!"
- Keep responses clear and friendly - no need to be formal or robotic
- Match their language (if they speak German, respond in German, etc.)
- Don't mention "sources" or "knowledge base" - just answer naturally as if you know this stuff

FORMATTING YOUR RESPONSES (IMPORTANT):
- Use **bold** for important names, roles, numbers, or key info (like **Milan Nguyen**, **50 years old**, **Software Development**)
- When listing multiple items or tasks, use bullet points (- item) or numbered lists (1. item) with proper line breaks
- Add blank lines between different topics for readability
- Keep it scannable and easy to read!
- Example: "**Milan Nguyen** is **50 years old** and works in **Software Development** as a **Senior Software Engineer**. His email is **milan.nguyen@novatech.com**."

Remember: You're not a formal assistant - you're a helpful friend showing them around! Keep it natural AND well-formatted! 😊`;
    
    // Build conversation context naturally
    let prompt = SYSTEM_PROMPT + '\n\n--- CHAT HISTORY ---\n';
    
    // Include extensive history for better context (last 50 messages = ~25 exchanges)
    const recentHistory = conversationHistory.slice(-50);
    if (recentHistory.length > 0) {
      for (const msg of recentHistory) {
        prompt += `${msg.role === 'user' ? 'Them' : 'You'}: ${msg.content}\n`;
      }
    } else {
      prompt += '(Start of conversation)\n';
    }
    
    prompt += '--- END HISTORY ---\n';
    console.log(`📚 Using ${recentHistory.length} messages for context`);
    
    // Add current user message naturally
    prompt += `\nThem: ${userMessage}\n\nYou:`;
    
    // Retry logic for overloaded API
    let text;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Sending prompt to Gemini... (attempt ${attempt}/${maxRetries})`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        break; // Success, exit retry loop
      } catch (error) {
        if (error.status === 503 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⚠️ Gemini overloaded, retrying in ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Re-throw if not 503 or last attempt
        }
      }
    }
    
    console.log('Successfully generated response from knowledge base');
    
    return {
      success: true,
      content: text.trim(),
      model: 'gemini-2.5-flash-kb',
      sources: relevantDocs.length
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Fallback response
    return {
      success: false,
      content: `I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or reach out to your HR representative for immediate assistance.`,
      error: error.message,
      model: 'fallback'
    };
  }
};

export const generateStreamResponse = async (userMessage, conversationHistory = []) => {
  try {
    // Build conversation context
    const SYSTEM_PROMPT = "You are a friendly, helpful colleague at NovaTech. You're here to help new employees feel welcome and answer their questions naturally, like a friend would.";
    let prompt = SYSTEM_PROMPT + '\n\nConversation:\n';
    
    // Add conversation history (last 5 messages for context)
    const recentHistory = conversationHistory.slice(-5);
    for (const msg of recentHistory) {
      prompt += `${msg.role === 'user' ? 'Employee' : 'Assistant'}: ${msg.content}\n`;
    }
    
    // Add current user message
    prompt += `Employee: ${userMessage}\nAssistant:`;
    
    const result = await model.generateContentStream(prompt);
    
    return {
      success: true,
      stream: result.stream,
      model: 'gemini-2.5-flash'
    };
  } catch (error) {
    console.error('Gemini Streaming Error:', error);
    throw error;
  }
}; 