import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// You'll get these from https://supabase.com after creating a project
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 