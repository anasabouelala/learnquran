
// Time-based free trial: new users get full access for TRIAL_DAYS, after which the app
// prompts them to subscribe (a closable popup + a permanent header). The clock starts at
// account creation for signed-in users (so it can't be reset by clearing storage) and
// falls back to a device-local "first seen" timestamp for guests.
const TRIAL_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;
const START_KEY = 'hafed_trial_start';

function localStartMs(): number {
    try {
        const raw = localStorage.getItem(START_KEY);
        if (raw) {
            const n = parseInt(raw, 10);
            if (!Number.isNaN(n)) return n;
        }
        const now = Date.now();
        localStorage.setItem(START_KEY, String(now));
        return now;
    } catch {
        return Date.now();
    }
}

function startMs(createdAt?: string | null): number {
    // Prefer the account's creation time — robust, and can't be gamed by clearing storage.
    if (createdAt) {
        const t = Date.parse(createdAt);
        if (!Number.isNaN(t)) return t;
    }
    return localStartMs();
}

export const trialService = {
    TRIAL_DAYS,

    /** Seed the device-local start now (first app load) so a guest's clock begins immediately. */
    ensureStarted(): void {
        try { localStartMs(); } catch { /* ignore */ }
    },

    /** Milliseconds left in the trial (0 once it has ended). */
    msLeft(createdAt?: string | null): number {
        const endsAt = startMs(createdAt) + TRIAL_DAYS * DAY_MS;
        return Math.max(0, endsAt - Date.now());
    },

    /** Whole days left, rounded up — shows the final 24 hours as "1 يوم". */
    daysLeft(createdAt?: string | null): number {
        return Math.ceil(this.msLeft(createdAt) / DAY_MS);
    },

    isActive(createdAt?: string | null): boolean {
        return this.msLeft(createdAt) > 0;
    },

    isEnded(createdAt?: string | null): boolean {
        return this.msLeft(createdAt) <= 0;
    },
};
