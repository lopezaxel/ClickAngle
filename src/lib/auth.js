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
    // Listen for future auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        await loadUserData(session);
        if (onReady) { onReady(); onReady = null; }
    });

    // Also do an initial session check as a fallback
    // (onAuthStateChange may not fire on corrupted sessions)
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await loadUserData(session);
    } catch (err) {
        console.warn('Session recovery error:', err.message);
        // If it's a lock/abort error, clear corrupted session entirely
        if (err.message?.includes('Lock') || err.message?.includes('Abort') || err.name === 'AbortError') {
            console.warn('Clearing corrupted session...');
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) localStorage.removeItem(key);
            });
        }
        // Always reset state on error so the app doesn't stay stuck on a black screen!
        setState({ currentUser: null, session: null, channels: [], activeChannelId: null });
    }
    if (onReady) onReady();
}
