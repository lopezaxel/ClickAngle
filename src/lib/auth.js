import { supabase } from './supabase.js';
import { getState, setState, setActiveChannel, restoreActiveChannel } from './state.js';

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

export function signOut() {
    localStorage.removeItem('clickangles_active_channel');
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase.auth')) {
            localStorage.removeItem(key);
        }
    });
    setState({ currentUser: null, session: null, activeChannelId: null, channels: [], isLoadingChannels: false });
    supabase.auth.signOut().catch(err => console.warn('Sign out server-side error (non-critical):', err));
}

async function fetchWithTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label} (${ms / 1000}s)`)), ms))
    ]);
}

async function fetchWithRetry(fn, label, maxAttempts = 3) {
    const delays = [0, 5000, 10000]; // immediate, 5s, 10s
    const timeout = 25000;
    let lastError;
    for (let i = 0; i < maxAttempts; i++) {
        if (delays[i] > 0) {
            console.warn(`${label}: retry ${i}/${maxAttempts - 1} in ${delays[i] / 1000}s...`);
            await new Promise(r => setTimeout(r, delays[i]));
        }
        try {
            return await fetchWithTimeout(fn(), timeout, label);
        } catch (err) {
            lastError = err;
            if (!err.message.startsWith('Timeout:')) throw err; // non-timeout errors: fail fast
        }
    }
    throw lastError;
}

export async function loadUserProfile(userId) {
    const { data, error } = await fetchWithRetry(
        () => supabase.from('profiles')
            .select('id, email, full_name, avatar_url, subscription_tier, created_at')
            .eq('id', userId)
            .single(),
        'Perfil'
    );
    if (error) {
        if (error.code === 'PGRST116') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) return { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || 'Usuario', subscription_tier: 'Free' };
        }
        throw error;
    }
    return data;
}

let channelsPromise = null;

export async function loadUserChannels(userId) {
    if (channelsPromise) return channelsPromise;

    channelsPromise = (async () => {
        try {
            const [ownedResult, membershipsResult] = await fetchWithRetry(
                () => Promise.all([
                    supabase.from('channels').select('*').eq('owner_id', userId).order('created_at', { ascending: true }),
                    supabase.from('channel_members').select('channel_id, role, channels(*)').eq('user_id', userId)
                ]),
                'Canales'
            );

            if (ownedResult.error) throw ownedResult.error;
            if (membershipsResult.error) throw membershipsResult.error;

            const memberChannels = (membershipsResult.data || []).map(m => ({ ...m.channels, role: m.role }));
            const ownedWithRole = (ownedResult.data || []).map(c => ({ ...c, role: 'owner' }));
            const allChannels = [...ownedWithRole];
            memberChannels.forEach(mc => {
                if (!allChannels.find(c => c.id === mc.id)) allChannels.push(mc);
            });
            return allChannels;
        } finally {
            channelsPromise = null;
        }
    })();

    return channelsPromise;
}

export async function reloadChannels() {
    const { session } = getState();
    const userId = session?.user?.id;
    if (!userId) return;

    setState({ isLoadingChannels: true });
    try {
        const channels = await loadUserChannels(userId);
        const activeChannelId = restoreActiveChannel(channels);
        setState({ channels, activeChannelId, isLoadingChannels: false });
    } catch (err) {
        console.error('reloadChannels error:', err);
        setState({ isLoadingChannels: false });
    }
}

export async function deleteChannel(channelId) {
    const { session } = getState();
    const user = session?.user;
    if (!user) throw new Error('No autenticado');

    const { error } = await supabase.from('channels').delete().eq('id', channelId).eq('owner_id', user.id);
    if (error) throw error;

    const { channels, activeChannelId } = getState();
    const newChannels = channels.filter(c => c.id !== channelId);
    let nextActiveId = activeChannelId === channelId ? (newChannels.length > 0 ? newChannels[0].id : null) : activeChannelId;

    setState({ channels: newChannels, activeChannelId: nextActiveId });
    if (nextActiveId) localStorage.setItem('clickangles_active_channel', nextActiveId);
    else localStorage.removeItem('clickangles_active_channel');
    return true;
}

export async function createChannel(name, niche = 'Tech/IA', imageUrl = null) {
    const { session } = getState();
    const user = session?.user;
    if (!user) throw new Error('No autenticado');

    const insertPayload = { owner_id: user.id, name, niche };
    if (imageUrl) insertPayload.image_url = imageUrl;

    const { data, error } = await supabase.from('channels').insert(insertPayload).select().single();
    if (error) throw error;

    await supabase.from('channel_members').insert({ channel_id: data.id, user_id: user.id, role: 'owner' });

    const channels = await loadUserChannels(user.id);
    setState({ channels, activeChannelId: data.id });
    localStorage.setItem('clickangles_active_channel', data.id);
    return data;
}

// --- Guard: tracks the userId currently being loaded to prevent duplicate/loop calls ---
let loadingUserId = null;

async function loadUserData(session) {
    if (!session?.user) {
        setState({ currentUser: null, session: null, channels: [], activeChannelId: null });
        return;
    }

    const userId = session.user.id;

    // If we're already loading data for this user, skip — prevents the _recoverAndRefresh loop
    if (loadingUserId === userId) return;
    loadingUserId = userId;

    try {
        setState({
            currentUser: {
                id: userId,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'Cargando...',
                subscription_tier: '...',
            },
            session
        });

        const [profile, channels] = await Promise.all([
            loadUserProfile(userId).catch(err => {
                console.warn('Profile load failed (non-critical):', err.message);
                return { id: userId, email: session.user.email, full_name: session.user.user_metadata?.full_name || 'Usuario' };
            }),
            loadUserChannels(userId).catch(err => {
                console.warn('Channels load failed (non-critical):', err.message);
                return [];
            })
        ]);

        let activeChannelId = restoreActiveChannel(channels);
        if (!activeChannelId) {
            // Fallback: recover from localStorage so Brand Kit doesn't show "Selecciona un canal"
            const saved = localStorage.getItem('clickangles_active_channel');
            if (saved) activeChannelId = saved;
        }

        setState({
            currentUser: profile,
            session,
            channels,
            activeChannelId,
            isAuthInitializing: false,
            isLoadingChannels: false
        });
    } catch (err) {
        console.error('loadUserData critical error:', err);
        setState({ session, isAuthInitializing: false, isLoadingChannels: false });
    } finally {
        loadingUserId = null;
    }
}

export async function initAuth(onReady) {
    let resolved = false;
    const finish = () => {
        if (!resolved) { resolved = true; if (onReady) onReady(); }
    };

    // Emergency unlock: give retries time to complete (3 attempts × 25s + delays = ~75s max)
    // but unlock UI early at 60s if still stuck
    const emergencyTimeout = setTimeout(() => {
        const { isAuthInitializing } = getState();
        if (isAuthInitializing) {
            console.warn('Auth initialization timeout, unlocking UI...');
            setState({ isAuthInitializing: false, isLoadingChannels: false });
            finish();
        }
    }, 60000);

    // onAuthStateChange handles TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT, etc.
    // We only act on SIGNED_OUT here — initial load is handled by getSession() below
    // to avoid the double-call bug (getSession + onAuthStateChange both firing on startup)
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            loadingUserId = null;
            setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false, isLoadingChannels: false });
            finish();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // TOKEN_REFRESHED fires every ~60min — only reload if we don't have channels yet
            const { channels } = getState();
            if (session && channels.length === 0) {
                await loadUserData(session);
            } else if (session) {
                // Just update the session token silently
                setState({ session });
            }
            finish();
        }
    });

    try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!initialSession) {
            setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false, isLoadingChannels: false });
            finish();
            return;
        }

        // Load user data once from the initial session
        await loadUserData(initialSession);
    } catch (err) {
        console.warn('initAuth error:', err.message);
        setState({ isAuthInitializing: false, isLoadingChannels: false });
    } finally {
        clearTimeout(emergencyTimeout);
        finish();
    }
}
