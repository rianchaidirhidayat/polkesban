/**
 * Utility to generate high-resolution raster image of the official Kemenkes Poltekkes Bandung Kop Surat
 * Exactly matching the official letterhead uploaded by the user:
 * - Left: Official Kemenkes Cross Logo + "Kemenkes Poltekkes Bandung"
 * - Right: "Kementerian Kesehatan", "Direktorat Jenderal Sumber Daya Manusia Kesehatan",
 *          "Poltekkes Kemenkes Bandung", Address with Pin icon, Phone icon, Globe/Web icon.
 */

export const KOP_SURAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1150 200" width="1150" height="200">
  <rect width="1150" height="200" fill="#ffffff" />
  
  <!-- ==================== LEFT: LOGO KEMENKES POLTEKKES BANDUNG ==================== -->
  <g transform="translate(30, 20)">
    <!-- 1. Kemenkes Stylized Cross Symbol -->
    <g transform="translate(0, 0)">
      <!-- Left Petal (Teal) -->
      <rect x="0" y="48" width="56" height="52" rx="26" fill="#00A99D" />
      <!-- Top Petal (Teal) -->
      <rect x="48" y="0" width="52" height="56" rx="26" fill="#00A99D" />
      <!-- Bottom Petal (Teal) -->
      <rect x="48" y="92" width="52" height="56" rx="26" fill="#00A99D" />
      <!-- Right Petal (Lime Green) -->
      <rect x="92" y="48" width="56" height="52" rx="26" fill="#8DC63F" />
      
      <!-- Center Blend -->
      <circle cx="74" cy="74" r="32" fill="#00A99D" />
      <path d="M 74,42 A 32,32 0 0,1 106,74 L 74,74 Z" fill="#8DC63F" />
      
      <!-- Stylized Center Heart / Chevron Cutouts -->
      <path d="M 52,60 L 74,82 L 96,60 L 88,48 L 74,62 L 60,48 Z" fill="#ffffff" />
      <path d="M 74,72 L 94,52 L 102,60 L 74,88 L 64,78 L 72,70 Z" fill="#ffffff" />
      <path d="M 58,74 L 74,90 L 90,74 L 98,82 L 74,106 L 50,82 Z" fill="#ffffff" />
      <circle cx="74" cy="74" r="5" fill="#ffffff" />
    </g>

    <!-- 2. Text "Kemenkes" & "Poltekkes Bandung" -->
    <text x="165" y="68" fill="#00A99D" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-weight="800" font-size="38" letter-spacing="-0.5">Kemenkes</text>
    <text x="165" y="112" fill="#39B54A" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-weight="700" font-size="28" letter-spacing="-0.3">Poltekkes Bandung</text>
  </g>

  <!-- ==================== RIGHT: INSTITUSI KEMENKES DETAILS ==================== -->
  <g transform="translate(630, 20)">
    <!-- Line 1: Kementerian Kesehatan -->
    <text x="0" y="24" fill="#00A99D" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-weight="800" font-size="24" letter-spacing="-0.2">Kementerian Kesehatan</text>

    <!-- Line 2 & 3: Direktorat Jenderal Sumber Daya Manusia Kesehatan -->
    <text x="0" y="50" fill="#4A4A4A" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-weight="700" font-size="20" letter-spacing="-0.2">Direktorat Jenderal</text>
    <text x="0" y="74" fill="#4A4A4A" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-weight="700" font-size="20" letter-spacing="-0.2">Sumber Daya Manusia Kesehatan</text>

    <!-- Line 4: Poltekkes Kemenkes Bandung -->
    <text x="0" y="100" fill="#888888" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-weight="600" font-size="18" letter-spacing="-0.1">Poltekkes Kemenkes Bandung</text>

    <!-- Address with Pin Icon -->
    <g transform="translate(0, 116)">
      <path d="M 5.5,0 C 2.46,0 0,2.46 0,5.5 C 0,9.62 5.5,15.5 5.5,15.5 C 5.5,15.5 11,9.62 11,5.5 C 11,2.46 8.54,0 5.5,0 Z M 5.5,7.5 C 4.4,7.5 3.5,6.6 3.5,5.5 C 3.5,4.4 4.4,3.5 5.5,3.5 C 6.6,3.5 7.5,4.4 7.5,5.5 C 7.5,6.6 6.6,7.5 5.5,7.5 Z" fill="#222222" />
      <text x="18" y="7" fill="#444444" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="12" font-weight="400">Jalan Pajajaran No.56, Pasir Kaliki, Cicendo,</text>
      <text x="18" y="21" fill="#444444" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="12" font-weight="400">Bandung, Jawa Barat 40171</text>
    </g>

    <!-- Phone with Phone Icon -->
    <g transform="translate(0, 149)">
      <path d="M 1.5,1 C 0.67,1 0,1.67 0,2.5 C 0,8.85 5.15,14 11.5,14 C 12.33,14 13,13.33 13,12.5 L 13,10.2 C 13,9.75 12.7,9.37 12.27,9.27 L 9.8,8.7 C 9.42,8.61 9.02,8.76 8.78,9.07 L 7.8,10.27 C 5.75,9.23 4.27,7.75 3.23,5.7 L 4.43,4.72 C 4.74,4.48 4.89,4.08 4.8,3.7 L 4.23,1.23 C 4.13,0.8 3.75,0.5 3.3,0.5 L 1.5,1 Z" fill="#222222" />
      <text x="18" y="10" fill="#444444" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="12" font-weight="400">(022) 4231627</text>
    </g>

    <!-- Website with Globe Icon -->
    <g transform="translate(0, 169)">
      <circle cx="6" cy="6" r="5.5" fill="none" stroke="#222222" stroke-width="1.2" />
      <ellipse cx="6" cy="6" rx="2.3" ry="5.5" fill="none" stroke="#222222" stroke-width="1.1" />
      <line x1="0.5" y1="6" x2="11.5" y2="6" stroke="#222222" stroke-width="1.1" />
      <line x1="1.8" y1="3" x2="10.2" y2="3" stroke="#222222" stroke-width="0.9" />
      <line x1="1.8" y1="9" x2="10.2" y2="9" stroke="#222222" stroke-width="0.9" />
      <text x="18" y="9" fill="#444444" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="12" font-weight="400">https://poltekkesbandung.ac.id</text>
    </g>
  </g>
</svg>`;

let cachedKopSuratDataUrl: string | null = null;

/**
 * Returns a high-resolution base64 PNG data URL of the Kop Surat.
 * Renders directly on an offscreen Canvas for 100% crispness in PDF printing.
 */
export async function getKopSuratDataUrl(): Promise<string> {
  if (cachedKopSuratDataUrl) {
    return cachedKopSuratDataUrl;
  }

  // If in browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const blob = new Blob([KOP_SURAT_SVG], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load SVG into Image'));
        img.src = url;
      });

      // Target high-resolution canvas (2300 x 400 for crisp 300 DPI rendering)
      const canvas = document.createElement('canvas');
      canvas.width = 2300;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        cachedKopSuratDataUrl = canvas.toDataURL('image/png');
        return cachedKopSuratDataUrl;
      }
    } catch (err) {
      console.warn('Canvas rasterization of SVG failed, falling back to pure canvas drawing:', err);
    }

    // Direct Canvas Drawing Fallback
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 2300;
    fallbackCanvas.height = 400;
    const ctx = fallbackCanvas.getContext('2d');
    if (ctx) {
      drawKopSuratDirect(ctx, 2300, 400);
      cachedKopSuratDataUrl = fallbackCanvas.toDataURL('image/png');
      return cachedKopSuratDataUrl;
    }
  }

  // Fallback: Inline SVG Data URI
  return `data:image/svg+xml;utf8,${encodeURIComponent(KOP_SURAT_SVG)}`;
}

/**
 * Direct Canvas vector drawing fallback for maximum robustness
 */
function drawKopSuratDirect(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const scale = width / 1150;
  ctx.save();
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1150, 200);

  // Left: Cross Logo
  ctx.save();
  ctx.translate(30, 20);

  // Cross Petals
  // Left Petal
  ctx.fillStyle = '#00A99D';
  roundRect(ctx, 0, 48, 56, 52, 26);
  ctx.fill();
  // Top Petal
  roundRect(ctx, 48, 0, 52, 56, 26);
  ctx.fill();
  // Bottom Petal
  roundRect(ctx, 48, 92, 52, 56, 26);
  ctx.fill();
  // Right Petal (Lime Green)
  ctx.fillStyle = '#8DC63F';
  roundRect(ctx, 92, 48, 56, 52, 26);
  ctx.fill();

  // Core Center
  ctx.fillStyle = '#00A99D';
  ctx.beginPath();
  ctx.arc(74, 74, 32, 0, Math.PI * 2);
  ctx.fill();

  // White Stylized Cutout
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(74, 74, 6, 0, Math.PI * 2);
  ctx.fill();

  // Left Titles
  ctx.font = '800 38px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#00A99D';
  ctx.fillText('Kemenkes', 165, 68);

  ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#39B54A';
  ctx.fillText('Poltekkes Bandung', 165, 112);
  ctx.restore();

  // Right Side Titles & Address
  ctx.save();
  ctx.translate(630, 20);

  ctx.font = '800 24px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#00A99D';
  ctx.fillText('Kementerian Kesehatan', 0, 24);

  ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#4A4A4A';
  ctx.fillText('Direktorat Jenderal', 0, 50);
  ctx.fillText('Sumber Daya Manusia Kesehatan', 0, 74);

  ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#888888';
  ctx.fillText('Poltekkes Kemenkes Bandung', 0, 100);

  // Address
  ctx.font = '400 12px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#444444';
  ctx.fillText('Jalan Pajajaran No.56, Pasir Kaliki, Cicendo,', 18, 123);
  ctx.fillText('Bandung, Jawa Barat 40171', 18, 137);

  // Phone
  ctx.fillText('(022) 4231627', 18, 159);

  // Web
  ctx.fillText('https://poltekkesbandung.ac.id', 18, 178);

  ctx.restore();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
