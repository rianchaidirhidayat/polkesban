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
  // If it's a standard icon name or emoji, return as-is immediately
  if (typeof source === 'string') {
    if (!source.startsWith('data:image/') && !source.startsWith('blob:')) {
      return source;
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width <= 0 || height <= 0) {
          resolve(typeof source === 'string' ? source : '');
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
          resolve(typeof source === 'string' ? source : '');
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

        resolve(output);
      } catch (err) {
        console.warn('Canvas image optimization failed, returning original:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    img.onerror = () => {
      resolve(typeof source === 'string' ? source : '');
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source);
    }
  });
}
