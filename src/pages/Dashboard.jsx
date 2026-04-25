import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { UserAuth } from '../context/AuthContext';
import ProjectList from '../components/projects/ProjectList';

const Dashboard = () => {
  const { profile, session } = UserAuth();
  const { projects, loading: projectsLoading, createProject, deleteProject, error: projectsError } = useProjects();

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setCreateError('Название проекта обязательно');
      return;
    }
    setIsCreating(true);
    setCreateError('');
    try {
      const result = await createProject(newProjectName.trim(), newProjectDesc.trim());
      if (result.success) {
        setNewProjectName('');
        setNewProjectDesc('');
      } else {
        setCreateError(result.error || 'Ошибка создания проекта');
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    setDeletingId(projectId);
    setDeleteError('');
    try {
      const result = await deleteProject(projectId);
      if (!result.success) setDeleteError(result.error || 'Ошибка удаления проекта');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setDeletingId(null);
    }
  };

  if (projectsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h1 className="mb-1">🎨 DesignHub</h1>
          <p className="text-muted mb-0">
            Привет, <strong>{profile?.full_name || session?.user?.email}</strong>
          </p>
        </div>
      </div>

      {projectsError && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          ⚠️ {projectsError}
          <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
        </div>
      )}
      {deleteError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          ❌ {deleteError}
          <button type="button" className="btn-close" onClick={() => setDeleteError('')}></button>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">➕ Новый проект</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateProject}>
                <div className="mb-3">
                  <label className="form-label small">Название</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="например, Дизайн сайта"
                    value={newProjectName}
                    onChange={(e) => { setNewProjectName(e.target.value); if (createError) setCreateError(''); }}
                    disabled={isCreating}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small">Описание (опционально)</label>
                  <textarea
                    className="form-control form-control-sm"
                    placeholder="Описание проекта"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    disabled={isCreating}
                    rows="3"
                  />
                </div>
                {createError && (
                  <div className="alert alert-danger alert-sm py-2 mb-3" role="alert">
                    <small>{createError}</small>
                  </div>
                )}
                <button type="submit" className="btn btn-success btn-sm w-100" disabled={isCreating}>
                  {isCreating ? '⏳ Создание...' : '✅ Создать проект'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">📂 Мои проекты ({projects.length})</h5>
            </div>
            <div className="card-body">
              {projects.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0">📭 У вас ещё нет проектов</p>
                  <small>Создайте первый проект, чтобы начать работу</small>
                </div>
              ) : (
                <ProjectList
                  projects={projects}
                  onDelete={handleDeleteProject}
                  deletingId={deletingId}
                  onDeleteError={setDeleteError}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;