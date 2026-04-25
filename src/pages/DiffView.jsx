import { useSearchParams, Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import VersionDiff from '../components/versions/VersionDiff';

const BUCKET_NAME = 'designs';

const DiffView = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  const [oldVersion, setOldVersion] = useState(null);
  const [newVersion, setNewVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fromId || !toId) {
      setError('Не указаны версии для сравнения');
      setLoading(false);
      return;
    }

    const fetchVersions = async () => {
      try {
        const fetchOne = async (id) => {
          const { data, error } = await supabase
            .from('file_versions')
            .select(`*, creator:profiles!file_versions_created_by_fkey(full_name, avatar_url)`)
            .eq('id', id)
            .single();
          if (error) throw error;
          const { publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.file_path);
          return { ...data, publicUrl };
        };

        const [oldData, newData] = await Promise.all([fetchOne(fromId), fetchOne(toId)]);
        setOldVersion(oldData);
        setNewVersion(newData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [fromId, toId]);

  if (loading) return <div className="text-center py-5">⏳ Загрузка версий...</div>;
  if (error) return <div className="alert alert-danger m-3">❌ {error}</div>;
  if (!oldVersion || !newVersion) return <div className="alert alert-warning">Версии не найдены</div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Сравнение: v{oldVersion.version_number} → v{newVersion.version_number}</h4>
        <Link to={`/project/${projectId}`} className="btn btn-outline-secondary">
          ← Вернуться к проекту
        </Link>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Старая версия (v{oldVersion.version_number})</div>
            <div className="card-body">
              <p>{oldVersion.change_description || 'Без описания'}</p>
              <small className="text-muted">{new Date(oldVersion.created_at).toLocaleString()}</small>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Новая версия (v{newVersion.version_number})</div>
            <div className="card-body">
              <p>{newVersion.change_description || 'Без описания'}</p>
              <small className="text-muted">{new Date(newVersion.created_at).toLocaleString()}</small>
            </div>
          </div>
        </div>
      </div>

      <VersionDiff oldUrl={oldVersion.publicUrl} newUrl={newVersion.publicUrl} />
    </div>
  );
};

export default DiffView;