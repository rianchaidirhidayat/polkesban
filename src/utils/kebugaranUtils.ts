import { KebugaranSubmission, KebugaranPeriode, GulaDarahType, EmployeeRecord } from '../types';

/**
 * Ekstraksi Tanggal Lahir dari NIP 18 Digit Indonesia
 * 8 Digit pertama NIP adalah: YYYYMMDD
 * Contoh: 197009211996032001 -> 1970-09-21 (21 September 1970)
 */
export function extractBirthDateFromNip(rawNip: string): string {
  if (!rawNip) return '';
  const clean = rawNip.replace(/[\s.-]/g, '').trim();
  if (clean.length < 8) return '';

  const yyyy = clean.substring(0, 4);
  const mm = clean.substring(4, 6);
  const dd = clean.substring(6, 8);

  const yearNum = parseInt(yyyy, 10);
  const monthNum = parseInt(mm, 10);
  const dayNum = parseInt(dd, 10);

  if (yearNum >= 1940 && yearNum <= 2025 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}

/**
 * Format tanggal YYYY-MM-DD ke Bahasa Indonesia (e.g. 21 September 1970)
 */
export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Format tanggal pendek (e.g. 21 Sep 2026)
 */
export function formatTanggalPendek(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Menghasilkan atau mengambil NIK pegawai
 * Jika pegawai belum memiliki NIK tercatat, buat estimasi standar 16-digit berbasis kode prov Jabar/Bandung (3273) + Tgl Lahir
 */
export function generateOrGetNik(nip: string, existingNik?: string): string {
  if (existingNik && existingNik.replace(/[\s.-]/g, '').length >= 10) {
    return existingNik.replace(/[\s.-]/g, '');
  }
  const cleanNip = nip.replace(/[\s.-]/g, '').trim();
  if (cleanNip.length >= 8) {
    const yymmdd = cleanNip.substring(2, 8); // e.g. 700921
    const seq = cleanNip.substring(cleanNip.length - 4) || '0001';
    return `327301${yymmdd}${seq}`.substring(0, 16);
  }
  return '';
}

/**
 * Hitung BMI / IMT (Indeks Massa Tubuh) Standar Kemenkes RI
 * IMT = Berat (kg) / (Tinggi (m) ^ 2)
 */
export function calculateBmi(weightKg: number, heightCm: number): {
  bmi: number;
  label: string;
  category: 'kurang' | 'normal' | 'lebih' | 'obesitas';
  color: string;
  bgColor: string;
  badgeBg: string;
} {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return {
      bmi: 0,
      label: '-',
      category: 'normal',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      label: 'Berat Kurang (Underweight)',
      category: 'kurang',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  } else if (bmi >= 18.5 && bmi <= 22.9) {
    return {
      bmi,
      label: 'Normal / Ideal (Kemenkes)',
      category: 'normal',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  } else if (bmi >= 23.0 && bmi <= 24.9) {
    return {
      bmi,
      label: 'Kelebihan Berat (Overweight)',
      category: 'lebih',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300'
    };
  } else {
    return {
      bmi,
      label: 'Obesitas',
      category: 'obesitas',
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300'
    };
  }
}

/**
 * Klasifikasi Tekanan Darah (Tensi) Standar Kemenkes RI / JNC 8
 */
export function classifyBloodPressure(sistolik: number, diastolik: number): {
  label: string;
  status: 'normal' | 'prehipertensi' | 'hipertensi1' | 'hipertensi2';
  color: string;
  bgColor: string;
  badgeBg: string;
} {
  if (!sistolik || !diastolik) {
    return {
      label: '-',
      status: 'normal',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  if (sistolik < 120 && diastolik < 80) {
    return {
      label: 'Optimal / Normal',
      status: 'normal',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  } else if ((sistolik >= 120 && sistolik <= 139) || (diastolik >= 80 && diastolik <= 89)) {
    return {
      label: 'Pre-Hipertensi',
      status: 'prehipertensi',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  } else if ((sistolik >= 140 && sistolik <= 159) || (diastolik >= 90 && diastolik <= 99)) {
    return {
      label: 'Hipertensi Derajat 1',
      status: 'hipertensi1',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-300'
    };
  } else {
    return {
      label: 'Hipertensi Derajat 2',
      status: 'hipertensi2',
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300'
    };
  }
}

/**
 * Klasifikasi Gula Darah (GDS / GDP) mg/dL
 */
export function classifyBloodSugar(value: number, type: GulaDarahType): {
  label: string;
  status: 'normal' | 'prediabetes' | 'diabetes';
  color: string;
  bgColor: string;
  badgeBg: string;
} {
  if (!value) {
    return {
      label: '-',
      status: 'normal',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  if (type === 'GDP') {
    // Puasa: Normal < 100, Pre 100-125, Diabetes >= 126
    if (value < 100) {
      return {
        label: 'Normal (GDP < 100)',
        status: 'normal',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      };
    } else if (value <= 125) {
      return {
        label: 'Pre-Diabetes (GDP 100-125)',
        status: 'prediabetes',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    } else {
      return {
        label: 'Diabetes (GDP >= 126)',
        status: 'diabetes',
        color: 'text-rose-700',
        bgColor: 'bg-rose-50',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }
  } else {
    // Sewaktu: Normal < 140, Pre 140-199, Diabetes >= 200
    if (value < 140) {
      return {
        label: 'Normal (GDS < 140)',
        status: 'normal',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      };
    } else if (value <= 199) {
      return {
        label: 'Pre-Diabetes (GDS 140-199)',
        status: 'prediabetes',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    } else {
      return {
        label: 'Diabetes (GDS >= 200)',
        status: 'diabetes',
        color: 'text-rose-700',
        bgColor: 'bg-rose-50',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }
  }
}

/**
 * Klasifikasi Kolesterol Total (mg/dL)
 */
export function classifyCholesterol(value: number): {
  label: string;
  status: 'normal' | 'borderline' | 'tinggi';
  color: string;
  bgColor: string;
  badgeBg: string;
} {
  if (!value) {
    return {
      label: '-',
      status: 'normal',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  }

  if (value < 200) {
    return {
      label: 'Normal (< 200 mg/dL)',
      status: 'normal',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  } else if (value <= 239) {
    return {
      label: 'Batas Tinggi / Borderline (200-239)',
      status: 'borderline',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  } else {
    return {
      label: 'Tinggi (>= 240 mg/dL)',
      status: 'tinggi',
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300'
    };
  }
}

/**
 * Escape string for clean CSV output
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Ekspor Data Tes Kebugaran ke File Excel / CSV dengan UTF-8 BOM
 */
export function exportKebugaranToExcel(
  submissions: KebugaranSubmission[],
  periodeFilter: string = 'Semua Periode',
  filenamePrefix: string = 'rekap_tes_kebugaran_pegawai'
) {
  const nowStr = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toLocaleString('id-ID');

  const headers = [
    'No',
    'Tanggal Periksa',
    'Periode Pemeriksaan',
    'NIP',
    'Nama Pegawai',
    'Tanggal Lahir',
    'Unit Kerja',
    'NIK',
    'Tensi Sistolik (mmHg)',
    'Tensi Diastolik (mmHg)',
    'Kategori Tekanan Darah',
    'Berat Badan (kg)',
    'Tinggi Badan (cm)',
    'IMT (BMI)',
    'Kategori IMT',
    'Lingkar Pinggang (cm)',
    'Tipe Gula Darah',
    'Nilai Gula Darah (mg/dL)',
    'Status Gula Darah',
    'Kolesterol (mg/dL)',
    'Status Kolesterol',
    'Nomor WhatsApp',
    'Fasyankes Pemeriksaan',
    'Waktu Input Sistem'
  ];

  const rows = submissions.map((sub, idx) => {
    const bmi = calculateBmi(sub.beratBadan, sub.tinggiBadan);
    const bp = classifyBloodPressure(sub.tensiSistolik, sub.tensiDiastolik);
    const bs = classifyBloodSugar(sub.gulaDarah, sub.tipeGulaDarah);
    const chol = classifyCholesterol(sub.kolesterol);

    return [
      idx + 1,
      escapeCSV(sub.tanggalPeriksa),
      escapeCSV(sub.periode),
      escapeCSV(`'${sub.nip}`), // Apostrophe to preserve leading zero and prevent scientific notation in Excel
      escapeCSV(sub.namaPegawai),
      escapeCSV(sub.tanggalLahir),
      escapeCSV(sub.unitKerja),
      escapeCSV(`'${sub.nik}`),
      sub.tensiSistolik,
      sub.tensiDiastolik,
      escapeCSV(bp.label),
      sub.beratBadan,
      sub.tinggiBadan,
      bmi.bmi,
      escapeCSV(bmi.label),
      sub.lingkarPinggang,
      escapeCSV(sub.tipeGulaDarah),
      sub.gulaDarah,
      escapeCSV(bs.label),
      sub.kolesterol,
      escapeCSV(chol.label),
      escapeCSV(sub.nomorWa ? `'${sub.nomorWa}` : '-'),
      escapeCSV(sub.fasyankes),
      escapeCSV(sub.createdAt ? new Date(sub.createdAt).toLocaleString('id-ID') : '-')
    ].join(',');
  });

  // Metadata preamble for formal Excel reporting
  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += `REKAPITULASI DATA PEMERIKSAAN TES KEBUGARAN PEGAWAI\n`;
  csvContent += `Instansi,"Politeknik Kesehatan Kemenkes Bandung"\n`;
  csvContent += `Filter Periode,"${periodeFilter}"\n`;
  csvContent += `Waktu Tarikan Data,"${nowTime}"\n`;
  csvContent += `Total Rekap Pegawai Mengisi,${submissions.length}\n\n`;
  csvContent += headers.join(',') + '\r\n';
  csvContent += rows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${periodeFilter.replace(/\s+/g, '_')}_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor Data Pegawai yang Belum Mengisi Data Kebugaran ke File Excel / CSV
 */
export function exportBelumMengisiToExcel(
  unsubmittedEmployees: EmployeeRecord[],
  periode: string = 'Semua Periode',
  filenamePrefix: string = 'daftar_pegawai_belum_isi_kebugaran'
) {
  const nowStr = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toLocaleString('id-ID');

  const headers = [
    'No',
    'NIP Pegawai',
    'Nama Lengkap Pegawai',
    'Unit Kerja / Jurusan',
    'Jabatan',
    'Nomor WhatsApp',
    'Status Pengisian Kebugaran',
    'Periode Yang Belum Diisi'
  ];

  const rows = unsubmittedEmployees.map((emp, idx) => [
    idx + 1,
    escapeCSV(`'${emp.nip}`),
    escapeCSV(emp.name),
    escapeCSV(emp.unitKerja),
    escapeCSV(emp.jabatan || 'Dosen / Tenaga Kependidikan'),
    escapeCSV(emp.nomorWa ? `'${emp.nomorWa}` : '-'),
    escapeCSV('BELUM MENGISI'),
    escapeCSV(periode)
  ].join(','));

  let csvContent = '\uFEFF';
  csvContent += `DAFTAR PEGAWAI YANG BELUM MENGISI DATA KEBUGARAN\n`;
  csvContent += `Instansi,"Politeknik Kesehatan Kemenkes Bandung"\n`;
  csvContent += `Target Periode,"${periode}"\n`;
  csvContent += `Waktu Tarikan Data,"${nowTime}"\n`;
  csvContent += `Total Pegawai Belum Mengisi,${unsubmittedEmployees.length}\n\n`;
  csvContent += headers.join(',') + '\r\n';
  csvContent += rows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${periode.replace(/\s+/g, '_')}_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
