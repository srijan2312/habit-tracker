import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Loading Supabase config...');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set ✅' : 'Missing ❌');
console.log('SUPABASE_KEY:', supabaseKey ? 'Set ✅' : 'Missing ❌');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
