// src/hooks/useProjects.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserAuth } from '../context/AuthContext';

export const useProjects = () => {
  const { profile, session } = UserAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    if (!profile?.id) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Владелец
      const { data: owned, error: ownedErr } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', profile.id);

      if (ownedErr) throw ownedErr;

      // Участник
      const { data: members, error: membersErr } = await supabase
        .from('project_members')
        .select('project:projects (*)')
        .eq('user_id', profile.id)
        .eq('accepted', true);

      if (membersErr) throw membersErr;

      // Объединяем и удаляем дубликаты по id
      const all = [...(owned || []), ...(members || []).map(m => m.project).filter(Boolean)];
      const unique = Array.from(new Map(all.map(p => [p.id, p])).values());

      setProjects(unique);
    } catch (err) {
      console.error('❌ Fetch projects error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // Загрузка при изменении profile
  useEffect(() => {
    if (profile?.id) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [profile?.id, fetchProjects]);

  // Realtime подписки временно отключены для стабильности
  // useEffect(() => { ... }, []);  // не используется

  const createProject = async (name, description, isPublic = false) => {
    const userId = profile?.id || session?.user?.id;
    if (!userId) return { success: false, error: 'Не авторизован' };
    if (!name?.trim()) return { success: false, error: 'Имя проекта обязательно' };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          description: description?.trim() || '',
          owner_id: userId,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Добавляем создателя как админа
      await supabase.from('project_members').insert({
        project_id: data.id,
        user_id: userId,
        role: 'admin',
        accepted: true,
      });

      // Обновляем список локально
      setProjects(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Create project error:', err);
      return { success: false, error: err.message };
    }
  };

  const updateProject = async (projectId, updates) => {
    if (!profile?.id) return { success: false, error: 'Не авторизован' };

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

      if (projectError || project?.owner_id !== profile.id) {
        throw new Error('Только владелец может изменить проект');
      }

      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, ...data } : p)));
      return { success: true, data };
    } catch (err) {
      console.error('❌ Update project error:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteProject = async (projectId) => {
    if (!profile?.id) return { success: false, error: 'Не авторизован' };

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

      if (projectError || project?.owner_id !== profile.id) {
        throw new Error('Только владелец может удалить проект');
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      return { success: true };
    } catch (err) {
      console.error('❌ Delete project error:', err);
      return { success: false, error: err.message };
    }
  };

  const inviteUser = async (projectId, userEmail, role = 'viewer') => {
    if (!profile?.id) return { success: false, error: 'Не авторизован' };

    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', userEmail)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) return { success: false, error: 'Пользователь не найден' };
      if (userData.id === profile.id) return { success: false, error: 'Нельзя пригласить самого себя' };

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const isOwner = project?.owner_id === profile.id;
      if (!isOwner) return { success: false, error: 'Недостаточно прав' };

      const { error: inviteError } = await supabase
        .from('project_members')
        .upsert({
          project_id: projectId,
          user_id: userData.id,
          role,
          invited_by: profile.id,
          accepted: false,
          invited_at: new Date().toISOString(),
        }, { onConflict: 'project_id,user_id' });

      if (inviteError) throw inviteError;

      return { success: true, message: 'Приглашение отправлено' };
    } catch (err) {
      console.error('❌ Invite user error:', err);
      return { success: false, error: err.message };
    }
  };

  const acceptInvite = async (projectId) => {
    if (!profile?.id) return { success: false, error: 'Не авторизован' };

    try {
      const { error } = await supabase
        .from('project_members')
        .update({ accepted: true, accepted_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('user_id', profile.id);

      if (error) throw error;

      await fetchProjects();
      return { success: true };
    } catch (err) {
      console.error('❌ Accept invite error:', err);
      return { success: false, error: err.message };
    }
  };

  const declineInvite = async (projectId) => {
    if (!profile?.id) return { success: false, error: 'Не авторизован' };

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', profile.id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      return { success: true };
    } catch (err) {
      console.error('❌ Decline invite error:', err);
      return { success: false, error: err.message };
    }
  };

  const getProjectById = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, owner:profiles!projects_owner_id_fkey(full_name, avatar_url)`)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('❌ Get project error:', err);
      return { success: false, error: err.message };
    }
  };

  const getFileVersions = async (projectId, fileName) => {
    try {
      const { data, error } = await supabase
        .from('file_versions')
        .select(`*, creator:profiles!file_versions_created_by_fkey(full_name, avatar_url)`)
        .eq('project_id', projectId)
        .eq('file_name', fileName)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('❌ Get file versions error:', err);
      return { success: false, error: err.message, data: [] };
    }
  };

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    inviteUser,
    acceptInvite,
    declineInvite,
    getProjectById,
    getFileVersions,
  };
};