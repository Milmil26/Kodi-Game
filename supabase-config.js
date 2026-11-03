// BOLEH di sini: Project URL + publishable key (atau anon key).
// JANGAN PERNAH taruh secret key / service_role key di file ini.
// Project URL TANPA /rest/v1/ di belakangnya.
var SUPABASE_URL = 'https://tahalzufzukcvfjwwrpo.supabase.co';
var SUPABASE_KEY = 'sb_publishable_1GtDuaNTjpZZnZD9yo_3pg_aDKbrgH-';

if (window.supabase) {
  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.error('Library Supabase belum dimuat. Cek tag <script> di HTML.');
}