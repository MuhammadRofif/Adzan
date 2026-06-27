import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase.from('quizzes').select('*').limit(1);
  console.log("quizzes", data, error);
  
  const { data: qData, error: qError } = await supabase.from('questions').select('*').limit(1);
  console.log("questions", qData, qError);
  
  const { data: bData, error: bError } = await supabase.from('budget_settings').select('*').limit(1);
  console.log("budget_settings", bData, bError);
}

check();
