const url = 'https://copfzeukploetctannjz.supabase.co/rest/v1/ranking?select=*';
const apikey = 'sb_publishable_29XgpIOFdNqG3py0MZAm8w_JpVujz9k';
fetch(url, { headers: { apikey, Authorization: `Bearer ${apikey}` } })
  .then(res => res.json())
  .then(data => console.log('Columns:', Object.keys(data[0])))
  .catch(console.error);
