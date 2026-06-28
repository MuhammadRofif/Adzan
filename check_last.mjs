import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: trx } = await supabase.from('transactions').select('*').eq('participant_id', '10').order('timestamp', { ascending: false }).limit(5);
  console.log('Last 5 Trx:', trx);
  
  const { data: rh } = await supabase.from('redeem_history').select('*').eq('participant_id', '10').order('requested_at', { ascending: false }).limit(5);
  console.log('Last 5 Redeem:', rh);
}
main().catch(console.error);
