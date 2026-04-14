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
        if (key.startsWith('sb-') || key.includes('supabase.auth') || key.startsWith('ca_cache_v')) {
            localStorage.removeItem(key);
        }
    });
    setState({ currentUser: null, session: null, activeChannelId: null, channels: [], isLoadingChannels: false });
    supabase.auth.signOut().catch(err => console.warn('Sign out server-side error (non-critical):', err));
}

// --- User data cache (stale-while-revalidate) ---
// Cache key is scoped per userId so users never see each other's data.
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheKey(userId) {
    return `ca_cache_v${CACHE_VERSION}_${userId}`;
}

function loadFromCache(userId) {
    try {
        const raw = localStorage.getItem(getCacheKey(userId));
        if (!raw) return null;
        const cached = JSON.parse(raw);
        // Double-check userId matches (safety guard)
        if (cached.userId !== userId) return null;
        // Expire stale entries
        if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
            localStorage.removeItem(getCacheKey(userId));
            return null;
        }
        return cached;
    } catch (e) {
        return null;
    }
}

function saveToCache(userId, profile, channels, subscription) {
    try {
        localStorage.setItem(getCacheKey(userId), JSON.stringify({
            userId,
            timestamp: Date.now(),
            profile,
            channels,
            subscription,
        }));
    } catch (e) {
        // Ignore quota errors silently
    }
}
// --- End cache ---

async function fetchWithTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label} (${ms / 1000}s)`)), ms))
    ]);
}

async function fetchWithRetry(fn, label, maxAttempts = 3) {
    const delays = [0, 1000, 2000]; // Pro plan: mucho más rápido que Free (era 5s/10s)
    const timeout = 15000;         // Pro plan: 15s es suficiente (era 25s en Free)
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
            .select('id, email, full_name, avatar_url, subscription_tier, role, created_at')
            .eq('id', userId)
            .single(),
        'Perfil'
    );
    if (error) {
        if (error.code === 'PGRST116') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) return { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || 'Usuario', subscription_tier: 'Free', role: 'user' };
        }
        throw error;
    }
    return data;
}

export async function loadUserSubscription(userId) {
    const { data, error } = await fetchWithRetry(
        () => supabase
            .from('subscriptions')
            .select('status, duration_type, start_date, end_date, block_date')
            .eq('user_id', userId)
            .single(),
        'Suscripción'
    );
    if (error && error.code !== 'PGRST116') {
        console.warn('Subscription load error:', error.message);
        return null;
    }
    return data || null;
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
        // --- CACHE-FIRST: show the app instantly if cached data exists ---
        // The Supabase client lock can delay API queries 30-35s on cold load.
        // Serving cached data first eliminates the black screen entirely.
        // Fresh data is always fetched below and will silently update the UI.
        const cached = loadFromCache(userId);
        if (cached) {
            const cachedActiveId = restoreActiveChannel(cached.channels)
                || localStorage.getItem('clickangles_active_channel');
            setState({
                currentUser: cached.profile,
                session,
                channels: cached.channels,
                activeChannelId: cachedActiveId,
                subscription: cached.subscription,
                isAuthInitializing: false,
                isLoadingChannels: false,
            });
        } else {
            // No cache yet — show a minimal placeholder so the loading screen
            // transitions to the layout while data is fetched.
            setState({
                currentUser: {
                    id: userId,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || 'Cargando...',
                    subscription_tier: '...',
                },
                session,
            });
        }
        // --- END CACHE-FIRST ---

        // Always fetch fresh data from Supabase (runs in background if cache hit).
        const [profile, channels, subscription] = await Promise.all([
            loadUserProfile(userId).catch(err => {
                console.warn('Profile load failed (non-critical):', err.message);
                return cached?.profile || { id: userId, email: session.user.email, full_name: session.user.user_metadata?.full_name || 'Usuario', role: 'user' };
            }),
            loadUserChannels(userId).catch(err => {
                console.warn('Channels load failed (non-critical):', err.message);
                return cached?.channels || [];
            }),
            loadUserSubscription(userId).catch(err => {
                console.warn('Subscription load failed (non-critical):', err.message);
                return cached?.subscription || { status: 'load_error' };
            })
        ]);

        // Persist fresh data so the next F5 is instant too.
        saveToCache(userId, profile, channels, subscription);

        let activeChannelId = restoreActiveChannel(channels);
        if (!activeChannelId) {
            const saved = localStorage.getItem('clickangles_active_channel');
            if (saved) activeChannelId = saved;
        }

        setState({
            currentUser: profile,
            session,
            channels,
            activeChannelId,
            subscription,
            isAuthInitializing: false,
            isLoadingChannels: false,
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

    // Emergency unlock: dispara DESPUÉS de que los 3 reintentos tengan tiempo de completarse
    // Peor caso: intento1 (15s) + delay (1s) + intento2 (15s) + delay (2s) + intento3 (15s) = ~48s
    // 35s es un punto de corte razonable: si en 35s no hubo respuesta, algo grave pasó
    const emergencyTimeout = setTimeout(() => {
        const { isAuthInitializing, session } = getState();
        if (isAuthInitializing) {
            console.warn('Auth initialization timeout, unlocking UI...');
            // If we timed out and have no valid session, force to login
            if (!session) {
                setState({ isAuthInitializing: false, isLoadingChannels: false, session: null, currentUser: null });
            } else {
                // Only release the auth gate — channels loading has its own lifecycle
                setState({ isAuthInitializing: false });
            }
            finish();
        }
    }, 35000);

    // onAuthStateChange handles TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT, etc.
    // TOKEN_REFRESHED and SIGNED_IN are handled separately:
    // - TOKEN_REFRESHED: fired by Supabase's internal _recoverAndRefresh on startup.
    //   Awaiting loadUserData here blocks _recoverAndRefresh, which blocks getSession(),
    //   creating a deadlock where all DB queries hang until timeout. Just update the
    //   session token and let getSession() below handle the initial data load.
    // - SIGNED_IN: fired on actual user logins, safe to load data here.
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            loadingUserId = null;
            setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false, isLoadingChannels: false });
            finish();
        } else if (event === 'TOKEN_REFRESHED') {
            // Only update the session token — data loading is handled by getSession() below.
            if (session) setState({ session });
            finish();
        } else if (event === 'SIGNED_IN') {
            // Fires on actual user logins (not startup token refresh).
            const { channels } = getState();
            if (session && channels.length === 0) {
                await loadUserData(session);
            } else if (session) {
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

        // Validate session: if the access token is expired, try to refresh it.
        // getSession() can return a stale session from localStorage even when
        // the refresh token is invalid (400: Refresh Token Not Found).
        // We must verify the session is actually usable before loading data.
        const expiresAt = initialSession.expires_at; // unix seconds
        const now = Math.floor(Date.now() / 1000);
        const isExpired = expiresAt && now >= expiresAt;

        if (isExpired) {
            console.warn('Session expired on load, attempting refresh...');
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError || !refreshedSession) {
                // Refresh token is invalid — clean up and force login
                console.warn('Refresh token invalid, clearing session:', refreshError?.message);
                // Clear stale auth data from localStorage
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') || key.includes('supabase.auth')) {
                        localStorage.removeItem(key);
                    }
                });
                setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false, isLoadingChannels: false });
                finish();
                return;
            }

            // Refresh succeeded — use the new session
            await loadUserData(refreshedSession);
        } else {
            // Session is still valid — load user data
            await loadUserData(initialSession);
        }
    } catch (err) {
        console.warn('initAuth error:', err.message);
        // On any critical auth error, clean up and go to login
        setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false, isLoadingChannels: false });
    } finally {
        clearTimeout(emergencyTimeout);
        finish();
    }
}
