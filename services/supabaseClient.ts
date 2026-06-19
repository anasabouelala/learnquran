import { createClient } from '@supabase/supabase-js';

// Canonical LIVE project. These are PUBLIC values — the anon key is RLS-guarded and
// already ships in the client bundle — so pinning them here is safe and gives us a
// source of truth a stale build-time env var can never override.
const LIVE_SUPABASE_URL = 'https://giztvcbspfztdwkrzwjs.supabase.co';
const LIVE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpenR2Y2JzcGZ6dGR3a3J6d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDkwMTMsImV4cCI6MjA5Njc4NTAxM30.BSSs9DnMXXn378aabEvWcAzz9tirTt1vAzTwA_7xVoY';

// Incident: a Vercel build-time env var pointed at a now-DEAD project
// (teynsomeaopwmndoirro), which Vite inlined into the bundle — so every auth fetch on
// hafed.app failed with "NetworkError". Prefer the env var when it's valid, but reject
// the dead ref (or a missing value) and self-heal to the live project at runtime.
const DEAD_REF = 'teynsomeaopwmndoirro';
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const envIsBad =
    !supabaseUrl || !supabaseAnonKey ||
    supabaseUrl.includes(DEAD_REF) || supabaseAnonKey.includes(DEAD_REF);

if (envIsBad) {
    if (supabaseUrl?.includes(DEAD_REF) || supabaseAnonKey?.includes(DEAD_REF)) {
        console.warn('[Supabase] Ignoring stale dead-project env var; using the live project.');
    } else {
        console.warn('[Supabase] Env vars missing; falling back to the live project.');
    }
    supabaseUrl = LIVE_SUPABASE_URL;
    supabaseAnonKey = LIVE_SUPABASE_ANON_KEY;
}

// Drop any leftover token from the now-dead project so it can never interfere with
// the live client's session handling.
try { localStorage.removeItem('sb-teynsomeaopwmndoirro-auth-token'); } catch { /* ignore */ }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Bypass the Web Locks API. supabase-js serializes getSession()/token refresh
        // with navigator.locks; a stuck or cross-tab lock makes getSession() hang
        // forever — surfacing as "Auth check timed out" and blocking sign-in entirely
        // (a clean browser with no stored token is unaffected, which is the tell).
        // A no-op lock runs the work immediately; a single-page app needs no cross-tab
        // lock coordination, so this is safe and removes the deadlock.
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
    },
});

export const isSupabaseConfigured = () => {
    return !!supabaseUrl && !!supabaseAnonKey;
};
