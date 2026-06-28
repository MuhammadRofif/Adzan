import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: seasonsData } = await supabase.from('seasons').select('*').order('start_date', { ascending: false });
  console.log('Seasons:', seasonsData);
}
main().catch(console.error);
