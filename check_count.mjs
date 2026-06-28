import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { count, error } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  console.log('Total transactions:', count);
  
  const { count: countQ } = await supabase.from('quiz_attempts').select('*', { count: 'exact', head: true });
  console.log('Total quiz attempts:', countQ);
  
  const { count: countA } = await supabase.from('adzan_log').select('*', { count: 'exact', head: true });
  console.log('Total adzan log:', countA);
}
main().catch(console.error);
