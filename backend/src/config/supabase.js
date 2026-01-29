import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback service role key for testing if not set in environment
if (!supabaseServiceKey) {
  supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodGRzaHhvdG5hbmNlZ2VmcXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM2MDUyMywiZXhwIjoyMDg0OTM2NTIzfQ.cRvYS8S3Da7LRtm8ul8JF5axpzUdA54yIU9NVlfe38M';
  console.warn('Using hardcoded SERVICE_ROLE_KEY - should be set via environment variable');
}

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
