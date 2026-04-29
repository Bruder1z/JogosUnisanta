import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://copfzeukploetctannjz.supabase.co';
const supabaseAnonKey = 'sb_publishable_29XgpIOFdNqG3py0MZAm8w_JpVujz9k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const toAdd = [
  "Comércio Exterior - Esamc"
];

async function run() {
  for (const course of toAdd) {
    const [name, university] = course.split(" - ");
    
    const { data: existing } = await supabase.from("courses").select("*").match({ name: name.trim(), university: university.trim() });
    
    if (!existing || existing.length === 0) {
      const id = randomUUID();
      const { error: err1 } = await supabase.from("courses").insert([{ id, name: name.trim(), university: university.trim() }]);
      
      const { data: existingRanking } = await supabase.from("ranking").select("*").match({ course });
      if (!existingRanking || existingRanking.length === 0) {
          const { error: err2 } = await supabase.from("ranking").insert([{ course, points: 0 }]);
          if (err2) console.error(`Error adding ranking ${course}:`, err2);
      }
      
      if (err1) console.error(`Error adding course ${course}:`, err1);
      
      console.log(`Added ${course}`);
    } else {
      console.log(`Already exists: ${course}`);
    }
  }
}

run().catch(console.error);
