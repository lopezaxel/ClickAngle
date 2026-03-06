import { supabase } from './supabase.js';
import { setState, setActiveChannel, restoreActiveChannel } from './state.js';

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState({ currentUser: null, session: null, activeChannelId: null, channels: [] });
}

export async function loadUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, subscription_tier, created_at')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}

export async function loadUserChannels(userId) {
    // Channels the user owns
    const { data: owned, error: e1 } = await supabase
        .from('channels')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });
    if (e1) throw e1;

    // Channels the user is a member of
    const { data: memberships, error: e2 } = await supabase
        .from('channel_members')
        .select('channel_id, role, channels(*)')
        .eq('user_id', userId);
    if (e2) throw e2;

    const memberChannels = (memberships || []).map(m => ({ ...m.channels, role: m.role }));
    const ownedWithRole = (owned || []).map(c => ({ ...c, role: 'owner' }));

    // Merge, avoiding duplicates
    const allChannels = [...ownedWithRole];
    memberChannels.forEach(mc => {
        if (!allChannels.find(c => c.id === mc.id)) {
            allChannels.push(mc);
        }
    });

    return allChannels;
}

export async function createChannel(name, youtubeHandle = '', niche = 'Tech/IA') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
        .from('channels')
        .insert({ owner_id: user.id, name, youtube_handle: youtubeHandle, niche })
        .select()
        .single();
    if (error) throw error;

    // Also add owner as channel_member
    await supabase.from('channel_members').insert({
        channel_id: data.id,
        user_id: user.id,
        role: 'owner'
    });

    // Reload channels
    const channels = await loadUserChannels(user.id);
    // Set channels and active channel in a single state update to avoid double re-render
    setState({ channels, activeChannelId: data.id });
    localStorage.setItem('clickangles_active_channel', data.id);

    return data;
}

async function loadUserData(session) {
    if (session?.user) {
        try {
            const profile = await loadUserProfile(session.user.id);
            const channels = await loadUserChannels(session.user.id);
            const activeChannelId = restoreActiveChannel(channels);
            setState({ currentUser: profile, session, channels, activeChannelId });
        } catch (err) {
            console.error('Error loading user data:', err);
            setState({ currentUser: null, session, channels: [], activeChannelId: null });
        }
    } else {
        setState({ currentUser: null, session: null, channels: [], activeChannelId: null });
    }
}

export async function initAuth(onReady) {
    let resolved = false;
    const finish = () => {
        if (!resolved && onReady) {
            resolved = true;
            onReady();
        }
    };

    // Listen for future auth changes (login/logout/refresh)
    supabase.auth.onAuthStateChange(async (event, session) => {
        // If we get an event, we definitely want to load data
        try {
            await loadUserData(session);
        } catch (e) {
            console.error('Auth change data load error:', e);
        }
        finish();
    });

    // Strategy: Try to get session, but don't wait forever.
    // Some browser storage locks or network issues can make getSession() hang indefinitely.
    try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth Timeout')), 3000)
        );

        // Race the session check against a 3s timeout
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);

        if (error) throw error;
        if (session) {
            await loadUserData(session);
        } else {
            // No session, just reset state
            setState({ session: null, currentUser: null, channels: [], activeChannelId: null });
        }
    } catch (err) {
        console.warn('Session init error or timeout:', err.message);

        // If it's a known "stuck" error or a timeout, clean house
        if (err.message?.includes('Lock') ||
            err.message?.includes('Abort') ||
            err.message?.includes('Timeout') ||
            err.message?.includes('Refresh Token')) {

            console.warn('Clearing potentially corrupted auth state...');
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key);
            });

            setState({ session: null, currentUser: null, channels: [], activeChannelId: null });

            // If it was a persistent lock, a reload might be the only cure
            if (!err.message.includes('Timeout')) {
                setTimeout(() => window.location.reload(), 1000);
            }
        } else {
            // General error (e.g. network), just ensure UI is unblocked
            setState({ session: null, currentUser: null });
        }
    } finally {
        // UNBLOCK THE UI - This calls initRouter in main.js
        finish();
    }
}
