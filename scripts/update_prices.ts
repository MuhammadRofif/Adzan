import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePrices() {
  const packages = [
    { name: 'Paket 5 Diamond', pointsRequired: 150 },
    { name: 'Paket 12 Diamond', pointsRequired: 300 },
    { name: 'Paket 50 Diamond', pointsRequired: 700 },
    { name: 'Paket 70 Diamond', pointsRequired: 900 },
    { name: 'Paket 140 Diamond', pointsRequired: 1600 },
  ];

  for (const pkg of packages) {
    const { error } = await supabase
      .from('redeem_packages')
      .update({ points_required: pkg.pointsRequired })
      .eq('name', pkg.name);
      
    if (error) {
      console.error(`Failed to update ${pkg.name}:`, error);
    } else {
      console.log(`Updated ${pkg.name} to ${pkg.pointsRequired} points.`);
    }
  }
}

updatePrices().then(() => console.log('Done.')).catch(console.error);
