import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const pid = '10'; // Rega

  // Fetch the recently rejected redeem
  const { data: redeem } = await supabase
    .from('redeem_history')
    .select('*')
    .eq('participant_id', pid)
    .eq('status', 'rejected')
    .order('requested_at', { ascending: false })
    .limit(1);

  if (redeem && redeem.length > 0) {
    const { data, error } = await supabase
      .from('redeem_history')
      .update({ status: 'approved' })
      .eq('id', redeem[0].id);
      
    if (error) {
      console.error('Error updating:', error);
    } else {
      console.log('Successfully RESTORED duplicate redeem ID to approved:', redeem[0].id);
    }
  } else {
    console.log('No rejected redeem found.');
  }
}

main().catch(console.error);
