// hooks/useProjects.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserAuth } from '../context/AuthContext';

export const useProjects = () => {
  const { profile } = UserAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка проектов — обернули в useCallback
  const fetchProjects = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Сначала получаем проекты, где пользователь — владелец
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select(`
          *,
          owner:profiles!projects_owner_id_fkey(full_name, avatar_url)
        `)
        .eq('owner_id', profile.id)
        .order('updated_at', { ascending: false });
      
      if (ownedError) throw ownedError;
      
      // Затем — проекты, где пользователь участник
      const { data: memberProjects, error: memberError } = await supabase
        .from('project_members')
        .select(`
          project:projects (
            *,
            owner:profiles!projects_owner_id_fkey(full_name, avatar_url),
            members:project_members(
              user:profiles!project_members_user_id_fkey(full_name, avatar_url),
              role
            )
          )
        `)
        .eq('user_id', profile.id)
        .eq('accepted', true);
      
      if (memberError) throw memberError;
      
      // Объединяем и дедуплицируем
      const allProjects = [
        ...(ownedProjects || []),
        ...(memberProjects || []).map(m => m.project)
      ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      setProjects(allProjects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // Создание проекта
  const createProject = async (name, description, isPublic = false) => {
    if (!profile?.id) throw new Error('Not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          owner_id: profile.id,
          is_public: isPublic
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Добавляем создателя как админа проекта
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: data.id,
          user_id: profile.id,
          role: 'admin',
          accepted: true
        });
      
      if (memberError) throw memberError;
      
      await fetchProjects();
      return { success: true, data };
    } catch (err) {
      console.error('Create project error:', err);
      return { success: false, error: err.message };
    }
  };

  // Приглашение участника
  const inviteUser = async (projectId, userEmail, role = 'viewer') => {
    if (!profile?.id) return { success: false, error: 'Not authenticated' };
    
    try {
      // Находим пользователя по email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', userEmail)
        .maybeSingle(); // ← maybeSingle() вместо single() для обработки "не найдено"
      
      if (userError) throw userError;
      if (!userData) return { success: false, error: 'Пользователь не найден' };
      if (userData.id === profile.id) return { success: false, error: 'Нельзя пригласить самого себя' };

      // Проверяем права приглашающего
      const { data: membership, error: membershipError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (membershipError) throw membershipError;
      
      // Проверяем, является ли пользователь владельцем проекта
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      const isAdmin = membership?.role === 'admin' || project?.owner_id === profile.id;
      if (!isAdmin) return { success: false, error: 'Недостаточно прав' };

      // Создаём/обновляем приглашение
      const { error: inviteError } = await supabase
        .from('project_members')
        .upsert({
          project_id: projectId,
          user_id: userData.id,
          role,
          invited_by: profile.id,
          accepted: false,
          invited_at: new Date()
        }, { onConflict: 'project_id,user_id' });
      
      if (inviteError) throw inviteError;
      
      return { success: true, message: 'Приглашение отправлено' };
    } catch (err) {
      console.error('Invite user error:', err);
      return { success: false, error: err.message };
    }
  };

  // Принятие приглашения
  const acceptInvite = async (projectId) => {
    if (!profile?.id) return { success: false, error: 'Not authenticated' };
    
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ 
          accepted: true,
          accepted_at: new Date()
        })
        .eq('project_id', projectId)
        .eq('user_id', profile.id);
      
      if (error) throw error;
      
      await fetchProjects();
      return { success: true };
    } catch (err) {
      console.error('Accept invite error:', err);
      return { success: false, error: err.message };
    }
  };

  // Отклонение приглашения (добавил для полноты)
  const declineInvite = async (projectId) => {
    if (!profile?.id) return { success: false, error: 'Not authenticated' };
    
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', profile.id);
      
      if (error) throw error;
      
      await fetchProjects();
      return { success: true };
    } catch (err) {
      console.error('Decline invite error:', err);
      return { success: false, error: err.message };
    }
  };

  // Загрузка версий файла для проекта
  const getFileVersions = async (projectId, fileName) => {
    try {
      const { data, error } = await supabase
        .from('file_versions')
        .select(`
          *,
          creator:profiles!file_versions_created_by_fkey(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .eq('file_name', fileName)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Get file versions error:', err);
      return { success: false, error: err.message, data: [] };
    }
  };

  // Загрузка одного проекта по ID
  const getProjectById = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:profiles!projects_owner_id_fkey(full_name, avatar_url),
          members:project_members(
            user:profiles!project_members_user_id_fkey(full_name, avatar_url, email),
            role,
            accepted
          )
        `)
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Get project error:', err);
      return { success: false, error: err.message };
    }
  };

  // Обновление проекта
  const updateProject = async (projectId, updates) => {
    if (!profile?.id) throw new Error('Not authenticated');
    
    try {
      // Проверяем права
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();
      
      if (project?.owner_id !== profile.id) {
        throw new Error('Only owner can update project');
      }
      
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchProjects();
      return { success: true, data };
    } catch (err) {
      console.error('Update project error:', err);
      return { success: false, error: err.message };
    }
  };

  // Удаление проекта (только владелец)
  const deleteProject = async (projectId) => {
    if (!profile?.id) throw new Error('Not authenticated');
    
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();
      
      if (project?.owner_id !== profile.id) {
        throw new Error('Only owner can delete project');
      }
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      
      await fetchProjects();
      return { success: true };
    } catch (err) {
      console.error('Delete project error:', err);
      return { success: false, error: err.message };
    }
  };

  // Авто-загрузка при изменении профиля
  useEffect(() => {
    if (profile?.id) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [profile?.id, fetchProjects]);

  // Подписка на изменения в реальном времени (опционально)
  useEffect(() => {
    if (!profile?.id) return;
    
    const channel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `owner_id=eq.${profile.id}`
        },
        () => fetchProjects()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `user_id=eq.${profile.id}`
        },
        () => fetchProjects()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchProjects]);

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
    getFileVersions,
    getProjectById
  };
};