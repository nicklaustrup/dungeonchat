import React from 'react';

export default function ImagePreviewModal({ open, src, onClose }) {
  const contentRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const [isSmallImage, setIsSmallImage] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Handle image load to detect size
  const handleImageLoad = React.useCallback(() => {
    if (imgRef.current) {
      const img = imgRef.current;
      const rect = img.getBoundingClientRect();
      
      // Consider image "small" if either dimension is less than 400px
      const isSmall = rect.width < 400 || rect.height < 400;
      setIsSmallImage(isSmall);
    }
  }, []);

  if (!open) return null;
  
  return (
    <div className="image-modal" onClick={onClose} role="dialog" aria-modal="true" aria-label="Image preview" data-testid="image-preview-modal">
      <div 
        className={`image-modal-content ${isSmallImage ? 'small-image' : 'large-image'}`} 
        ref={contentRef} 
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          ref={imgRef}
          src={src} 
          alt="Full size view" 
          loading="eager" 
          onLoad={handleImageLoad}
        />
        <button className="image-modal-close" onClick={onClose} aria-label="Close image preview">×</button>
      </div>
    </div>
  );
}
