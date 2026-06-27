import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Menyiapkan data dummy untuk Papan Juara...");

  // 1. Dapatkan daftar partisipan
  const { data: participants, error: pError } = await supabase.from('participants').select('*');
  if (pError || !participants || participants.length === 0) {
    console.log("Gagal mendapatkan peserta atau peserta kosong.");
    return;
  }

  // 2. Buat Season Lama (Misalnya Season 0 - 1 Mei s.d 1 Juli)
  const { data: oldSeason, error: sError } = await supabase.from('seasons').insert({
    name: 'Season Pemanasan (Mei-Juni)',
    start_date: '2026-05-01T00:00:00Z',
    end_date: '2026-07-01T00:00:00Z',
  }).select('*').single();

  if (sError || !oldSeason) {
    console.error("Gagal membuat season lama:", sError);
    return;
  }

  // 3. Masukkan Top 5 dummy
  const sortedParticipants = [...participants].sort(() => Math.random() - 0.5).slice(0, 5);
  
  const historyEntries = sortedParticipants.map((p, index) => {
    let badge = null;
    if (index === 0) badge = 'gold';
    else if (index === 1) badge = 'silver';
    else if (index === 2) badge = 'bronze';

    return {
      season_id: oldSeason.id,
      participant_id: p.id,
      final_points: 5000 - (index * 500),
      rank: index + 1,
      badge
    };
  });

  const { error: hError } = await supabase.from('season_history').insert(historyEntries);
  
  if (hError) {
    console.error("Gagal memasukkan riwayat season:", hError);
  } else {
    console.log("Sukses! Data dummy berhasil ditambahkan.");
  }
}

main().catch(console.error);
