import { supabase } from '../config/database.js';
import csv from 'csv-parser';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Check API key
if (!process.env.HUGGINGFACE_API_KEY) {
  console.error('❌ ERROR: HUGGINGFACE_API_KEY not found in .env file!');
  process.exit(1);
}

// Generate embeddings using Hugging Face Direct API (more reliable)
// Using BAAI/bge-small-en-v1.5 - 384 dimensions (optimized for semantic search)
async function generateEmbedding(text) {
  try {
    // Truncate text if too long (max ~512 tokens)
    const truncatedText = text.substring(0, 2000);
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/BAAI/bge-small-en-v1.5',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: truncatedText,
          options: { wait_for_model: true }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Status:', response.status);
      console.error('API Response:', errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid Hugging Face API key. Please check your .env file.');
      }
      
      if (response.status === 503) {
        console.log('⏳ Model is loading (first time use), waiting 20 seconds...');
        await new Promise(resolve => setTimeout(resolve, 20000));
        return generateEmbedding(text); // Retry once
      }
      
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    
    const embedding = await response.json();
    
    // Convert to flat array if needed - handle different response formats
    let result;
    if (Array.isArray(embedding)) {
      // If it's an array of arrays, flatten it
      result = embedding.flat ? embedding.flat() : [].concat(...embedding);
    } else {
      result = Array.from(embedding);
    }
    
    // Verify it's 384 dimensions
    if (result.length !== 384) {
      throw new Error(`Expected 384 dimensions, got ${result.length}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    
    if (error.message.includes('Invalid Hugging Face API key')) {
      console.error('\n❌ API KEY ERROR:');
      console.error('1. Check your .env file: HUGGINGFACE_API_KEY=hf_xxxxx');
      console.error('2. Get a new token: https://huggingface.co/settings/tokens');
      console.error('3. Make sure Role is "Read"\n');
    }
    
    throw error;
  }
}

// Process CSV file and store in database
export async function processCSVFile(filePath, category) {
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', async () => {
        try {
          console.log(`Processing ${results.length} rows from ${category} CSV...`);
          
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            // Combine all row values into searchable text
            const content = Object.values(row).join(' ');
            
            console.log(`Generating embedding for row ${i + 1}/${results.length}...`);
            const embedding = await generateEmbedding(content);
            
            // Add small delay to avoid rate limits (1 request per second)
            if (i < results.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Save to database - Supabase handles vector conversion
            const { error } = await supabase.from('knowledge_base').insert({
              category,
              content,
              metadata: row,
              embedding: embedding  // Pass as array directly
            });
            
            if (error) {
              console.error(`Error inserting row ${i + 1}:`, error);
              throw error;
            }
          }
          
          console.log(`Successfully processed ${results.length} rows`);
          resolve(results.length);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Semantic search using embeddings
export async function searchKnowledgeBase(query, limit = 5) {
  try {
    console.log(`Searching knowledge base for: "${query}"`);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search using the match_knowledge function - pass array directly
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,  // Lowered from 0.7 for better recall
      match_count: limit
    });
    
    if (error) {
      console.error('Search error:', error);
      throw error;
    }
    
    console.log(`Found ${data ? data.length : 0} relevant documents`);
    return data || [];
  } catch (error) {
    console.error('Knowledge base search error:', error);
    throw error;
  }
}
