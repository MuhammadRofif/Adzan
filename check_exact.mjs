import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: seasonsData } = await supabase.from('seasons').select('*').order('start_date', { ascending: false });
  const mappedSeasons = seasonsData.map(s => ({ ...s, startDate: new Date(s.start_date), endDate: s.end_date ? new Date(s.end_date) : undefined }));
  const currentActiveSeason = mappedSeasons.find(s => !s.endDate) || mappedSeasons[0];

  let attQuery = supabase.from("attendance_log").select("*").limit(10000);
  let adzQuery = supabase.from("adzan_log").select("*").limit(10000);
  let qaQuery = supabase.from("quiz_attempts").select("*").limit(10000);
  let trxQuery = supabase.from("transactions").select("*").limit(10000);
  let rhQuery = supabase.from("redeem_history").select("*").limit(10000);

  if (currentActiveSeason) {
    const startStr = currentActiveSeason.startDate.toISOString();
    attQuery = attQuery.gte("date", startStr);
    adzQuery = adzQuery.gte("date", startStr);
    qaQuery = qaQuery.gte("completed_at", startStr);
    trxQuery = trxQuery.gte("timestamp", startStr);
    rhQuery = rhQuery.gte("requested_at", startStr);
    
    if (currentActiveSeason.endDate) {
      const endStr = currentActiveSeason.endDate.toISOString();
      attQuery = attQuery.lte("date", endStr);
      adzQuery = adzQuery.lte("date", endStr);
      qaQuery = qaQuery.lte("completed_at", endStr);
      trxQuery = trxQuery.lte("timestamp", endStr);
      rhQuery = rhQuery.lte("requested_at", endStr);
    }
  }

  const [{ data: attData }, { data: adzData }, { data: qaData }, { data: tData }, { data: rhData }] = await Promise.all([
    attQuery, adzQuery, qaQuery, trxQuery, rhQuery
  ]);

  const pid = '10'; // Rega
  const pt = { total: 0, adzan: 0, attendance: 0, quiz: 0, trx: 0, redeem: 0 };

  adzData?.filter(a => String(a.participant_id) === pid).forEach(a => {
    pt.adzan += a.total;
    pt.total += a.total;
  });

  attData?.filter(a => String(a.participant_id) === pid).forEach(a => {
    pt.attendance += a.points;
    pt.total += a.points;
  });

  qaData?.filter(a => String(a.participant_id) === pid).forEach(qa => {
    pt.quiz += qa.earned_points || 0;
    pt.total += qa.earned_points || 0;
  });

  tData?.filter(t => String(t.participant_id) === pid).forEach(t => {
    if (t.type === 'adjustment') {
      pt.trx += t.points;
      pt.total += t.points;
    }
  });

  rhData?.filter(r => String(r.participant_id) === pid).forEach(r => {
    if (r.status === 'approved') {
      pt.redeem += r.points_spent;
      pt.total -= r.points_spent;
    }
  });

  console.log('Final calculated point for Rega:', pt);
}

main().catch(console.error);
