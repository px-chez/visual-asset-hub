import { useEffect, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useVersions } from '../../hooks/useVersions';
import { Link } from 'react-router-dom';

const VersionTimeline = ({ projectId, fileName }) => {
  const { versions, loading, pagination, setVersions, addVersions, setLoading } = useProjectStore();
  const { fetchVersions } = useVersions();
  const observerRef = useRef(null);

  // Загрузка первой страницы при изменении projectId/fileName
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await fetchVersions(projectId, fileName, 1, 10);
      if (result.success) {
        setVersions(result.data);
        useProjectStore.setState({ pagination: result.pagination });
      }
      setLoading(false);
    };
    load();
  }, [projectId, fileName, fetchVersions, setVersions, setLoading]);

  // Настройка IntersectionObserver для подгрузки следующих страниц
  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && pagination?.hasMore) {
        const nextPage = (pagination?.page) + 1;
        fetchVersions(projectId, fileName, nextPage, 10).then((result) => {
          if (result.success) {
            addVersions(result.data);
            useProjectStore.setState({ pagination: result.pagination });
          }
        });
      }
    }, { threshold: 0.1 });

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, pagination, projectId, fileName, fetchVersions, addVersions]);

  if (versions.length === 0 && !loading) {
    return <div className="alert alert-info text-center py-4">📁 Нет версий этого файла</div>;
  }

  return (
    <div className="list-group list-group-flush">
      {versions.map((v, i) => (
        <div key={v.id} className="list-group-item d-flex justify-content-between align-items-center p-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-dark rounded-pill">v{v.version_number}</span>
              <span className="fw-bold">{v.change_description || 'Изменение'}</span>
            </div>
            <small className="text-muted">
              {new Date(v.created_at).toLocaleString()} • {v.creator?.full_name}
            </small>
          </div>
          <div className="d-flex gap-2">
            {i < versions.length - 1 && (
              <Link to={`/project/${v.project_id}/diff?from=${versions[i+1].id}&to=${v.id}`}
                    className="btn btn-sm btn-outline-primary">
                🔍 Diff
              </Link>
            )}
          </div>
        </div>
      ))}
      {pagination?.hasMore && (
        <div ref={observerRef} className="py-3 text-center text-muted">
          {loading ? 'Загрузка...' : 'Прокрутите для загрузки'}
        </div>
      )}
    </div>
  );
};

export default VersionTimeline;