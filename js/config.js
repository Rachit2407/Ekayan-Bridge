// js/config.js
// Replace these with your actual Supabase Project URL and Anon API Key
const supabaseUrl = 'https://eolzuwwnusmtvssolavt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbHp1d3dudXNtdHZzc29sYXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTAzMjIsImV4cCI6MjA5NTUyNjMyMn0.Zzu_LzCQzEZZtj3B3WD85-uWG6KMyGK1BlMxh4gbY60';

// Safe initialization that won't throw if keys are not set yet
const supabaseClient = (supabaseUrl && supabaseKey && window.supabase) 
  ? window.supabase.createClient(supabaseUrl, supabaseKey) 
  : null;
