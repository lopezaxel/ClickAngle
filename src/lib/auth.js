import { supabase } from './supabase.js';
import { getState, setState, setActiveChannel, restoreActiveChannel } from './state.js';

export async function signIn(email, password) {
    const signInPromise = supabase.auth.signInWithPassword({ email, password });
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de autenticación (30s)')), 30000)
    );

    const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
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
    // 1. Clear local app state and ALL Supabase tokens IMMEDIATELY
    //    This prevents zombie sessions on F5 even if the server call fails
    localStorage.removeItem('clickangles_active_channel');
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase.auth')) {
            localStorage.removeItem(key);
        }
    });
    setState({ currentUser: null, session: null, activeChannelId: null, channels: [], isLoadingChannels: false });

    // 2. Fire-and-forget server-side sign out (don't block, don't throw)
    supabase.auth.signOut().catch(err => console.warn('Sign out server-side error (non-critical):', err));
}

export async function loadUserProfile(userId) {
    console.time('DB_Fetch_Profile');
    try {
        // Promise.race is the ONLY reliable timeout mechanism for Supabase queries.
        // .abortSignal() does NOT reliably cancel underlying fetches in supabase-js v2.
        const queryPromise = supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, subscription_tier, created_at')
            .eq('id', userId)
            .single();

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: Perfil (20s)')), 20000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        console.timeEnd('DB_Fetch_Profile');

        if (error) {
            // If RLS fails or profile is missing (PGRST116), don't crash.
            // Recover from Auth Session as a backup.
            if (error.code === 'PGRST116') {
                console.warn('Profile not found in DB, using session metadata backup.');
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    return {
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || 'Usuario',
                        subscription_tier: 'Free (Recuperado)'
                    };
                }
            }
            throw error;
        }
        return data;
    } catch (err) {
        console.error('Critical Profile Load Error:', err);
        throw err;
    }
}

let channelsPromise = null; // Deduplication: concurrent callers share one in-flight request

export async function loadUserChannels(userId) {
    // If already fetching, return the same promise to avoid duplicate requests
    if (channelsPromise) return channelsPromise;

    channelsPromise = (async () => {
        try {
            // Promise.race is the ONLY reliable timeout mechanism for Supabase queries.
            // .abortSignal() does NOT reliably cancel underlying fetches in supabase-js v2.
            // This guarantees we unblock after 20s regardless of Supabase cold start behavior.
            const queryPromise = Promise.all([
                supabase
                    .from('channels')
                    .select('*')
                    .eq('owner_id', userId)
                    .order('created_at', { ascending: true }),
                supabase
                    .from('channel_members')
                    .select('channel_id, role, channels(*)')
                    .eq('user_id', userId)
            ]);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout: Canales (20s)')), 20000)
            );

            const [ownedResult, membershipsResult] = await Promise.race([queryPromise, timeoutPromise]);

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

    // 1. Delete from DB (The policy should handle cascading or check ownership)
    const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId)
        .eq('owner_id', user.id); 

    if (error) throw error;

    // 2. Update local state
    const { channels, activeChannelId } = getState();
    const newChannels = channels.filter(c => c.id !== channelId);
    
    let nextActiveId = activeChannelId;
    if (activeChannelId === channelId) {
        nextActiveId = newChannels.length > 0 ? newChannels[0].id : null;
    }

    setState({ 
        channels: newChannels, 
        activeChannelId: nextActiveId 
    });

    if (nextActiveId) {
        localStorage.setItem('clickangles_active_channel', nextActiveId);
    } else {
        localStorage.removeItem('clickangles_active_channel');
    }

    return true;
}

export async function createChannel(name, niche = 'Tech/IA', imageUrl = null) {
    const { session } = getState();
    const user = session?.user;
    if (!user) throw new Error('No autenticado');

    const insertPayload = { owner_id: user.id, name, niche };
    if (imageUrl) insertPayload.image_url = imageUrl;

    const { data, error } = await supabase
        .from('channels')
        .insert(insertPayload)
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

let userDataPromise = null;

async function loadUserData(session) {
    if (!session?.user) {
        setState({ currentUser: null, session: null, channels: [], activeChannelId: null });
        return;
    }

    if (userDataPromise) return userDataPromise;

    userDataPromise = (async () => {
        try {
            const placeholderUser = {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || 'Cargando...',
                subscription_tier: '...',
            };
            setState({ currentUser: placeholderUser, session });

            // Load profile and channels in parallel but with individual catch blocks for resilience
            const [profile, channels] = await Promise.all([
                loadUserProfile(session.user.id).catch(err => {
                    console.warn('Non-critical Profile Load Error:', err);
                    return { id: session.user.id, email: session.user.email, full_name: 'Usuario (Offline)' };
                }),
                loadUserChannels(session.user.id).catch(err => {
                    console.warn('Non-critical Channel Load Error:', err);
                    return [];
                })
            ]);
            
            const activeChannelId = restoreActiveChannel(channels);
            
            setState({ 
                currentUser: profile, 
                session, 
                channels, 
                activeChannelId,
                isAuthInitializing: false,
                isLoadingChannels: false
            });
        } catch (err) {
            console.error('Error loading user data:', err);
            const isAuthError = err.message?.includes('JSON objectRequested') || 
                               err.status === 401 || 
                               err.status === 403;

            if (isAuthError) {
                await signOut();
            } else {
                setState({ session, isAuthInitializing: false, isLoadingChannels: false });
            }
        } finally {
            userDataPromise = null;
        }
    })();

    return userDataPromise;
}

export async function initAuth(onReady) {
    let resolved = false;
    const finish = () => {
        if (!resolved) {
            resolved = true;
            if (onReady) onReady();
        }
    };

    // Emergency Timeout: 12s — only unlocks the initial loading SCREEN.
    // Does NOT set isLoadingChannels: false — the hub shows its own spinner while channels load.
    // A secondary timeout at 35s total gives up and shows empty state if Supabase never responds.
    const emergencyTimeout = setTimeout(() => {
        const { isAuthInitializing } = getState();
        if (isAuthInitializing) {
            console.warn('Auth initialization slow, proceeding to unlock UI...');
            setState({ isAuthInitializing: false }); // Unlock screen — keep isLoadingChannels as-is
            finish();

            // Safety net: if channels STILL haven't loaded after 35s total, stop waiting
            setTimeout(() => {
                const { isLoadingChannels } = getState();
                if (isLoadingChannels) {
                    console.warn('Channel load timeout (35s), showing empty state');
                    setState({ isLoadingChannels: false });
                }
            }, 23000); // 12 + 23 = 35s total
        }
    }, 12000);

    // Listen for auth events IMMEDIATELY
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false, isLoadingChannels: false });
        } else if (session) {
            await loadUserData(session);
        }
        finish();
    });

    try {
        // First check if a session exists at all to avoid unnecessary errors
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!initialSession) {
            setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false, isLoadingChannels: false });
            return;
        }

        // Validate session in background — don't block the UI
        // If the token is invalid (401/403), sign out after the fact
        supabase.auth.getUser().then(({ error }) => {
            if (error && (error.status === 401 || error.status === 403)) {
                console.warn('Invalid session detected, signing out...');
                signOut();
            }
        }).catch(() => {}); // Ignore network errors — data queries will catch auth issues

        // Start loading user data IMMEDIATELY (no waiting for getUser)
        await loadUserData(initialSession);
    } catch (err) {
        // Silence the warning if it's just a missing session or expected recovery failure
        if (err.message?.includes('Auth session missing') || err.message?.includes('no session')) {
            setState({ isAuthInitializing: false, isLoadingChannels: false });
        } else {
            console.warn('InitAuth strategy fallback:', err.message);
        }
        
        if (err.message?.includes('Lock') || err.message?.includes('Abort') || err.message?.includes('Timeout')) {
            console.warn('Protocolo Experto-Supabase: Limpieza de sesion por error critico.');
            // Clear supabase storage to force fresh session
            Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
                    localStorage.removeItem(key);
                }
            });
            setTimeout(() => window.location.reload(), 500);
        } else {
            setState({ isAuthInitializing: false, isLoadingChannels: false });
        }
    } finally {
        clearTimeout(emergencyTimeout);
        // We don't force isAuthInitializing to false here if a loadUserData is still running
        // loadUserData will set it to false when it's TRULY done.
        finish();
    }
}
