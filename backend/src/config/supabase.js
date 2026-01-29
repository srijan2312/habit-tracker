import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Loading Supabase config...');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set ✅' : 'Missing ❌');
console.log('SUPABASE_KEY:', supabaseKey ? 'Set ✅' : 'Missing ❌');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set ✅' : 'Missing ❌');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Regular client with anon key (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client with service role key (bypasses RLS) - use for server-side operations only
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
