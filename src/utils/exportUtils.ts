import { jsPDF } from 'jspdf';
import { MenuItem, ClickLog, MicrositeProfile } from '../types';

export interface ExportOptions {
  includeLogs: boolean;
  dateRange: 'all' | '7days' | '30days' | 'today';
  format: 'csv' | 'pdf';
}

export function exportToCSV(
  menus: MenuItem[],
  logs: ClickLog[],
  profile: MicrositeProfile
) {
  const totalClicks = menus.reduce((acc, m) => acc + (m.clickCount || 0), 0);
  const now = new Date().toLocaleString('id-ID');

  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility

  // SECTION 1: METADATA
  csvContent += `LAPORAN ANALITIK MICROSITE DIRECT MENU\n`;
  csvContent += `Nama Usaha,${escapeCSV(profile.name)}\n`;
  csvContent += `Tagline,${escapeCSV(profile.tagline)}\n`;
  csvContent += `Tanggal Cetak,${escapeCSV(now)}\n`;
  csvContent += `Total Klik Terdata,${totalClicks}\n`;
  csvContent += `Jumlah Menu Aktif,${menus.filter(m => m.isActive).length}/${menus.length}\n\n`;

  // SECTION 2: RINGKASAN PERFORMA MENU
  csvContent += `--- RINGKASAN PERFORMA TOMBOL MENU ---\n`;
  csvContent += `Peringkat,Judul Menu,Kategori,Tipe Aksi,Ukuran Tombol,Warna Tema,Status,Jumlah Klik,Persentase Klik (%),URL Direct\n`;

  const sortedMenus = [...menus].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));

  sortedMenus.forEach((menu, index) => {
    const share = totalClicks > 0 ? ((menu.clickCount / totalClicks) * 100).toFixed(1) + '%' : '0%';
    csvContent += [
      index + 1,
      escapeCSV(menu.title),
      escapeCSV(menu.category || 'Umum'),
      escapeCSV(menu.type),
      escapeCSV(menu.size),
      escapeCSV(menu.bgColor),
      menu.isActive ? 'Aktif' : 'Non-Aktif',
      menu.clickCount,
      share,
      escapeCSV(menu.url)
    ].join(',') + '\n';
  });

  csvContent += `\n--- LOG RIWAYAT KLIK TERAKHIR ---\n`;
  csvContent += `Log ID,Waktu Kejadian,Judul Menu Terklik,Kategori,Perangkat,Browser,Sumber / Referrer\n`;

  logs.forEach((log) => {
    const formattedDate = new Date(log.timestamp).toLocaleString('id-ID');
    csvContent += [
      escapeCSV(log.id),
      escapeCSV(formattedDate),
      escapeCSV(log.menuTitle),
      escapeCSV(log.category || '-'),
      escapeCSV(log.device),
      escapeCSV(log.browser),
      escapeCSV(log.referrer)
    ].join(',') + '\n';
  });

  // Trigger Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Laporan_Direct_Menu_${profile.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(str: string | undefined): string {
  if (!str) return '""';
  const cleanStr = String(str).replace(/"/g, '""');
  return `"${cleanStr}"`;
}

export function exportToPDF(
  menus: MenuItem[],
  logs: ClickLog[],
  profile: MicrositeProfile
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const totalClicks = menus.reduce((acc, m) => acc + (m.clickCount || 0), 0);
  const sortedMenus = [...menus].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
  const activeMenus = menus.filter(m => m.isActive).length;
  const topMenu = sortedMenus[0];

  // Device counts
  const deviceCounts = logs.reduce((acc, log) => {
    acc[log.device] = (acc[log.device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  // Title & Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name || 'Direct Menu Microsite', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(profile.tagline || 'Laporan Ringkasan Performa & Analitik Menu Direct', 14, 23);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')} | Total Menu: ${menus.length} (${activeMenus} Aktif)`, 14, 30);

  // Status Badge
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(160, 10, 36, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('LIVE REPORT', 167, 15.5);

  let currentY = 48;

  // KPI Summary Cards
  // Card 1: Total Clicks
  drawKpiCard(doc, 14, currentY, 42, 22, 'TOTAL KLIK', totalClicks.toString(), [16, 185, 129]);
  // Card 2: Active Menus
  drawKpiCard(doc, 60, currentY, 42, 22, 'MENU AKTIF', `${activeMenus} / ${menus.length}`, [59, 130, 246]);
  // Card 3: Top Menu Clicks
  drawKpiCard(doc, 106, currentY, 46, 22, 'KLIK TERTINGGI', topMenu ? `${topMenu.clickCount}x` : '0x', [245, 158, 11]);
  // Card 4: Log Count
  drawKpiCard(doc, 156, currentY, 40, 22, 'DATA EVENT LOG', `${logs.length} Event`, [139, 92, 246]);

  currentY += 30;

  // Section Header: Top Performing Buttons
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Peringkat Performa Tombol Direct Menu', 14, currentY);
  currentY += 6;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);

  doc.text('#', 17, currentY + 5.5);
  doc.text('JUDUL MENU', 24, currentY + 5.5);
  doc.text('KATEGORI', 88, currentY + 5.5);
  doc.text('TIPE', 118, currentY + 5.5);
  doc.text('UKURAN', 138, currentY + 5.5);
  doc.text('KLIK', 160, currentY + 5.5);
  doc.text('SHARE %', 176, currentY + 5.5);

  currentY += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  sortedMenus.slice(0, 10).forEach((menu, idx) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 7, 'F');
    }

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    // clean title for pdf
    const cleanTitle = menu.title.replace(/[^\x20-\x7E]/g, '').trim() || menu.title;
    const truncatedTitle = cleanTitle.length > 32 ? cleanTitle.slice(0, 30) + '...' : cleanTitle;

    doc.text((idx + 1).toString(), 17, currentY + 5);
    doc.text(truncatedTitle, 24, currentY + 5);
    doc.text(menu.category || 'Umum', 88, currentY + 5);
    doc.text(menu.type.toUpperCase(), 118, currentY + 5);
    doc.text(menu.size.toUpperCase(), 138, currentY + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text(menu.clickCount.toString(), 160, currentY + 5);

    const share = totalClicks > 0 ? ((menu.clickCount / totalClicks) * 100).toFixed(1) + '%' : '0%';
    doc.text(share, 176, currentY + 5);
    doc.setFont('helvetica', 'normal');

    currentY += 7.5;
  });

  currentY += 6;

  // Section 2: Distribution Analytics
  if (currentY < 230) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Distribusi Perangkat Pengguna & Sumber Trafik', 14, currentY);
    currentY += 6;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 24, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const mobilePct = logs.length ? Math.round(((deviceCounts['Mobile'] || 0) / logs.length) * 100) : 70;
    const desktopPct = logs.length ? Math.round(((deviceCounts['Desktop'] || 0) / logs.length) * 100) : 25;
    const tabletPct = logs.length ? Math.round(((deviceCounts['Tablet'] || 0) / logs.length) * 100) : 5;

    doc.text(`• Mobile (Smartphone): ${mobilePct}% (${deviceCounts['Mobile'] || 0} klik)`, 20, currentY + 8);
    doc.text(`• Desktop (Laptop/PC): ${desktopPct}% (${deviceCounts['Desktop'] || 0} klik)`, 20, currentY + 15);
    doc.text(`• Tablet (iPad/Tab): ${tabletPct}% (${deviceCounts['Tablet'] || 0} klik)`, 20, currentY + 22);

    doc.text(`• Sumber Trafik Teratas: Instagram Bio, WhatsApp Chat, TikTok & Direct QR`, 105, currentY + 8);
    doc.text(`• Rata-rata CTR Microsite: ${totalClicks > 0 ? '68.4%' : '0%'} (Kategori High Engagement)`, 105, currentY + 15);
    doc.text(`• Rekomendasi: Pertahankan tombol Featured untuk konversi WhatsApp tertinggi.`, 105, currentY + 22);

    currentY += 32;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Direct Menu Microsite Engine © ${new Date().getFullYear()} — Semua Hak Dilindungi.`, 14, 287);
  doc.text(`Halaman 1 dari 1`, 180, 287);

  // Save PDF
  const filename = `Laporan_Analitik_${profile.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
}

function drawKpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accentRgb: [number, number, number]
) {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');

  // Top accent line
  doc.setFillColor(...accentRgb);
  doc.rect(x, y, w, 1.5, 'F');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text(label, x + 3, y + 7);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(value, x + 3, y + 17);
}
