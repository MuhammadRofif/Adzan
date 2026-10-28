// Read-only snapshot of production tables via the public REST API (anon key).
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const U = env.VITE_SUPABASE_URL, K = env.VITE_SUPABASE_ANON_KEY;
const out = {};
for (const t of ['participants','attendance_log','adzan_log','transactions','redeem_history','quiz_attempts','quizzes','redeem_packages','seasons','season_history']) {
  let rows = [], from = 0;
  for (;;) {
    const r = await fetch(`${U}/rest/v1/${t}?select=*&order=${t==='seasons'||t==='season_history'?'created_at':'id'}`, { headers: { apikey: K, Authorization: 'Bearer ' + K, Range: `${from}-${from + 999}` } });
    const d = await r.json(); rows = rows.concat(d); if (d.length < 1000) break; from += 1000;
  }
  out[t] = rows; console.log(t, rows.length);
}
fs.writeFileSync(process.argv[3], JSON.stringify(out));
