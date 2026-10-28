import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CUTOFF_DATE = '2026-07-02';

async function main() {
  const ids = [4, 6, 19];
  console.log('Cleaning redeem_history for ids:', ids);
  
  const { data, error } = await s
    .from('redeem_history')
    .delete()
    .in('participant_id', ids)
    .gte('requested_at', CUTOFF_DATE)
    .select();
    
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Successfully deleted redeem_history rows:', data?.length);
  }
}

main().catch(console.error);
