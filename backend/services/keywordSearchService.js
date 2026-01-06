import { supabaseAdmin } from '../config/database.js';

/**
 * Fast keyword-based search with context awareness
 * Searches through content using PostgreSQL full-text search
 */
export async function searchKnowledgeBaseKeyword(query, limit = 5, conversationContext = []) {
  try {
    console.log(`🔍 Keyword searching for: "${query}"`);
    
    // Extract ALL important entities from recent conversation history
    const contextEntities = [];
    const importantKeywords = [];
    
    if (conversationContext && conversationContext.length > 0) {
      // Look at last 20 messages for extended context awareness
      const recentMessages = conversationContext.slice(-20);
      recentMessages.forEach(msg => {
        if (msg.content) {
          // Extract capitalized words (names, companies, departments)
          const nameMatches = msg.content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
          if (nameMatches) {
            contextEntities.push(...nameMatches);
          }
          
          // Extract important domain words (not stop words)
          const words = msg.content.toLowerCase().match(/\b\w{4,}\b/g);
          if (words) {
            importantKeywords.push(...words);
          }
        }
      });
    }
    
    // Remove duplicates from context
    const uniqueEntities = [...new Set(contextEntities)];
    const uniqueKeywords = [...new Set(importantKeywords)];
    
    // Extract keywords from current query
    const stopWords = ['what', 'is', 'the', 'a', 'an', 'are', 'who', 'where', 'when', 'how', 'does', 'do', 'tell', 'me', 'about', 'can', 'you', 'for', 'with', 'from', 'that', 'this'];
    let keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // ALWAYS add context for pronouns or short queries (likely follow-ups)
    const hasPronouns = /\b(he|she|his|her|their|they|it|him)\b/i.test(query);
    const isShortQuery = keywords.length <= 2;
    
    if ((hasPronouns || isShortQuery) && uniqueEntities.length > 0) {
      console.log(`💡 Context-aware search - adding entities: ${uniqueEntities.slice(0, 2).join(', ')}`);
      // Add the most recent entities (names)
      uniqueEntities.slice(0, 2).forEach(entity => {
        const entityWords = entity.toLowerCase().split(/\s+/);
        keywords.push(...entityWords);
      });
      
      // Also add relevant keywords from context that match query intent
      uniqueKeywords.slice(-5).forEach(word => {
        if (word.length > 4 && !keywords.includes(word)) {
          keywords.push(word);
        }
      });
    }
    
    // Remove duplicates
    keywords = [...new Set(keywords)];
    
    if (keywords.length === 0) {
      console.log('⚠️ No meaningful keywords found');
      return [];
    }
    
    console.log(`📝 Keywords: ${keywords.join(', ')}`);
    
    // Build search pattern for PostgreSQL ILIKE
    // Use supabaseAdmin to bypass RLS (knowledge base is internal app data)
    let queryBuilder = supabaseAdmin
      .from('knowledge_base')
      .select('id, category, content, metadata');
    
    // Search for ANY of the keywords
    const orConditions = keywords.map(keyword => `content.ilike.%${keyword}%`).join(',');
    
    const { data, error } = await queryBuilder
      .or(orConditions)
      .limit(limit * 2); // Get more to rank them
    
    if (error) {
      console.error('Search error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No results found');
      return [];
    }
    
    // Score results based on keyword matches
    const scoredResults = data.map(record => {
      const contentLower = record.content.toLowerCase();
      let score = 0;
      
      keywords.forEach(keyword => {
        // Count occurrences of each keyword
        const regex = new RegExp(keyword, 'gi');
        const matches = (contentLower.match(regex) || []).length;
        score += matches;
      });
      
      return {
        ...record,
        similarity: Math.min(score / (keywords.length * 2), 1.0) // Normalize to 0-1
      };
    });
    
    // Sort by score and limit
    const results = scoredResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    console.log(`✅ Found ${results.length} results (scores: ${results.map(r => r.similarity.toFixed(2)).join(', ')})`);
    
    return results;
  } catch (error) {
    console.error('Keyword search error:', error);
    throw error;
  }
}

