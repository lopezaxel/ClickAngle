import { supabase } from './supabase.js';
import { getState, setState } from './state.js';

const STORAGE_KEY = (channelId) => `clickangles_active_project_${channelId}`;

export async function loadChannelProjects(channelId) {
  if (!channelId) return;
  setState({ isLoadingProjects: true });
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, status, created_at, logic_dna')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const projects = data || [];
    const savedId = localStorage.getItem(STORAGE_KEY(channelId));
    const activeProjectId = (savedId && projects.find(p => p.id === savedId))
      ? savedId
      : (projects[0]?.id || null);

    setState({ projects, activeProjectId, isLoadingProjects: false });
  } catch (err) {
    console.error('loadChannelProjects error:', err);
    setState({ projects: [], activeProjectId: null, isLoadingProjects: false });
  }
}

export async function createProject(channelId, title) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ channel_id: channelId, title: title.trim(), status: 'draft' })
    .select('id, title, status, created_at, logic_dna')
    .single();

  if (error) throw error;

  const { projects } = getState();
  setState({ projects: [data, ...projects], activeProjectId: data.id });
  localStorage.setItem(STORAGE_KEY(channelId), data.id);
  return data;
}

export function setActiveProject(projectId) {
  const { activeChannelId } = getState();
  setState({ activeProjectId: projectId });
  if (activeChannelId && projectId) {
    localStorage.setItem(STORAGE_KEY(activeChannelId), projectId);
  }
}

export async function updateProjectLogicDna(projectId, logicDna) {
  const { error } = await supabase
    .from('projects')
    .update({ logic_dna: logicDna })
    .eq('id', projectId);

  if (error) throw error;

  const { projects } = getState();
  setState({
    projects: projects.map(p => p.id === projectId ? { ...p, logic_dna: logicDna } : p),
  });
}

export async function updateProjectFull(projectId, updates) {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId);

  if (error) throw error;

  const { projects } = getState();
  setState({
    projects: projects.map(p => p.id === projectId ? { ...p, ...updates } : p),
  });
}

export function getActiveProject() {
  const { projects, activeProjectId } = getState();
  return projects.find(p => p.id === activeProjectId) || null;
}
