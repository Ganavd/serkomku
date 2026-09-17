import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xifikumgjyiiyabkcwbw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZmlrdW1nanlpaXlhYmtjd2J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTAzODAsImV4cCI6MjEwNDE4NjM4MH0.y_EnjcwlsBDY7vx0tbBWqBIhCLZVrdlhrevjBp0Hv9g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
