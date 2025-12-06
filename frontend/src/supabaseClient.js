import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please create frontend/.env.local with:');
  console.error('REACT_APP_SUPABASE_URL=https://your-project.supabase.co');
  console.error('REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here');
}

// Create client with fallback values to prevent app crash
// User will see error message but app won't crash
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export default supabase;









