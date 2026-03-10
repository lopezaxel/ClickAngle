import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ahbrflukfncghlyscogq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoYnJmbHVrZm5jZ2hseXNjb2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzI2NDksImV4cCI6MjA4ODIwODY0OX0.Cz0jIZcS-1QyDqsCXCE7Q49HYAWbSL-rXlxiDD4hnWM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
export { SUPABASE_URL };
