import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useProjectStore } from '../store/useProjectStore';
import { useRealtimeVersions } from '../hooks/useRealtimeVersions';
import { useVersions } from '../hooks/useVersions';
import FileUploader from '../components/FileUploader';
import VersionTimeline from '../components/versions/VersionTimeline';
import VersionDiff from '../components/versions/VersionDiff';

const ProjectView = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const fromId = searchParams.get('from');
  const toId = searchParams.get('to');

  const { getProjectById } = useProjects();
  const { versions, loading: verLoading } = useProjectStore();
  const { fetchVersions } = useVersions();
  
  const [project, setProject] = useState(null);
  const [projLoading, setProjLoading] = useState(true);
  const [projError, setProjError] = useState('');
  const [activeFile, setActiveFile] = useState('desktop-layout');

  useRealtimeVersions(projectId, activeFile);

  useEffect(() => {
    const loadProject = async () => {
      setProjLoading(true);
      setProjError('');
      try {
        const res = await getProjectById(projectId);
        if (res.success) setProject(res.data);
        else setProjError(res.error || 'Не удалось загрузить проект');
      } catch (err) {
        setProjError(err instanceof Error ? err.message : 'Ошибка загрузки проекта');
      } finally {
        setProjLoading(false);
      }
    };
    loadProject();
    return () => useProjectStore.getState().resetProject?.(); // сброс при уходе
  }, [projectId, getProjectById]);

  useEffect(() => {
    fetchVersions(projectId, activeFile, 1, 10);
  }, [projectId, activeFile, fetchVersions]);

  if (projLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }
  if (projError) return <div className="alert alert-danger">{projError}</div>;
  if (!project) return <div className="alert alert-danger">Проект не найден</div>;

  const diffOld = versions.find(v => v.id === fromId);
  const diffNew = versions.find(v => v.id === toId);

  return (
    <div className="container py-4">
      <Link to="/main" className="btn btn-outline-secondary mb-3">← Назад к проектам</Link>
      <h2 className="mb-1">{project.name}</h2>
      <p className="text-muted mb-4">{project.description}</p>

      <div className="btn-group mb-4">
        {['desktop-layout', 'mobile-layout', 'logo', 'icons'].map(f => (
          <button
            key={f}
            onClick={() => setActiveFile(f)}
            className={`btn btn-sm ${activeFile === f ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <FileUploader
            projectId={projectId}
            fileName={activeFile}
            title={`Загрузить ${activeFile}`}
          />
        </div>
        <div className="col-lg-8">
          <h5 className="mb-3">История версий</h5>
          {fromId && toId && diffOld && diffNew ? (
            <VersionDiff oldUrl={diffOld.publicUrl} newUrl={diffNew.publicUrl} />
          ) : (
            <VersionTimeline projectId={projectId} fileName={activeFile} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectView;