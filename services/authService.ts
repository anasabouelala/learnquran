
import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

// ─── Hardcoded admins — always have full access ──────────────────────────────
// Add your email(s) here. These bypass the database is_admin flag entirely.
const ADMIN_EMAILS = new Set([
    'anasabouelala@gmail.com', // owner — full access forever
]);

// Dedupe concurrent getCurrentUser calls — App init and the auth-state listener fire
// it at the same moment; sharing one in-flight result avoids the network contention
// (and double slow-path) that was tipping auth past its timeout.
let _currentUserInFlight: Promise<UserProfile | null> | null = null;

// Reject if a promise doesn't settle in time. fetch()/supabase calls have no built-in
// timeout, so one stalled network request could otherwise hang sign-in or the initial
// auth check indefinitely (spinner stuck on the login page until a manual refresh).
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
        p.then(
            (v) => { clearTimeout(t); resolve(v); },
            (e) => { clearTimeout(t); reject(e); },
        );
    });
}

export const authService = {
    async getCurrentUser(): Promise<UserProfile | null> {
        if (_currentUserInFlight) return _currentUserInFlight;
        // Hard cap the whole load so a stalled request can't wedge this shared in-flight
        // promise (every later caller awaits it) and hang auth until a refresh.
        _currentUserInFlight = withTimeout(this._loadCurrentUser(), 9000, 'getCurrentUser')
            .catch((e: any) => {
                console.warn('[Auth] getCurrentUser failed/timed out:', e?.message || e);
                return null;
            });
        try { return await _currentUserInFlight; }
        finally { _currentUserInFlight = null; }
    },

    async _loadCurrentUser(): Promise<UserProfile | null> {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.user) return null;

            let { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_user_id', session.user.id)
                .maybeSingle();

            // Link shadow profile from Gumroad webhook via secure Vercel API
            if (!profile && session.user.email) {
                try {
                    const res = await fetch('/api/claim-profile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    });
                    const data = await res.json();

                    if (data?.claimed) {
                        // Shadow profile claimed! Fetch the fresh profile again safely
                        const { data: refreshedProfile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('auth_user_id', session.user.id)
                            .maybeSingle();

                        if (refreshedProfile) {
                            profile = refreshedProfile;
                            error = null;
                        }
                    }
                } catch (apiErr) {
                    console.error('Failed to claim shadow profile API call', apiErr);
                }
            }

            // No existing or shadow profile — create one now so the account is "healed":
            // future loads find it immediately and skip the slow claim path that was
            // timing auth out (and jamming sign-in) for users with no profile row.
            if (!profile && session.user.email) {
                try {
                    const { data: created } = await supabase
                        .from('profiles')
                        .insert({
                            auth_user_id: session.user.id,
                            email: session.user.email.toLowerCase().trim(),
                            full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0] || 'User',
                            level: 1, xp: 0, streak: 0,
                        })
                        .select('*')
                        .maybeSingle();
                    if (created) { profile = created; error = null; }
                } catch (createErr) {
                    console.warn('[Auth] Could not create profile, using fallback:', createErr);
                }
            }

            if (error || !profile) {
                const email = session.user.email || '';
                return {
                    name: session.user.user_metadata.full_name || email.split('@')[0] || 'User',
                    email,
                    level: 1,
                    xp: 0,
                    streak: 0,
                    badges: [],
                    accuracy: 0,
                    totalGamesPlayed: 0,
                    isAdmin: ADMIN_EMAILS.has(email),
                    createdAt: session.user.created_at,
                };
            }

            // Fetch additional stats:
            // 1. Current Surah Progress (Most recently updated)
            const { data: recentProgress } = await supabase
                .from('user_surah_progress')
                .select('surah_name, mastery_level')
                .eq('user_id', profile.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            // 2. Total Games Played (Sum of games_played across all surahs)
            // Or count of rows if we track per-game. Here using aggregated per-surah.
            const { data: totalGames } = await supabase
                .from('user_surah_progress')
                .select('games_played');

            const gamesCount = totalGames?.reduce((acc, curr) => acc + (curr.games_played || 0), 0) || 0;

            // 3. Average Accuracy (Mastery Level)
            const { data: allProgress } = await supabase
                .from('user_surah_progress')
                .select('mastery_level');

            const avgAccuracy = allProgress && allProgress.length > 0
                ? allProgress.reduce((acc, curr) => acc + (curr.mastery_level || 0), 0) / allProgress.length
                : 0;

            const profileEmail = profile.email || session.user.email || '';
            const premiumActive = profile.is_premium === true &&
                (profile.premium_expires_at == null ||
                    new Date(profile.premium_expires_at) > new Date());
            return {
                name: profile.full_name || session.user.user_metadata.full_name || 'User',
                email: profileEmail,
                level: profile.level || 1,
                xp: profile.xp || 0,
                streak: profile.streak || 0,
                badges: profile.badges || [],
                accuracy: Math.round(avgAccuracy),
                totalGamesPlayed: gamesCount,
                isAdmin: ADMIN_EMAILS.has(profileEmail) || profile.is_admin === true || premiumActive,
                createdAt: profile.created_at,
                currentSurah: recentProgress ? {
                    name: recentProgress.surah_name,
                    progress: Math.round(recentProgress.mastery_level || 0)
                } : undefined
            };
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                console.log('Ignored abort error in getCurrentUser');
            } else {
                console.error('Failed to get current user:', error);
            }
            return null;
        }
    },

    async signIn(email: string, password: string) {
        try {
            const { data, error } = await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                10000,
                'signIn',
            );
            if (error) throw error;
            return data.user;
        } catch (e: any) {
            // A stalled response can hang the request even though the session was actually
            // established server-side — check before failing so we don't strand the user
            // on a spinner.
            if (typeof e?.message === 'string' && e.message.includes('timed out')) {
                try {
                    const { data: { session } } = await withTimeout(
                        supabase.auth.getSession(), 3000, 'getSession');
                    if (session?.user) return session.user;
                } catch { /* fall through to the retry error */ }
                throw new Error('تعذّر الاتصال بالخادم، يرجى المحاولة مرة أخرى.');
            }
            throw e;
        }
    },

    async signUp(email: string, password: string, name: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        if (error) throw error;

        // Setup initial profile
        if (data.user) {
            const userEmail = email.toLowerCase().trim();
            try {
                // The /api/claim-profile expects the token.
                // We don't have the token reliably until user signs in.
                // So we'll just insert a normal profile.
                // If a shadow profile already exists, RLS will block inserting duplicate email unless handled.
                // BUT it is better to rely on getCurrentUser linking it instead!

                // First check if ANY profile exists for this email
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id, auth_user_id')
                    .eq('email', userEmail)
                    .maybeSingle();

                if (existingProfile) {
                    // Profile exists. If auth_user_id is null, it's a shadow profile.
                    // We don't have the full session token yet, so `getCurrentUser` will trigger next and claim it securely.
                    console.log('Existing profile found, deferring to getCurrentUser for claiming');
                } else {
                    // No profile exists, safe to insert!
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                auth_user_id: data.user.id,
                                email: userEmail,
                                full_name: name,
                                level: 1,
                                xp: 0,
                                streak: 0
                            }
                        ]);
                    if (profileError) console.error('Error creating profile:', profileError);
                }
            } catch (err) {
                console.error("Setup initial profile issue:", err);
            }
        }

        return data.user;
    },

    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) throw error;
        return data;
    },
    signOut() {
        // 1. Failsafe aggressive cleanup first
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.removeItem('supabase.auth.token');
        } catch (e) {
            console.error('LocalStorage clear error', e);
        }

        // 2. Sign out locally. This drops the session from GoTrue memory
        // Fire and forget without await so it never blocks the caller.
        supabase.auth.signOut({ scope: 'local' }).catch(() => { });
    },

    /** Verify a Gumroad license key and activate premium on the logged-in user */
    async activateLicense(licenseKey: string): Promise<{ success: boolean; premium_expires_at?: string; error?: string }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { success: false, error: 'Not authenticated' };

            // Call Vercel API Route instead of Supabase Edge Function to avoid deployment/CORS issues
            const res = await fetch('/api/verify-license', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ license_key: licenseKey })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Activation failed' };
            }

            return data as { success: boolean; premium_expires_at: string };
        } catch (err: any) {
            return { success: false, error: err.message || 'Network error' };
        }
    },

    /** Credit XP to the logged-in user's cloud profile (profiles.xp). Guests are
     *  local-only and return null. Level is derived from XP (1000 XP per level). */
    async addXp(xpDelta: number): Promise<{ xp: number; level: number } | null> {
        try {
            const delta = Math.round(xpDelta || 0);
            if (delta <= 0) return null;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return null; // not signed in — nothing to persist

            const { data: profile } = await supabase
                .from('profiles')
                .select('xp, level')
                .eq('auth_user_id', session.user.id)
                .maybeSingle();

            const newXp = (profile?.xp || 0) + delta;
            const newLevel = Math.max(1, Math.floor(newXp / 1000) + 1);

            const { error } = await supabase
                .from('profiles')
                .update({ xp: newXp, level: newLevel })
                .eq('auth_user_id', session.user.id);

            if (error) {
                console.warn('[Auth] addXp failed:', error.message);
                return null;
            }
            return { xp: newXp, level: newLevel };
        } catch (e) {
            console.error('[Auth] addXp error:', e);
            return null;
        }
    },

    onAuthStateChange(callback: (user: UserProfile | null) => void) {
        // IMPORTANT: this listener is intentionally NOT async and never awaits inside it.
        // supabase-js awaits auth-state subscribers while completing signInWithPassword, so
        // awaiting a slow/stalled profile fetch here would hang the sign-in call itself —
        // the user would sit on the login page with a spinner until a manual refresh.
        // Resolve the profile out of band and push it through the callback when it's ready.
        return supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                this.getCurrentUser()
                    .then((user) => callback(user))
                    .catch((error: any) => {
                        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
                            console.log('Ignored abort error during auth state change');
                        } else {
                            console.error('Error fetching user on auth change:', error);
                        }
                        // Keep the user signed in; we just couldn't hydrate the profile now.
                    });
            } else {
                callback(null);
            }
        });
    }
};
