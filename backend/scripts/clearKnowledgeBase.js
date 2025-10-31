import { supabase } from '../config/database.js';

async function clearKnowledgeBase() {
  try {
    console.log('🗑️  Clearing knowledge base...');
    
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (error) {
      console.error('Error clearing knowledge base:', error);
      process.exit(1);
    }
    
    console.log('✅ Knowledge base cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearKnowledgeBase();




