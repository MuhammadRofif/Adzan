import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: trx } = await supabase.from('transactions').select('*').eq('participant_id', '10').lt('timestamp', '2026-05-01');
  console.log('Trx before May 1:', trx);
  
  const { data: qa } = await supabase.from('quiz_attempts').select('*').eq('participant_id', '10').lt('completed_at', '2026-05-01');
  console.log('Quiz before May 1:', qa);
}
main().catch(console.error);
