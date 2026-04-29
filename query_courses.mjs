import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://copfzeukploetctannjz.supabase.co';
const supabaseAnonKey = 'sb_publishable_29XgpIOFdNqG3py0MZAm8w_JpVujz9k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from("courses").select("*");
  if (error) console.error(error);
  else {
    const courses = data.map(c => `${c.name} - ${c.university}`);
    console.log("DB COURSES:", courses.join(", "));
  }
}

run().catch(console.error);
