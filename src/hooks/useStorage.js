// src/hooks/useStorage.js
import { supabase } from '../lib/supabaseClient';
import { UserAuth } from '../context/AuthContext';

const BUCKET_NAME = 'designs';

export const useStorage = () => {
  const { profile } = UserAuth();

  /**
   * Загрузка новой версии файла
   */
  const uploadDesignFile = async (file, projectId, fileName, changeDescription = '', parentVersionId = null) => {
    if (!profile?.id) return { success: false, error: 'Пользователь не авторизован' };
    if (!file || !projectId || !fileName) return { success: false, error: 'Не указаны обязательные параметры' };

    try {
      // 1️⃣ Определяем следующий номер версии
      const { data: versionData, error: versionError } = await supabase
        .from('file_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .eq('file_name', fileName)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (versionError) throw versionError;
      const newVersion = versionData ? versionData.version_number + 1 : 1;

      // 2️⃣ Формируем путь в Storage
      const fileExt = file.name.split('.').pop().toLowerCase();
      const filePath = `${projectId}/${fileName}/v${newVersion}.${fileExt}`;

      // 3️⃣ Загружаем в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // 4️⃣ Получаем публичную ссылку
      const { publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // 5️⃣ Сохраняем метаданные в БД
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

      // 🔄 Откат: если запись в БД не создалась, удаляем файл из Storage
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

  /**
   * Удаление версии файла (БД + Storage)
   */
  const deleteFileVersion = async (versionId) => {
    if (!profile?.id) return { success: false, error: 'Пользователь не авторизован' };

    try {
      // Получаем путь к файлу перед удалением
      const { data: version, error: fetchError } = await supabase
        .from('file_versions')
        .select('file_path')
        .eq('id', versionId)
        .single();

      if (fetchError || !version) throw new Error('Версия не найдена');

      // Удаляем запись из БД
      const { error: dbError } = await supabase
        .from('file_versions')
        .delete()
        .eq('id', versionId);

      if (dbError) throw dbError;

      // Удаляем файл из Storage
      await supabase.storage.from(BUCKET_NAME).remove([version.file_path]);

      return { success: true };
    } catch (err) {
      console.error('🗑️ Delete failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Ошибка удаления' };
    }
  };

  /**
   * Получение всех версий для файла в проекте
   */
  const getFileVersions = async (projectId, fileName) => {
    if (!profile?.id) return { success: false, error: 'Пользователь не авторизован', data: [] };

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

      // Добавляем публичные ссылки к каждой версии
      const versionsWithUrls = (data || []).map(v => {
        const { publicUrl } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(v.file_path);
        return { ...v, publicUrl };
      });

      return { success: true, data: versionsWithUrls };
    } catch (err) {
      console.error('📋 Get versions failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Ошибка получения версий', data: [] };
    }
  };

  return { uploadDesignFile, deleteFileVersion, getFileVersions };
};