import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: trx } = await supabase.from('transactions').select('*').eq('participant_id', '10').eq('type', 'adjustment').order('timestamp', { ascending: false });
  console.log('Adjustment Trx for Rega:', trx);
}
main().catch(console.error);
