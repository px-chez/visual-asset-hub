import { supabase } from '../lib/supabaseClient';
import { UserAuth } from '../context/AuthContext';

const BUCKET_NAME = 'designs';

export const useStorage = () => {
  const { profile } = UserAuth();

  const getNextVersion = async (projectId, fileName) => {
    const { data, error } = await supabase
      .from('file_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .eq('file_name', fileName)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? data.version_number + 1 : 1;
  };

  const uploadDesignFile = async (file, projectId, fileName, changeDescription = '', parentVersionId = null) => {
    if (!profile?.id) return { success: false, error: 'Пользователь не авторизован' };
    if (!file || !projectId || !fileName) return { success: false, error: 'Не указаны обязательные параметры' };

    try {
      const newVersion = await getNextVersion(projectId, fileName);
      const fileExt = file.name.split('.').pop().toLowerCase();
      const filePath = `${projectId}/${fileName}/v${newVersion}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
      if (uploadError) throw uploadError;

      const { publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      const { data: insertedVersion, error: dbError } = await supabase
        .from('file_versions')
        .insert({
          project_id: projectId,
          file_name: fileName,
          file_path: filePath,
          version_number: newVersion,
          change_description: changeDescription,
          created_by: profile.id,
          parent_version_id: parentVersionId
        })
        .select()
        .single();

      if (dbError) {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw dbError;
      }

      return { success: true, version: { ...insertedVersion, publicUrl } };
    } catch (err) {
      console.error('📦 Upload failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Ошибка загрузки' };
    }
  };

  const deleteFileVersion = async (versionId) => {
    if (!profile?.id) return { success: false, error: 'Пользователь не авторизован' };
    try {
      const { data: version, error: fetchError } = await supabase
        .from('file_versions')
        .select('file_path')
        .eq('id', versionId)
        .single();
      if (fetchError || !version) throw new Error('Версия не найдена');

      const { error: dbError } = await supabase
        .from('file_versions')
        .delete()
        .eq('id', versionId);
      if (dbError) throw dbError;

      await supabase.storage.from(BUCKET_NAME).remove([version.file_path]);
      return { success: true };
    } catch (err) {
      console.error('🗑️ Delete failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Ошибка удаления' };
    }
  };

  const getFileVersions = async (projectId, fileName, page = 1, limit = 10) => {
    if (!profile?.id) return { success: false, error: 'Пользователь не авторизован', data: [] };
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error, count } = await supabase
        .from('file_versions')
        .select(`*, creator:profiles!file_versions_created_by_fkey(full_name, avatar_url)`, { count: 'exact' })
        .eq('project_id', projectId)
        .eq('file_name', fileName)
        .order('version_number', { ascending: false })
        .range(from, to);

      if (error) throw error;
      const versionsWithUrls = (data || []).map(v => {
        const { publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(v.file_path);
        return { ...v, publicUrl };
      });
      const total = count || 0;
      return {
        success: true,
        data: versionsWithUrls,
        pagination: { page, limit, hasMore: from + limit < total }
      };
    } catch (err) {
      console.error('📋 Get versions failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Ошибка получения версий', data: [] };
    }
  };

  return { uploadDesignFile, deleteFileVersion, getFileVersions };
};