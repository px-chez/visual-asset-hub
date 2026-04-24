import React, { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import { useProjects } from '../hooks/useProjects';

const Landing = () => {
  const { session, signOut } = UserAuth();
  const { projects, loading: projectsLoading, createProject } = useProjects();
  const navigate = useNavigate();
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Автоматически выбираем первый проект при загрузке
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/signin");
    } catch (err) {
      console.error('Ошибка выхода:', err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    setIsCreating(true);
    const result = await createProject(newProjectName, 'Автоматически созданный проект');
    setIsCreating(false);
    
    if (result.success) {
      setNewProjectName('');
      // После создания проект появится в списке и выберется автоматически
    } else {
      alert('Ошибка создания проекта: ' + result.error);
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
    <div className="container py-4">
      {/* Шапка профиля */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h2 className="mb-1">🎨 DesignHub</h2>
          <p className="text-muted mb-0">Привет, <strong>{session?.user?.email}</strong></p>
        </div>
        <button onClick={handleSignOut} className="btn btn-outline-danger btn-sm">
          🚪 Выйти
        </button>
      </div>

      <div className="row g-4">
        {/* Левая колонка: Управление проектами */}
        <div className="col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">📁 Ваши проекты</h5>
            </div>
            <div className="card-body">
              <select
                className="form-select mb-3"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={projects.length === 0}
              >
                <option value="">-- Выберите проект --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <hr />
              <h6 className="small text-muted">Создать новый проект</h6>
              <form onSubmit={handleCreateProject} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Название проекта"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  className="btn btn-success btn-sm"
                  disabled={isCreating}
                >
                  {isCreating ? '...' : '+'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Правая колонка: Загрузчики */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">📤 Загрузка версий</h5>
            </div>
            <div className="card-body">
              {selectedProjectId ? (
                <div className="d-flex flex-wrap gap-4 justify-content-center">
                  <FileUploader
                    projectId={selectedProjectId}
                    fileName="desktop-layout"
                    title="🖥️ Десктопная версия"
                  />
                  <FileUploader
                    projectId={selectedProjectId}
                    fileName="mobile-layout"
                    title="📱 Мобильная версия"
                  />
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <p className="mb-0"> Сначала выберите или создайте проект</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;