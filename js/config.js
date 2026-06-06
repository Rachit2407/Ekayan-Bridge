// js/config.js
// Replace these with your actual Supabase Project URL and Anon API Key
const supabaseUrl = '';
const supabaseKey = '';

// Safe initialization that won't throw if keys are not set yet
const supabase = (supabaseUrl && supabaseKey && window.supabase) 
  ? window.supabase.createClient(supabaseUrl, supabaseKey) 
  : null;
