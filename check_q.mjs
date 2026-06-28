import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snvilfkzqjjokcwaaqkq.supabase.co';
const supabaseKey = 'sb_publishable_sjcX2Qa5i81mgjSbli-YsQ_Gjujmiue';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: q } = await supabase.from('quizzes').select('*');
  console.log(q.map(x => ({ id: x.id, title: x.title, qCount: x.questions.length })));
}
main().catch(console.error);
