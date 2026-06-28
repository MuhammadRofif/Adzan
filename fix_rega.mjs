import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const pid = '10'; // Rega

  // Fetch recent approved redeems
  const { data: redeem } = await supabase
    .from('redeem_history')
    .select('*')
    .eq('participant_id', pid)
    .eq('status', 'approved')
    .order('requested_at', { ascending: false })
    .limit(2);

  console.log('Recent approved redeems:', redeem);

  if (redeem && redeem.length >= 2) {
    // If there are duplicate requests (e.g. within seconds of each other)
    const timeDiff = Math.abs(new Date(redeem[0].requested_at).getTime() - new Date(redeem[1].requested_at).getTime());
    if (timeDiff < 60000) { // within 1 minute
      console.log('Duplicate detected! Rejecting the latter one...', redeem[0].id);
      
      // Update the status of the first one in the list (the later one) to rejected
      const { data, error } = await supabase
        .from('redeem_history')
        .update({ status: 'rejected' })
        .eq('id', redeem[0].id);
        
      if (error) {
        console.error('Error updating:', error);
      } else {
        console.log('Successfully rejected duplicate redeem ID:', redeem[0].id);
      }
    } else {
      console.log('Redeems are not within 1 minute, not doing anything.');
    }
  }
}

main().catch(console.error);
