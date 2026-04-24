// components/versions/VersionDiff.jsx
import { useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import pixelmatch from 'pixelmatch';

const VersionDiff = ({ oldImageUrl, newImageUrl, width = 800, height = 600 }) => {
  const [diffMode, setDiffMode] = useState('slider'); // 'slider' | 'fade' | 'diff'
  const [diffImage, setDiffImage] = useState(null);

  // Генерация diff-изображения (подсветка изменённых пикселей)
  const generateDiff = async () => {
    const img1 = new Image();
    const img2 = new Image();
    
    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';
    
    await Promise.all([
      new Promise(resolve => { img1.onload = resolve; img1.src = oldImageUrl; }),
      new Promise(resolve => { img2.onload = resolve; img2.src = newImageUrl; })
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(img1, 0, 0, width, height);
    const imageData1 = ctx.getImageData(0, 0, width, height);
    
    ctx.drawImage(img2, 0, 0, width, height);
    const imageData2 = ctx.getImageData(0, 0, width, height);
    const diffData = ctx.createImageData(width, height);
    
    // Подсчёт различий
    const numDiffPixels = pixelmatch(
      imageData1.data, 
      imageData2.data, 
      diffData.data, 
      width, 
      height, 
      { threshold: 0.1 }
    );
    
    // Подсветка изменений красным
    for (let i = 0; i < diffData.data.length; i += 4) {
      if (diffData.data[i + 3] > 0) { // если пиксель изменён
        diffData.data[i] = 255;     // R
        diffData.data[i + 1] = 0;   // G
        diffData.data[i + 2] = 0;   // B
        diffData.data[i + 3] = 128; // Alpha (полупрозрачный)
      }
    }
    
    ctx.putImageData(diffData, 0, 0);
    setDiffImage(canvas.toDataURL());
  };

  return (
    <div className="version-diff">
      {/* Переключатель режимов */}
      <div className="diff-controls mb-3">
        <button 
          className={`btn ${diffMode === 'slider' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setDiffMode('slider')}
        >
          Слайдер
        </button>
        <button 
          className={`btn ${diffMode === 'fade' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setDiffMode('fade')}
        >
          Наложение
        </button>
        <button 
          className={`btn ${diffMode === 'diff' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => { setDiffMode('diff'); generateDiff(); }}
        >
          Подсветка изменений
        </button>
      </div>

      {/* Отображение в зависимости от режима */}
      {diffMode === 'slider' && (
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={oldImageUrl} alt="Предыдущая версия" />}
          itemTwo={<ReactCompareSliderImage src={newImageUrl} alt="Текущая версия" />}
          style={{ width: '100%', maxWidth: width }}
        />
      )}
      
      {diffMode === 'fade' && (
        <div className="fade-compare" style={{ position: 'relative', width, height }}>
          <img src={oldImageUrl} alt="Old" style={{ width: '100%' }} />
          <img 
            src={newImageUrl} 
            alt="New" 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%',
              opacity: 0.5,
              mixBlendMode: 'difference'
            }} 
          />
        </div>
      )}
      
      {diffMode === 'diff' && diffImage && (
        <div>
          <img src={newImageUrl} alt="Current" style={{ width: '100%' }} />
          <img src={diffImage} alt="Diff" style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%',
            pointerEvents: 'none'
          }} />
          <small className="text-muted">🔴 Красным подсвечены изменённые области</small>
        </div>
      )}
    </div>
  );
};

export default VersionDiff;