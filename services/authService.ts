import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile } from '../types';

export const authService = {
    isConfigured: () => isSupabaseConfigured(),

    signUp: async (email: string, password: string, name: string) => {
        if (!supabase) throw new Error("Supabase not configured");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    avatar_url: '',
                },
            },
        });

        if (error) throw error;
        return data;
    },

    signIn: async (email: string, password: string) => {
        if (!supabase) throw new Error("Supabase not configured");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    signOut: async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    getCurrentUser: async (): Promise<UserProfile | null> => {
        if (!supabase) return null;

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) return null;

        const { user } = session;

        // Fetch additional profile data if needed, or construct from metadata
        // For simplicity, we assume metadata has everything we need initially, 
        // but typically you'd fetch from a 'profiles' table.

        // Check if we have a local profile sync
        // In a real app, you'd fetch from 'profiles' table here.
        // For now, we return a basic profile structure that matches UserProfile interface

        return {
            name: user.user_metadata.full_name || emailToName(user.email || ''),
            email: user.email || '',
            level: user.user_metadata.level || 1,
            xp: user.user_metadata.xp || 0,
            streak: user.user_metadata.streak || 0,
            badges: user.user_metadata.badges || []
        };
    },

    onAuthStateChange: (callback: (user: UserProfile | null) => void) => {
        if (!supabase) return { data: { subscription: { unsubscribe: () => { } } } };

        return supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const user = session.user;
                callback({
                    name: user.user_metadata.full_name || emailToName(user.email || ''),
                    email: user.email || '',
                    level: user.user_metadata.level || 1,
                    xp: user.user_metadata.xp || 0,
                    streak: user.user_metadata.streak || 0,
                    badges: user.user_metadata.badges || []
                });
            } else {
                callback(null);
            }
        });
    }
};

const emailToName = (email: string) => email.split('@')[0];
