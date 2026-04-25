// src/components/projects/ProjectCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext';
import { getAcceptedMembersCount, isProjectOwner, truncateText } from '../../lib/utils';
import InviteModal from './InviteModal';

const ProjectCard = ({ project, onDelete, isDeleting, onDeleteError }) => {
  const { profile } = UserAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Валидация project prop
  if (!project || typeof project !== 'object') {
    return (
      <div className="card h-100 shadow-sm border-0">
        <div className="card-body">
          <p className="text-danger">❌ Ошибка: некорректные данные проекта</p>
        </div>
      </div>
    );
  }

  const memberCount = getAcceptedMembersCount(project.members);
  const isOwner = isProjectOwner(project, profile?.id);

  const handleDelete = async () => {
    if (!onDelete || typeof onDelete !== 'function') {
      setDeleteError('Ошибка: функция удаления недоступна');
      return;
    }

    if (!window.confirm(`Вы точно хотите удалить проект "${project.name}"? Это действие необратимо.`)) {
      return;
    }

    setDeleteError('');
    try {
      await onDelete(project.id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setDeleteError(errorMsg);
      if (typeof onDeleteError === 'function') {
        onDeleteError(errorMsg);
      }
    }
  };

  return (
    <>
      <div className="card h-100 shadow-sm border-0">
        <div className="card-body d-flex flex-column">
          {/* Заголовок проекта */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h5 
              className="card-title mb-0 text-truncate" 
              style={{ maxWidth: '70%' }}
              title={project.name}
            >
              {project.name || 'Без названия'}
            </h5>
            <span className="badge bg-info text-white">
              {memberCount} 👥
            </span>
          </div>

          {/* Статус владельца */}
          {isOwner && (
            <div className="mb-2">
              <span className="badge bg-warning text-dark">👑 Владелец</span>
            </div>
          )}

          {/* Описание проекта */}
          <p className="card-text text-muted small flex-grow-1">
            {truncateText(project.description || 'Без описания', 80)}
          </p>

          {/* Ошибка удаления */}
          {deleteError && (
            <div className="alert alert-danger alert-sm py-1 mb-2" role="alert">
              <small>❌ {deleteError}</small>
            </div>
          )}

          {/* Кнопки действия */}
          <div className="d-flex gap-2 mt-3">
            <Link 
              to={`/project/${project.id}`} 
              className="btn btn-primary btn-sm flex-grow-1"
            >
              📂 Открыть
            </Link>
            <button 
              onClick={() => setShowInvite(true)} 
              className="btn btn-outline-success btn-sm"
              title="Пригласить пользователя"
            >
              ➕ Пригласить
            </button>
          </div>

          {/* Кнопка удаления только для владельца */}
          {isOwner && (
            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="btn btn-outline-danger btn-sm mt-2 w-100"
              title="Удалить проект"
            >
              {isDeleting ? '⏳ Удаление...' : '🗑️ Удалить проект'}
            </button>
          )}
        </div>
      </div>

      {/* Модальное окно приглашения */}
      <InviteModal 
        show={showInvite} 
        onClose={() => setShowInvite(false)} 
        projectId={project.id}
      />
    </>
  );
};

export default ProjectCard;