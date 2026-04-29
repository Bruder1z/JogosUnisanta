import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://copfzeukploetctannjz.supabase.co';
const supabaseAnonKey = 'sb_publishable_29XgpIOFdNqG3py0MZAm8w_JpVujz9k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Remove erroneous entry
  await supabase.from("courses").delete().match({ name: "Comércio Exterior", university: "Esamc" });
  await supabase.from("ranking").delete().match({ course: "Comércio Exterior - Esamc" });

  // Add correct entry
  const name = "Comex";
  const university = "Unisanta";
  const course = "Comex - Unisanta";
  
  const { data: existing } = await supabase.from("courses").select("*").match({ name, university });
  
  if (!existing || existing.length === 0) {
    const id = randomUUID();
    await supabase.from("courses").insert([{ id, name, university }]);
    
    const { data: existingRanking } = await supabase.from("ranking").select("*").match({ course });
    if (!existingRanking || existingRanking.length === 0) {
        await supabase.from("ranking").insert([{ course, points: 0 }]);
    }
    console.log(`Added ${course}`);
  } else {
    console.log(`Already exists: ${course}`);
  }
}

run().catch(console.error);
