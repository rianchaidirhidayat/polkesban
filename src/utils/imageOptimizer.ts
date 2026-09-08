/**
 * Image Optimization & Compression Utility
 * Resizes and compresses base64 / File images on an HTML5 canvas to keep payloads
 * extremely small (2KB - 20KB) so Firebase Firestore document size limit (1MB)
 * is never exceeded and synchronization is lightning fast in real-time.
 */

export async function optimizeImageForStorage(
  source: string | File,
  maxWidth = 160,
  maxHeight = 160,
  quality = 0.85
): Promise<string> {
  // If it's empty, standard icon name, or non-data URL, return as-is immediately
  if (!source) return '';
  if (typeof source === 'string') {
    if (!source.startsWith('data:image/') && !source.startsWith('blob:')) {
      return source;
    }
  }

  return new Promise((resolve) => {
    let isSettled = false;
    const safeResolve = (val: string) => {
      if (!isSettled) {
        isSettled = true;
        resolve(val);
      }
    };

    // Strict 500ms safety timeout so the UI never hangs or freezes
    const timer = setTimeout(() => {
      safeResolve(typeof source === 'string' ? source : '');
    }, 500);

    try {
      const img = new Image();

      img.onload = () => {
        clearTimeout(timer);
        try {
          let { width, height } = img;
          if (width <= 0 || height <= 0) {
            safeResolve(typeof source === 'string' ? source : '');
            return;
          }

          // Maintain aspect ratio while bounding within maxWidth & maxHeight
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            safeResolve(typeof source === 'string' ? source : '');
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first for optimal compression (typically 70% smaller than PNG)
          let output = canvas.toDataURL('image/webp', quality);
          if (!output.startsWith('data:image/webp')) {
            output = canvas.toDataURL('image/png');
          }

          safeResolve(output);
        } catch (err) {
          console.warn('Canvas image optimization failed, returning original:', err);
          safeResolve(typeof source === 'string' ? source : '');
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        safeResolve(typeof source === 'string' ? source : '');
      };

      if (typeof source === 'string') {
        // Do NOT set crossOrigin on data: or blob: URIs
        if (!source.startsWith('data:') && !source.startsWith('blob:')) {
          img.crossOrigin = 'anonymous';
        }
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            img.src = e.target.result as string;
          } else {
            clearTimeout(timer);
            safeResolve('');
          }
        };
        reader.onerror = () => {
          clearTimeout(timer);
          safeResolve('');
        };
        reader.readAsDataURL(source);
      }
    } catch (e) {
      clearTimeout(timer);
      safeResolve(typeof source === 'string' ? source : '');
    }
  });
}
