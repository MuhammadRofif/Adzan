import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: participants } = await supabase.from('participants').select('*').ilike('nama', '%rega%');
  const pId = participants[0].id;

  const { data: redeem } = await supabase.from('redeem_history').select('*').eq('participant_id', pId).order('requested_at', { ascending: false }).limit(5);
  console.log('Recent Redeems:', redeem);
  
  const { data: adzan } = await supabase.from('adzan_log').select('*').eq('participant_id', pId).order('date', { ascending: false }).limit(5);
  console.log('\nRecent Adzan:', adzan);
  
  const { data: att } = await supabase.from('attendance_log').select('*').eq('participant_id', pId).order('date', { ascending: false }).limit(5);
  console.log('\nRecent Attendance:', att);
  
  const { data: quiz } = await supabase.from('quiz_attempts').select('*').eq('participant_id', pId).order('completed_at', { ascending: false }).limit(5);
  console.log('\nRecent Quiz Attempts:', quiz);
  
  const { data: trx } = await supabase.from('transactions').select('*').eq('participant_id', pId).order('timestamp', { ascending: false }).limit(5);
  console.log('\nRecent Transactions:', trx);
}
main().catch(console.error);
