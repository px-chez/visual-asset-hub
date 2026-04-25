import { Link } from 'react-router-dom';

const VersionList = ({ versions, loading, error }) => {
  if (loading) return <div className="text-center py-3">Загрузка версий...</div>;
  if (error) return <div className="alert alert-danger">❌ {error}</div>;
  if (versions.length === 0) return <p className="text-muted text-center">Версий пока нет</p>;

  return (
    <div className="list-group">
      {versions.map((v, idx) => (
        <div key={v.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary">v{v.version_number}</span>
              <strong>{v.file_name}</strong>
            </div>
            <small className="text-muted">
              {v.change_description || 'Без описания'} • {new Date(v.created_at).toLocaleString()}
            </small>
            <div className="mt-1 small text-secondary">
              Автор: {v.creator?.full_name || v.created_by}
            </div>
          </div>
          <div className="d-flex gap-2">
            {idx < versions.length - 1 && (
              <Link 
                to={`/project/${v.project_id}/diff?from=${versions[idx+1].id}&to=${v.id}`}
                className="btn btn-sm btn-outline-info"
              >
                🔍 Diff
              </Link>
            )}
            <a href={v.publicUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
              ⬇️ Скачать
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VersionList;