/* ============================================================
   BudgetKu : Supabase Client Configuration
   Frontend connection to Supabase Database & Auth.
   ============================================================ */

const SUPABASE_URL = 'https://dmhifcfsloncgjrxzvnl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0UVfI5vLmCrS4Oilr0rDMg_5YQtQsQl';

// Helper validasi UUID v4 / PostgreSQL standard UUID
function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}
window.isValidUUID = isValidUUID;

// Inisialisasi Supabase JS Client (Strict Singleton Pattern)
let supabaseClient = null;
function getSupabaseClient() {
  if (window.supabaseClient) {
    supabaseClient = window.supabaseClient;
    return window.supabaseClient;
  }
  if (supabaseClient) {
    window.supabaseClient = supabaseClient;
    return supabaseClient;
  }
  const urlMeta = document.querySelector('meta[name="supabase-url"]');
  const keyMeta = document.querySelector('meta[name="supabase-key"]');
  const supabaseUrl = (urlMeta ? urlMeta.getAttribute('content') : '') || SUPABASE_URL;
  const supabaseKey = (keyMeta ? keyMeta.getAttribute('content') : '') || SUPABASE_ANON_KEY;

  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    try {
      supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
      window.supabaseClient = supabaseClient;
      return supabaseClient;
    } catch (e) {
      console.warn('[Supabase Client] Gagal inisialisasi client:', e);
    }
  }
  return null;
}

if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
  getSupabaseClient();
}

/**
 * Dapatkan data user aktif dari session lokal atau Supabase Auth (Non-blocking)
 */
async function getActiveSupabaseUser() {
  let user = null;

  // 1. Cek sesi login helper lokal terlebih dahulu (respons instan 0ms)
  if (typeof window.getActiveUser === 'function') {
    const active = window.getActiveUser();
    if (active && active.id) user = active;
  }

  if (!user) {
    const raw = localStorage.getItem('budgetku_user') || sessionStorage.getItem('budgetku_user');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) user = parsed;
      } catch (e) {}
    }
  }

  // 2. Jika belum ditemukan di lokal, periksa dari Supabase Auth dengan batas waktu ketat 800ms
  if (!user) {
    const client = getSupabaseClient();
    if (client && client.auth && typeof client.auth.getUser === 'function') {
      try {
        const authPromise = client.auth.getUser();
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ data: { user: null } }), 800));
        const res = await Promise.race([authPromise, timeoutPromise]);
        const authUser = res && res.data ? res.data.user : null;
        if (authUser && authUser.id && isValidUUID(authUser.id)) {
          user = authUser;
        }
      } catch (e) {
        console.warn('[Supabase Auth] Gagal memanggil getUser:', e);
      }
    }
  }

  // 3. Jika ID bukan UUID yang valid (misal ID numerik 11), lakukan auto-resolve UUID dari backend secara aman
  if (user && user.id && !isValidUUID(user.id)) {
    try {
      const syncPromise = fetch(`/api/sync?month=current&user_id=${encodeURIComponent(user.id)}`, {
        headers: { 'Accept': 'application/json' }
      });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
      const checkRes = await Promise.race([syncPromise, timeoutPromise]);

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.user && checkData.user.id && isValidUUID(checkData.user.id)) {
          user.id = checkData.user.id;
          localStorage.setItem('budgetku_user', JSON.stringify(user));
          sessionStorage.setItem('budgetku_user', JSON.stringify(user));
        }
      }
    } catch (e) {
      // Abaikan jika offline / timeout, jangan hentikan eksekusi
    }
  }

  return user;
}

/**
 * Helper Fetch langsung ke Supabase REST API (sebagai native fallback)
 */
async function supabaseFetch(endpoint, options = {}) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}/rest/v1/${cleanEndpoint}`;
  return fetch(url, { ...options, headers });
}

// Expose ke global window
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = supabaseClient;
window.getSupabaseClient = getSupabaseClient;
window.getActiveSupabaseUser = getActiveSupabaseUser;
window.supabaseFetch = supabaseFetch;

