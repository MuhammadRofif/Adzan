import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY as string;

const s = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: seasons } = await s.from("seasons").select("*");
  console.log("Seasons:", seasons);
  if (seasons) {
    for (const season of seasons) {
      if (season.name.includes("Pemanasan") || season.name.includes("pemanasan")) {
        console.log("Deleting season:", season.name);
        await s.from("season_history").delete().eq("season_id", season.id);
        await s.from("seasons").delete().eq("id", season.id);
      }
    }
  }
}
run();
