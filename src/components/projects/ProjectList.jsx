// src/components/projects/ProjectList.jsx
import ProjectCard from './ProjectCard';

const ProjectList = ({ projects = [], onDelete, deletingId, onDeleteError }) => {
  // Валидация props
  if (!Array.isArray(projects)) {
    return (
      <div className="alert alert-danger" role="alert">
        ❌ Ошибка: некорректный формат данных проектов
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <p className="mb-0">📭 Нет проектов</p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {projects.map(project => (
        <div key={project.id} className="col-md-6 col-lg-4">
          <ProjectCard
            project={project}
            onDelete={onDelete}
            isDeleting={deletingId === project.id}
            onDeleteError={onDeleteError}
          />
        </div>
      ))}
    </div>
  );
};

export default ProjectList;