// src/components/projects/InviteModal.jsx
import { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';

const InviteModal = ({ show, onClose, projectId }) => {
  const { inviteUser } = useProjects();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const res = await inviteUser(projectId, email, role);
    setLoading(false);

    if (res.success) {
      setStatus({ type: 'success', msg: '✅ Приглашение отправлено!' });
      setTimeout(() => onClose(), 1500);
    } else {
      setStatus({ type: 'danger', msg: `❌ ${res.error}` });
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Пригласить участника</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Email пользователя</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Роль</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="viewer">👁️ Просмотр</option>
                  <option value="editor">✏️ Редактор</option>
                  <option value="admin">👑 Админ</option>
                </select>
              </div>
              {status.msg && <div className={`alert alert-${status.type} py-2`}>{status.msg}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Отправка...' : 'Пригласить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;