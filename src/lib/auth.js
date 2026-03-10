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

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('clickangles_active_channel');
    setState({ currentUser: null, session: null, activeChannelId: null, channels: [] });
}

export async function loadUserProfile(userId) {
    const fetchPromise = supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, subscription_tier, created_at')
        .eq('id', userId)
        .single();
    
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout cargando perfil (30s)')), 30000)
    );

    try {
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (error) {
            // If RLS fails or profile is missing (PGRST116), don't crash.
            // Try to recover from Auth Session as a backup.
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

export async function loadUserChannels(userId) {
    const channelsPromise = (async () => {
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
    })();

    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout cargando canales (45s)')), 45000)
    );

    return await Promise.race([channelsPromise, timeoutPromise]);
}

export async function deleteChannel(channelId) {
    const { data: { user } } = await supabase.auth.getUser();
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

            const [profile, channels] = await Promise.all([
                loadUserProfile(session.user.id),
                loadUserChannels(session.user.id)
            ]);

            const activeChannelId = restoreActiveChannel(channels);
            
            setState({ 
                currentUser: profile, 
                session, 
                channels, 
                activeChannelId,
                isAuthInitializing: false 
            });
        } catch (err) {
            console.error('Error loading user data:', err);
            const isAuthError = err.message?.includes('JSON objectRequested') || 
                               err.status === 401 || 
                               err.status === 403 ||
                               err.message?.includes('PGRST116');

            if (isAuthError) {
                await signOut();
            } else {
                setState({ session, isAuthInitializing: false });
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

    // Emergency Timeout: Increased to 35s to allow for the parallel loading
    const emergencyTimeout = setTimeout(() => {
        const { isAuthInitializing } = getState();
        if (isAuthInitializing) {
            console.warn('Auth initialization slow, proceeding to unlock UI...');
            setState({ isAuthInitializing: false });
            finish();
        }
    }, 35000);

    // Listen for auth events IMMEDIATELY
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth Event:', event);
        if (event === 'SIGNED_OUT') {
            setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false });
        } else if (session) {
            await loadUserData(session);
        }
        finish();
    });

    try {
        // Use getUser() instead of getSession() to force a sync check with the server
        // and ensure the internal auth client has the correct headers/tokens for RLS.
        const sessionPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('User Recovery Timeout (15s)')), 15000)
        );

        const { data: { user }, error } = await Promise.race([sessionPromise, timeoutPromise]);

        if (error) throw error;
        
        // After getUser succeeds, the client headers are guaranteed to be set correctly.
        // Now fetch full session for loadUserData.
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            await loadUserData(session);
        } else {
            console.log('No active session.');
            setState({ session: null, currentUser: null, channels: [], activeChannelId: null, isAuthInitializing: false });
        }
    } catch (err) {
        console.warn('InitAuth strategy fallback:', err.message);
        
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
            setState({ isAuthInitializing: false });
        }
    } finally {
        clearTimeout(emergencyTimeout);
        // We don't force isAuthInitializing to false here if a loadUserData is still running
        // loadUserData will set it to false when it's TRULY done.
        finish();
    }
}
