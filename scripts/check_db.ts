import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: seasons } = await supabase.from('seasons').select('*');
  const { data: history } = await supabase.from('season_history').select('*');
  console.log("Seasons:", JSON.stringify(seasons, null, 2));
  console.log("History:", JSON.stringify(history, null, 2));
}

check().catch(console.error);
