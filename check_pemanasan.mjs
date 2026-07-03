import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const CUTOFF_DATE = '2026-07-02';

async function main() {
  // Check quiz attempts for Rama (ID 19) and others
  const { data: qa } = await s.from('quiz_attempts').select('*').in('participant_id', [4, 6, 19]).gte('completed_at', CUTOFF_DATE);
  console.log('Quiz attempts to delete:', qa);

  // 1. Delete for Iqbal (ID 4)
  console.log('\nCleaning Iqbal (ID 4)...');
  const d1 = await s.from('transactions').delete().eq('participant_id', 4).gte('timestamp', CUTOFF_DATE);
  console.log('Deleted transactions:', d1.error ? d1.error.message : 'OK');

  // 2. Delete for Rama (ID 19)
  console.log('\nCleaning Rama (ID 19)...');
  const d2 = await s.from('transactions').delete().eq('participant_id', 19).gte('timestamp', CUTOFF_DATE);
  const d3 = await s.from('attendance_log').delete().eq('participant_id', 19).gte('date', CUTOFF_DATE);
  const d4 = await s.from('quiz_attempts').delete().eq('participant_id', 19).gte('completed_at', CUTOFF_DATE);
  console.log('Deleted transactions:', d2.error ? d2.error.message : 'OK');
  console.log('Deleted attendance_log:', d3.error ? d3.error.message : 'OK');
  console.log('Deleted quiz_attempts:', d4.error ? d4.error.message : 'OK');

  // 3. Delete for Iqbal Adek Akmal (ID 6) - Keep attendance, delete redeems
  console.log('\nCleaning Iqbal Adek Akmal (ID 6)...');
  const d5 = await s.from('transactions').delete().eq('participant_id', 6).eq('type', 'redeem').gte('timestamp', CUTOFF_DATE);
  console.log('Deleted redeem transactions:', d5.error ? d5.error.message : 'OK');
}

main().catch(console.error);
