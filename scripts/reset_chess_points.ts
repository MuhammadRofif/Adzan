import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetChessPoints() {
  console.log('Fetching chess-related transactions...');
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .ilike('reason', '%catur%');

  if (error) {
    console.error('Error fetching transactions:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No chess-related transactions found.');
    process.exit(0);
  }

  console.log(`Found ${data.length} transactions. Deleting them to reset points...`);
  
  const idsToDelete = data.map(t => t.id);
  
  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('Error deleting transactions:', deleteError);
    process.exit(1);
  }

  console.log('Successfully reset chess points!');
  process.exit(0);
}

resetChessPoints();
