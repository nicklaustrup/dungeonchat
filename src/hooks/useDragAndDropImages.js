import React from 'react';

/**
 * useDragAndDropImages
 * Encapsulates drag & drop lifecycle for image uploads with robust image detection.
 *
 * @param {Object} params
 * @param {(file: File) => void} params.onImage - Callback when a single image file is dropped.
 * @param {(files: FileList) => void} params.onImages - Callback when multiple image files are dropped.
 * @param {(active: boolean, ready: boolean) => void} [params.onStateChange] - Notifies parent about drag state changes.
 * @returns {{ isDragActive: boolean, imageReady: boolean, bind: Object }}
 */
export function useDragAndDropImages({ onImage, onImages, onStateChange } = {}) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [imageReady, setImageReady] = React.useState(false);
  const dragCounterRef = React.useRef(0);
  const windowListenersAttached = React.useRef(false);

  const notify = React.useCallback((active, ready) => {
    if (onStateChange) onStateChange(active, ready);
  }, [onStateChange]);

  const detectImageItems = React.useCallback((dataTransfer) => {
    if (!dataTransfer?.items) return false;
    return Array.from(dataTransfer.items).some(item => {
      if (item.kind !== 'file') return false;
      if (item.type && item.type.startsWith('image/')) return true;
      try {
        const file = item.getAsFile?.();
        if (!file) return false;
        return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|avif)$/i.test(file.name);
      } catch { return false; }
    });
  }, []);

  // Global listeners (attached once) to reset state when leaving window or dropping outside target
  React.useEffect(() => {
    if (windowListenersAttached.current) return;
    const handleWindowDragLeave = (e) => {
      if (e.relatedTarget === null || e.clientX <= 0 || e.clientY <= 0) {
        dragCounterRef.current = 0;
        setIsDragActive(false);
        setImageReady(false);
        notify(false, false);
      }
    };
    const handleWindowDrop = () => {
      dragCounterRef.current = 0;
      setIsDragActive(false);
      setImageReady(false);
      notify(false, false);
    };
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    windowListenersAttached.current = true;
    return () => {
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [notify]);

  const bind = React.useMemo(() => ({
    onDragEnter: (e) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (!isDragActive) {
        setIsDragActive(true);
        notify(true, imageReady);
      }
      const ready = detectImageItems(e.dataTransfer);
      if (ready !== imageReady) {
        setImageReady(ready);
        notify(true, ready);
      }
    },
    onDragOver: (e) => {
      e.preventDefault();
      if (!isDragActive) {
        setIsDragActive(true);
        notify(true, imageReady);
      }
      const ready = detectImageItems(e.dataTransfer);
      if (ready !== imageReady) {
        setImageReady(ready);
        notify(true, ready);
      }
    },
    onDragLeave: (e) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        setIsDragActive(false);
        setImageReady(false);
        notify(false, false);
      }
    },
    onDrop: (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        // Filter for image files
        const imageFiles = Array.from(files).filter(file => 
          file.type && file.type.startsWith('image/')
        );
        
        if (imageFiles.length > 0) {
          // Prioritize onImages handler if available (supports both single and multiple)
          if (onImages) {
            onImages(imageFiles);
          } else if (onImage) {
            // Fallback to single image handler only if onImages not provided
            onImage(imageFiles[0]);
          }
        }
      }
      dragCounterRef.current = 0;
      setIsDragActive(false);
      setImageReady(false);
      notify(false, false);
    }
  }), [detectImageItems, imageReady, isDragActive, notify, onImage, onImages]);

  return { isDragActive, imageReady, bind };
}

export default useDragAndDropImages;