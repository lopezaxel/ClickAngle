// Global application state with pub/sub pattern
const state = {
    currentUser: null,      // profiles row
    session: null,          // supabase auth session
    activeChannelId: null,  // currently selected channel UUID
    channels: [],           // user's channels list
    subscription: undefined, // null = no subscription, undefined = still loading, object = loaded
    apiKeyStatus: 'not_connected', // 'connected', 'not_connected', 'disconnected'
    isAuthInitializing: true, // true while Supabase recovers session
    isLoadingChannels: true,  // true while channels haven't been fetched yet
};

const listeners = new Set();

export function getState() {
    return state;
}

export function setState(partial) {
    Object.assign(state, partial);
    listeners.forEach(fn => fn(state));
}

export function setActiveChannel(channelId) {
    state.activeChannelId = channelId;
    localStorage.setItem('clickangles_active_channel', channelId || '');
    listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

// Restore last active channel from localStorage
export function restoreActiveChannel(channels) {
    const saved = localStorage.getItem('clickangles_active_channel');
    if (saved && channels.find(c => c.id === saved)) {
        return saved;
    }
    return channels.length > 0 ? channels[0].id : null;
}
