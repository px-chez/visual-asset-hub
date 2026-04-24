import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';

const FileUploader = ({ projectId, fileName, title = 'Загрузка файла' }) => {
  const [file, setFile] = useState(null);
  const [changeDesc, setChangeDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const { uploadDesignFile } = useStorage();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus({ type: '', message: '' });
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'warning', message: '⚠️ Выберите файл для загрузки' });
      return;
    }
    if (!projectId) {
      setStatus({ type: 'error', message: '❌ Проект не выбран' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Загружаем через наш хук (Storage + БД + версионирование)
      const result = await uploadDesignFile(file, projectId, fileName, changeDesc);

      if (result.success) {
        setStatus({ 
          type: 'success', 
          message: `✅ Версия #${result.data.version_number} успешно загружена!` 
        });
        setFile(null);
        setChangeDesc('');
        // Здесь можно вызвать обновление списка версий, если он есть на странице
      } else {
        setStatus({ type: 'error', message: `❌ Ошибка: ${result.error}` });
      }
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Неожиданная ошибка при загрузке' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-100" style={{ width: '100%', maxWidth: '400px' }}>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{title}</h5>
        <div className="mb-3">
          <label className="form-label small text-muted">Файл (PNG, JPG, SVG, Figma export)</label>
          <input
            type="file"
            className="form-control"
            accept="image/*,.svg,.pdf"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
        <div className="mb-3 flex-grow-1">
          <label className="form-label small text-muted">Что изменилось?</label>
          <textarea
            className="form-control"
            rows="3"
            placeholder="Например: изменил цвет кнопки, поправил отступы..."
            value={changeDesc}
            onChange={(e) => setChangeDesc(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="btn btn-primary mt-auto"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Загрузка...
            </>
          ) : (
            ' Загрузить версию'
          )}
        </button>
        
        {status.message && (
          <div className={`alert alert-${status.type} mt-3 mb-0 py-2 small`} role="alert">
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;