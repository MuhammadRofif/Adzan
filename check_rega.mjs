import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: participants } = await supabase.from('participants').select('*').ilike('nama', '%rega%');
  if (!participants || participants.length === 0) return console.log('No Rega found');
  const pId = participants[0].id;
  
  const { data: seasons } = await supabase.from('seasons').select('*').order('start_date', { ascending: false });
  const currentSeason = seasons?.find(s => !s.end_date) || seasons?.[0];
  const startDate = currentSeason ? currentSeason.start_date : null;
  
  let filterFn = (q, col) => startDate ? q.gte(col, startDate) : q;

  const { data: adzan } = await filterFn(supabase.from('adzan_log').select('*').eq('participant_id', pId), 'date');
  const adzanSum = adzan?.reduce((sum, a) => sum + (a.total || 0), 0) || 0;

  const { data: att } = await filterFn(supabase.from('attendance_log').select('*').eq('participant_id', pId), 'date');
  const attSum = att?.reduce((sum, a) => sum + (a.points || 0), 0) || 0;

  const { data: trx } = await filterFn(supabase.from('transactions').select('*').eq('participant_id', pId).eq('type', 'adjustment'), 'timestamp');
  const trxSum = trx?.reduce((sum, a) => sum + (a.points || 0), 0) || 0;

  const { data: redeem } = await filterFn(supabase.from('redeem_history').select('*').eq('participant_id', pId).eq('status', 'approved'), 'requested_at');
  const redeemSum = redeem?.reduce((sum, a) => sum + (a.points_spent || 0), 0) || 0;

  const { data: quiz } = await filterFn(supabase.from('quiz_attempts').select('*').eq('participant_id', pId), 'completed_at');
  const quizSum = quiz?.reduce((sum, a) => sum + (a.earned_points || 0), 0) || 0;

  console.log(`Current Season Start: ${startDate}`);
  console.log(`Adzan Points: ${adzanSum}`);
  console.log(`Attendance Points: ${attSum}`);
  console.log(`Transaction Points (Adjustment): ${trxSum}`);
  console.log(`Quiz Points: ${quizSum}`);
  console.log(`Redeemed Points (Subtracted): ${redeemSum}`);
  console.log(`TOTAL CALCULATED POINTS: ${adzanSum + attSum + trxSum + quizSum - redeemSum}`);
  
  // Also calculate for without season filter to see
  const { data: adzanAll } = await supabase.from('adzan_log').select('*').eq('participant_id', pId);
  const adzanSumAll = adzanAll?.reduce((sum, a) => sum + (a.total || 0), 0) || 0;
  
  const { data: attAll } = await supabase.from('attendance_log').select('*').eq('participant_id', pId);
  const attSumAll = attAll?.reduce((sum, a) => sum + (a.points || 0), 0) || 0;
  
  const { data: trxAll } = await supabase.from('transactions').select('*').eq('participant_id', pId).eq('type', 'adjustment');
  const trxSumAll = trxAll?.reduce((sum, a) => sum + (a.points || 0), 0) || 0;
  
  const { data: redeemAll } = await supabase.from('redeem_history').select('*').eq('participant_id', pId).eq('status', 'approved');
  const redeemSumAll = redeemAll?.reduce((sum, a) => sum + (a.points_spent || 0), 0) || 0;
  
  const { data: quizAll } = await supabase.from('quiz_attempts').select('*').eq('participant_id', pId);
  const quizSumAll = quizAll?.reduce((sum, a) => sum + (a.earned_points || 0), 0) || 0;
  
  console.log(`\n--- ALL TIME POINTS (No Season Filter) ---`);
  console.log(`TOTAL ALL TIME: ${adzanSumAll + attSumAll + trxSumAll + quizSumAll - redeemSumAll}`);
}
main().catch(console.error);
