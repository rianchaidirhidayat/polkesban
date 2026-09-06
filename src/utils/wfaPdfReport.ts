import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WfaSubmission } from '../types';

export interface GeneratePdfOptions {
  submissions: WfaSubmission[];
  title?: string;
  subtitle?: string;
  filterLabel?: string;
  generatedBy?: string;
}

/**
 * Generate dan Download Laporan Resmi PDF Dashboard Pengajuan WFA Bimbingan
 */
export function generateWfaPdfReport({
  submissions,
  title = 'LAPORAN REKAPITULASI PENGAJUAN WORK FROM ANYWHERE (WFA) BIMBINGAN',
  subtitle = 'PANGKALAN DATA MONITORING & VERIFIKASI PRESENSI TIM KERJA OSDM',
  filterLabel = 'Semua Pengajuan',
  generatedBy = 'Tim Kerja OSDM Poltekkes Kemenkes Bandung',
}: GeneratePdfOptions): void {
  // A4 Landscape orientation: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // KPI Metrics calculation
  const totalSubmissions = submissions.length;
  const validCount = submissions.filter((s) => s.status === 'Valid').length;
  const pendingCount = submissions.filter((s) => s.status === 'Menunggu Validasi').length;
  const rejectedCount = submissions.filter((s) => s.status === 'Ditolak').length;

  // Count by location
  const locBandungKota = submissions.filter((s) => s.lokasiKegiatan === 'Kota Bandung').length;
  const locBandungKab = submissions.filter((s) => s.lokasiKegiatan === 'Kabupaten Bandung').length;
  const locBogorKota = submissions.filter((s) => s.lokasiKegiatan === 'Kota Bogor').length;
  const locBogorKab = submissions.filter((s) => s.lokasiKegiatan === 'Kabupaten Bogor').length;
  const locKarawangKota = submissions.filter((s) => s.lokasiKegiatan === 'Kota Karawang').length;
  const locKarawangKab = submissions.filter((s) => s.lokasiKegiatan === 'Kabupaten Karawang').length;

  // 1. KOP SURAT INSTANSI RESMI KEMENKES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('KEMENTERIAN KESEHATAN REPUBLIK INDONESIA', pageWidth / 2, 13, { align: 'center' });

  doc.setFontSize(10);
  doc.text('DIREKTORAT JENDERAL TENAGA KESEHATAN', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('POLITEKNIK KESEHATAN KEMENKES BANDUNG', pageWidth / 2, 23.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    'Jl. Pajajaran No. 56 Bandung 40171 • Telp: (022) 4231627 • Email: info@poltekkesbandung.ac.id',
    pageWidth / 2,
    28,
    { align: 'center' }
  );

  // Garis Kop Ganda (Tebal & Tipis)
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.8);
  doc.line(margin, 31, pageWidth - margin, 31);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.line(margin, 32.2, pageWidth - margin, 32.2);

  // 2. JUDUL LAPORAN & METADATA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(title, pageWidth / 2, 38.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, pageWidth / 2, 43, { align: 'center' });

  // Tanggal cetak & filter
  const todayStr = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  doc.setFontSize(8);
  doc.text(`Dicetak: ${todayStr} WIB`, margin, 49);
  doc.text(`Kriteria Tampilan: ${filterLabel}`, pageWidth - margin, 49, { align: 'right' });

  // 3. MINI DASHBOARD KPI CARDS (4 Boxes across page)
  const cardY = 52;
  const cardHeight = 16;
  const cardGap = 4;
  const totalWidth = pageWidth - margin * 2;
  const cardWidth = (totalWidth - cardGap * 3) / 4;

  const kpis = [
    {
      title: 'TOTAL PENGAJUAN',
      value: `${totalSubmissions}`,
      sub: 'Berkas Terdata',
      bgR: 241, bgG: 245, bgB: 249, // slate-100
      borderR: 203, borderG: 213, borderB: 225,
      textR: 30, textG: 41, textB: 59,
    },
    {
      title: 'DISETUJUI (VALID)',
      value: `${validCount}`,
      sub: 'Jadwal Presensi Aktif',
      bgR: 236, bgG: 253, bgB: 245, // emerald-50
      borderR: 167, borderG: 243, borderB: 208,
      textR: 6, textG: 95, textB: 70, // emerald-800
    },
    {
      title: 'MENUNGGU VALIDASI',
      value: `${pendingCount}`,
      sub: 'Butuh Verifikasi OSDM',
      bgR: 254, bgG: 243, bgB: 199, // amber-100
      borderR: 253, borderG: 230, borderB: 138,
      textR: 146, textG: 64, textB: 14, // amber-800
    },
    {
      title: 'DITOLAK / REVISI',
      value: `${rejectedCount}`,
      sub: 'Berkas Tidak Sesuai',
      bgR: 255, bgG: 241, bgB: 242, // rose-50
      borderR: 254, borderG: 205, borderB: 211,
      textR: 159, textG: 18, textB: 57, // rose-800
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + cardGap);
    // Card background
    doc.setFillColor(kpi.bgR, kpi.bgG, kpi.bgB);
    doc.setDrawColor(kpi.borderR, kpi.borderG, kpi.borderB);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 3, cardY + 4.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(kpi.textR, kpi.textG, kpi.textB);
    doc.text(kpi.value, x + 3, cardY + 10.5);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3, cardY + 14);
  });

  // Wilayah Breakdown Sub-line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const locSummary = `Distribusi Wilayah: Bandung (${locBandungKota} Kota / ${locBandungKab} Kab) • Bogor (${locBogorKota} Kota / ${locBogorKab} Kab) • Karawang (${locKarawangKota} Kota / ${locKarawangKab} Kab)`;
  doc.text(locSummary, margin, cardY + cardHeight + 4.5);

  // 4. TABEL DETAIL PENGAJUAN WFA (AutoTable)
  const tableData = submissions.map((sub, index) => {
    return [
      (index + 1).toString(),
      sub.nip,
      sub.employeeName,
      sub.unitKerja || '-',
      sub.tanggalWfa,
      sub.lokasiKegiatan,
      sub.lokasiLahanBimbingan || '-',
      sub.statusWfa,
      sub.status,
      sub.catatanPengelola || '-',
    ];
  });

  autoTable(doc, {
    startY: cardY + cardHeight + 7,
    margin: { left: margin, right: margin, bottom: 25 },
    head: [
      [
        'No',
        'NIP',
        'Nama Pegawai',
        'Unit Kerja',
        'Tanggal WFA',
        'Wilayah',
        'Lokasi Lahan',
        'Presensi',
        'Status',
        'Catatan OSDM',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 26 },
      2: { cellWidth: 38 },
      3: { cellWidth: 28 },
      4: { halign: 'center', cellWidth: 18 },
      5: { cellWidth: 26 },
      6: { cellWidth: 38 },
      7: { cellWidth: 25 },
      8: { halign: 'center', cellWidth: 22 },
      9: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      // Color status column based on value
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw);
        if (val === 'Valid') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Menunggu Validasi') {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Ditolak') {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: () => {
      // Footer page numbering on each page
      const currentPages = (doc as any).internal.getNumberOfPages();
      const pageCurrent = (doc as any).internal.getCurrentPageInfo().pageNumber;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);

      doc.text(
        'Sistem Monitoring WFA Bimbingan • Poltekkes Kemenkes Bandung • Dokumen Sah Kedinasan',
        margin,
        pageHeight - 8
      );
      doc.text(
        `Halaman ${pageCurrent} dari ${currentPages}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  // 5. BLOK PENGESAHAN / TANDA TANGAN TIM KERJA OSDM
  const lastTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 140;
  
  // If not enough space on current page for signature block, add a new page
  if (lastTableY > pageHeight - 38) {
    doc.addPage();
  }

  const signY = (lastTableY > pageHeight - 38 ? 20 : lastTableY + 8);
  const signX = pageWidth - margin - 65;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  const formattedDateNow = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  doc.text(`Bandung, ${formattedDateNow}`, signX, signY);
  doc.setFont('helvetica', 'bold');
  doc.text('Pengelola Kepegawaian (OSDM)', signX, signY + 4);
  doc.text('Poltekkes Kemenkes Bandung', signX, signY + 8);

  // TTD space
  doc.setDrawColor(203, 213, 225);
  doc.line(signX, signY + 24, signX + 55, signY + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('TIM KERJA ORGANISASI & SDM', signX, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NIP. Verifikator Kedinasan Terlampir', signX, signY + 31.5);

  // Save the PDF
  const filename = `Laporan_WFA_Bimbingan_Poltekkes_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
