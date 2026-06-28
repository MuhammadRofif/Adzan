import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: qa } = await supabase.from('quiz_attempts').select('*').eq('participant_id', '10').order('completed_at', { ascending: false }).limit(5);
  console.log('Last 5 Quiz:', qa);
}
main().catch(console.error);
