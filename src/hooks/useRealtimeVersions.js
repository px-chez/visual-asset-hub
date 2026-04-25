import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useProjectStore } from '../store/useProjectStore';

const BUCKET_NAME = 'designs';

export const useRealtimeVersions = (projectId, fileName) => {
  const { setVersions } = useProjectStore();

  useEffect(() => {
    if (!projectId || !fileName) return;

    const handleRealtimeChange = (payload) => {
      console.log('📡 Realtime event:', payload.eventType, payload.new?.file_name);
      const addPublicUrl = (version) => {
        if (!version) return null;
        const { publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(version.file_path);
        return { ...version, publicUrl };
      };

      if (payload.eventType === 'INSERT') {
        const newVersion = addPublicUrl(payload.new);
        if (newVersion) {
          setVersions(prev => {
            if (prev.some(v => v.id === newVersion.id)) return prev;
            return [newVersion, ...prev];
          });
        }
      } else if (payload.eventType === 'DELETE') {
        setVersions(prev => prev.filter(v => v.id !== payload.old.id));
      } else if (payload.eventType === 'UPDATE') {
        const updated = addPublicUrl(payload.new);
        if (updated) {
          setVersions(prev => prev.map(v => v.id === updated.id ? updated : v));
        }
      }
    };

    const channel = supabase
      .channel(`realtime-versions-${projectId}-${fileName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'file_versions',
          filter: `project_id=eq.${projectId} AND file_name=eq.${fileName}`,
        },
        handleRealtimeChange
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log('✅ Realtime subscribed');
        else if (status === 'CHANNEL_ERROR') console.error('❌ Realtime channel error:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fileName, setVersions]);
};