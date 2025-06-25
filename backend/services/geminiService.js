import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Initialize Gemini model
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  }
});

// System prompt for onboarding assistant
const SYSTEM_PROMPT = `You are a helpful onboarding assistant for a company. Your role is to help new employees get familiar with:

• Company policies and procedures
• Benefits and compensation details  
• IT setup and access requirements
• Team introductions and organizational structure
• Training schedules and resources
• Office locations and facilities
• Workplace culture and guidelines
• Professional development opportunities

Guidelines:
- Be friendly, professional, and welcoming
- Provide clear, actionable information
- Ask follow-up questions to better assist
- If you don't know something specific, direct them to HR or their manager
- Keep responses concise but helpful
- Focus on onboarding-related topics
- IMPORTANT: Always respond in the same language as the user's input. If they write in English, respond in English. If they write in German, respond in German. If they write in Spanish, respond in Spanish, etc.

Respond as if you're a knowledgeable HR assistant helping a new employee on their first day.`;

export const generateResponse = async (userMessage, conversationHistory = []) => {
  try {
    // Build conversation context
    let prompt = SYSTEM_PROMPT + '\n\nConversation:\n';
    
    // Add conversation history (last 5 messages for context)
    const recentHistory = conversationHistory.slice(-5);
    for (const msg of recentHistory) {
      prompt += `${msg.role === 'user' ? 'Employee' : 'Assistant'}: ${msg.content}\n`;
    }
    
    // Add current user message
    prompt += `Employee: ${userMessage}\nAssistant:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      content: text.trim(),
      model: 'gemini-1.5-flash'
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Fallback response
    return {
      success: false,
      content: `I apologize, but I'm having trouble connecting to our AI systems right now. Please try again in a moment, or reach out to your HR representative for immediate assistance.

In the meantime, here are some common onboarding topics I can help with:
• Company policies and procedures
• Benefits and compensation
• IT setup and access
• Team introductions
• Training schedules
• Office facilities

What specific area would you like to know more about?`,
      error: error.message,
      model: 'fallback'
    };
  }
};

export const generateStreamResponse = async (userMessage, conversationHistory = []) => {
  try {
    // Build conversation context
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
      model: 'gemini-1.5-flash'
    };
  } catch (error) {
    console.error('Gemini Streaming Error:', error);
    throw error;
  }
}; 