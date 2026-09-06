import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileDown,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  CalendarDays,
  CalendarRange,
  Layers,
  Sparkles,
  MapPin,
  Building2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Check,
} from 'lucide-react';
import { WfaSubmission, WfaValidationStatus } from '../types';
import { generateWfaPdfReport } from '../utils/wfaPdfReport';

export type TimeFilterPeriod = 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'semua';

interface WfaPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: WfaSubmission[];
  initialStatusFilter?: 'All' | WfaValidationStatus;
  initialLokasiFilter?: string;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

// Helper: Format Date string YYYY-MM-DD to Indonesian standard
function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const mIdx = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${MONTH_NAMES[mIdx] || month} ${year}`;
  } catch {
    return dateStr;
  }
}

// Helper: Get Monday and Sunday of the current week (or given date)
function getWeekRange(d: Date = new Date()): { start: string; end: string } {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday
  // Distance to Monday (if Sunday (0), distance is -6; if Monday (1), distance is 0)
  const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diffToMonday));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toIsoDate = (dt: Date) => dt.toISOString().slice(0, 10);
  return {
    start: toIsoDate(monday),
    end: toIsoDate(sunday),
  };
}

export const WfaPdfExportModal: React.FC<WfaPdfExportModalProps> = ({
  isOpen,
  onClose,
  submissions,
  initialStatusFilter = 'All',
  initialLokasiFilter = 'All',
}) => {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonthIdx = useMemo(() => new Date().getMonth(), []);

  // Time Filter Mode
  const [periodType, setPeriodType] = useState<TimeFilterPeriod>('bulanan');

  // Daily State
  const [dailyDate, setDailyDate] = useState<string>(todayIso);

  // Weekly State
  const [weeklyPreset, setWeeklyPreset] = useState<'this_week' | 'last_7_days' | 'custom'>('this_week');
  const [weekStartDate, setWeekStartDate] = useState<string>(() => getWeekRange().start);
  const [weekEndDate, setWeekEndDate] = useState<string>(() => getWeekRange().end);

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(currentYear);

  // Yearly State
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Secondary Filters
  const [statusFilter, setStatusFilter] = useState<'All' | WfaValidationStatus>(initialStatusFilter);
  const [lokasiFilter, setLokasiFilter] = useState<string>(initialLokasiFilter);

  // Generating state
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Kop Surat Upload State (PNG / JPG)
  const [customKopSurat, setCustomKopSurat] = useState<string | null>(() => {
    try {
      return localStorage.getItem('wfa_custom_kop_surat_image');
    } catch {
      return null;
    }
  });
  const [customKopSuratName, setCustomKopSuratName] = useState<string | null>(() => {
    try {
      return localStorage.getItem('wfa_custom_kop_surat_filename');
    } catch {
      return null;
    }
  });
  const [isDraggingKop, setIsDraggingKop] = useState<boolean>(false);
  const [kopUploadError, setKopUploadError] = useState<string | null>(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);
  const kopFileInputRef = useRef<HTMLInputElement | null>(null);

  // Process uploaded Kop Surat File (PNG or JPG)
  const handleProcessKopFile = (file: File) => {
    setKopUploadError(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const hasValidExt = /\.(png|jpg|jpeg)$/i.test(file.name);
    if (!validTypes.includes(file.type) && !hasValidExt) {
      setKopUploadError('Format file tidak didukung. Harap unggah file gambar berekstensi .PNG, .JPG, atau .JPEG.');
      return;
    }

    // Limit to 6MB
    if (file.size > 6 * 1024 * 1024) {
      setKopUploadError('Ukuran file terlalu besar (maksimal 6 MB). Silakan gunakan gambar dengan ukuran lebih kecil.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomKopSurat(result);
        setCustomKopSuratName(file.name);
        try {
          localStorage.setItem('wfa_custom_kop_surat_image', result);
          localStorage.setItem('wfa_custom_kop_surat_filename', file.name);
        } catch (e) {
          console.warn('Could not save custom kop surat to localStorage:', e);
        }
        setUploadSuccessToast(`Kop surat "${file.name}" berhasil diterapkan.`);
        setTimeout(() => setUploadSuccessToast(null), 3500);
      }
    };
    reader.onerror = () => {
      setKopUploadError('Gagal membaca file gambar. Silakan coba kembali.');
    };
    reader.readAsDataURL(file);
  };

  // Reset to default official Kop Surat
  const handleResetKopSurat = () => {
    setCustomKopSurat(null);
    setCustomKopSuratName(null);
    setKopUploadError(null);
    try {
      localStorage.removeItem('wfa_custom_kop_surat_image');
      localStorage.removeItem('wfa_custom_kop_surat_filename');
    } catch (e) {
      console.warn('Could not clear custom kop surat from localStorage:', e);
    }
    if (kopFileInputRef.current) {
      kopFileInputRef.current.value = '';
    }
    setUploadSuccessToast('Kop surat telah dikembalikan ke format standar Kemenkes.');
    setTimeout(() => setUploadSuccessToast(null), 3000);
  };

  // Synchronize initial filters when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStatusFilter(initialStatusFilter);
      setLokasiFilter(initialLokasiFilter);
    }
  }, [isOpen, initialStatusFilter, initialLokasiFilter]);

  // Handle Weekly preset click
  const handleSelectWeeklyPreset = (preset: 'this_week' | 'last_7_days' | 'custom') => {
    setWeeklyPreset(preset);
    if (preset === 'this_week') {
      const { start, end } = getWeekRange();
      setWeekStartDate(start);
      setWeekEndDate(end);
    } else if (preset === 'last_7_days') {
      const endDt = new Date();
      const startDt = new Date();
      startDt.setDate(endDt.getDate() - 6);
      setWeekStartDate(startDt.toISOString().slice(0, 10));
      setWeekEndDate(endDt.toISOString().slice(0, 10));
    }
  };

  // Compute Active Time Period Description & Filename
  const { periodLabel, filenamePrefix } = useMemo(() => {
    if (periodType === 'harian') {
      const formatted = formatIndoDate(dailyDate);
      return {
        periodLabel: `Harian - ${formatted}`,
        filenamePrefix: `Laporan_WFA_Harian_${dailyDate}`,
      };
    }

    if (periodType === 'mingguan') {
      const startFmt = formatIndoDate(weekStartDate);
      const endFmt = formatIndoDate(weekEndDate);
      return {
        periodLabel: `Mingguan - ${startFmt} s.d ${endFmt}`,
        filenamePrefix: `Laporan_WFA_Mingguan_${weekStartDate}_sd_${weekEndDate}`,
      };
    }

    if (periodType === 'bulanan') {
      const mName = MONTH_NAMES[selectedMonth] || 'Bulan';
      const mNum = String(selectedMonth + 1).padStart(2, '0');
      return {
        periodLabel: `Bulanan - ${mName} ${selectedMonthYear}`,
        filenamePrefix: `Laporan_WFA_Bulanan_${selectedMonthYear}_${mNum}`,
      };
    }

    if (periodType === 'tahunan') {
      return {
        periodLabel: `Tahunan - Tahun ${selectedYear}`,
        filenamePrefix: `Laporan_WFA_Tahunan_${selectedYear}`,
      };
    }

    // Semua
    return {
      periodLabel: 'Semua Periode Terdata',
      filenamePrefix: `Laporan_WFA_Rekap_Lengkap_${todayIso}`,
    };
  }, [
    periodType,
    dailyDate,
    weekStartDate,
    weekEndDate,
    selectedMonth,
    selectedMonthYear,
    selectedYear,
    todayIso,
  ]);

  // Filter Submissions based on active Time Period & Filters
  const matchedSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Time Filter
      const tDate = sub.tanggalWfa; // YYYY-MM-DD
      if (!tDate) return false;

      let matchTime = false;
      if (periodType === 'harian') {
        matchTime = tDate === dailyDate;
      } else if (periodType === 'mingguan') {
        matchTime = tDate >= weekStartDate && tDate <= weekEndDate;
      } else if (periodType === 'bulanan') {
        const [yStr, mStr] = tDate.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10) - 1; // 0-based
        matchTime = y === selectedMonthYear && m === selectedMonth;
      } else if (periodType === 'tahunan') {
        const [yStr] = tDate.split('-');
        const y = parseInt(yStr, 10);
        matchTime = y === selectedYear;
      } else {
        matchTime = true; // semua
      }

      if (!matchTime) return false;

      // 2. Status Filter
      if (statusFilter !== 'All' && sub.status !== statusFilter) {
        return false;
      }

      // 3. Lokasi Filter
      if (lokasiFilter !== 'All' && sub.lokasiKegiatan !== lokasiFilter) {
        return false;
      }

      return true;
    });
  }, [
    submissions,
    periodType,
    dailyDate,
    weekStartDate,
    weekEndDate,
    selectedMonth,
    selectedMonthYear,
    selectedYear,
    statusFilter,
    lokasiFilter,
  ]);

  // Counts in current selection
  const validCount = matchedSubmissions.filter((s) => s.status === 'Valid').length;
  const pendingCount = matchedSubmissions.filter((s) => s.status === 'Menunggu Validasi').length;
  const rejectedCount = matchedSubmissions.filter((s) => s.status === 'Ditolak').length;

  // Handle Generate and Download PDF
  const handleExecuteDownload = async () => {
    if (matchedSubmissions.length === 0) {
      const confirmEmpty = window.confirm(
        'Tidak ditemukan berkas pengajuan WFA pada periode yang dipilih. Apakah Anda tetap ingin mengunduh laporan berformat kosong?'
      );
      if (!confirmEmpty) return;
    }

    setIsGenerating(true);
    try {
      // Criteria label
      const criteriaParts: string[] = [];
      if (statusFilter !== 'All') criteriaParts.push(`Status: ${statusFilter}`);
      if (lokasiFilter !== 'All') criteriaParts.push(`Wilayah: ${lokasiFilter}`);
      const criteriaLabel = criteriaParts.length > 0 ? criteriaParts.join(' • ') : 'Semua Status & Wilayah';

      await generateWfaPdfReport({
        submissions: matchedSubmissions,
        filterLabel: criteriaLabel,
        periodLabel: periodLabel,
        customFilename: `${filenamePrefix}.pdf`,
        customKopSuratImage: customKopSurat,
      });

      // Close modal after download triggers
      setTimeout(() => {
        setIsGenerating(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error generating filtered PDF:', err);
      alert('Terjadi kesalahan saat memproses laporan PDF. Silakan coba kembali.');
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6"
      >
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                <span>Konfigurasi Periode Laporan PDF</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  Format Resmi OSDM
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Pilih filter rentang waktu harian, mingguan, bulanan, atau tahunan sebelum mengunduh.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* TAB PILIHAN PERIODE WAKTU */}
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Tentukan Periode Waktu Laporan:</span>
              <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPeriodType('harian')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  periodType === 'harian'
                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Calendar className={`w-4 h-4 mb-1 ${periodType === 'harian' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Harian</span>
                <span className="text-[10px] text-slate-400">1 Hari Kerja</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('mingguan')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  periodType === 'mingguan'
                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <CalendarRange className={`w-4 h-4 mb-1 ${periodType === 'mingguan' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Mingguan</span>
                <span className="text-[10px] text-slate-400">Pekan Berjalan</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('bulanan')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  periodType === 'bulanan'
                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <CalendarDays className={`w-4 h-4 mb-1 ${periodType === 'bulanan' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Bulanan</span>
                <span className="text-[10px] text-slate-400">1 Bulan Penuh</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('tahunan')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  periodType === 'tahunan'
                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Layers className={`w-4 h-4 mb-1 ${periodType === 'tahunan' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold">Tahunan</span>
                <span className="text-[10px] text-slate-400">Tahun Anggaran</span>
              </button>
            </div>

            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPeriodType('semua')}
                className={`text-[11px] font-semibold transition-colors px-2 py-1 rounded-lg ${
                  periodType === 'semua'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800 underline'
                }`}
              >
                Atau Cetak Semua Periode (Tanpa Batasan Waktu)
              </button>
            </div>
          </div>

          {/* DETAIL KONTROL WAKTU SESUAI PILIHAN */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            {/* OPSI 1: HARIAN */}
            {periodType === 'harian' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Pilih Tanggal Pelaksanaan WFA:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDailyDate(todayIso)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold hover:bg-indigo-200 transition-colors"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const yest = new Date();
                        yest.setDate(yest.getDate() - 1);
                        setDailyDate(yest.toISOString().slice(0, 10));
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors"
                    >
                      Kemarin
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Laporan akan merangkum seluruh dosen/tendik yang terjadwal bimbingan WFA pada tanggal{' '}
                  <strong className="text-slate-800">{formatIndoDate(dailyDate)}</strong>.
                </p>
              </div>
            )}

            {/* OPSI 2: MINGGUAN */}
            {periodType === 'mingguan' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Pilihan Rentang Pekan:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectWeeklyPreset('this_week')}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                        weeklyPreset === 'this_week'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Minggu Ini (Senin-Minggu)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectWeeklyPreset('last_7_days')}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                        weeklyPreset === 'last_7_days'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      7 Hari Terakhir
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Tanggal Mulai Pekan:
                    </label>
                    <input
                      type="date"
                      value={weekStartDate}
                      onChange={(e) => {
                        setWeekStartDate(e.target.value);
                        setWeeklyPreset('custom');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Tanggal Akhir Pekan:
                    </label>
                    <input
                      type="date"
                      value={weekEndDate}
                      onChange={(e) => {
                        setWeekEndDate(e.target.value);
                        setWeeklyPreset('custom');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Rentang terpilih: <strong className="text-slate-800">{formatIndoDate(weekStartDate)}</strong> s.d.{' '}
                  <strong className="text-slate-800">{formatIndoDate(weekEndDate)}</strong>.
                </p>
              </div>
            )}

            {/* OPSI 3: BULANAN */}
            {periodType === 'bulanan' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Pilih Bulan & Tahun Rekapitulasi:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth(currentMonthIdx);
                      setSelectedMonthYear(currentYear);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold hover:bg-indigo-200 transition-colors"
                  >
                    Bulan Berjalan ({MONTH_NAMES[currentMonthIdx]} {currentYear})
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bulan:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tahun:</label>
                    <select
                      value={selectedMonthYear}
                      onChange={(e) => setSelectedMonthYear(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {AVAILABLE_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Laporan akan mencakup seluruh data WFA bimbingan selama bulan{' '}
                  <strong className="text-slate-800">
                    {MONTH_NAMES[selectedMonth]} {selectedMonthYear}
                  </strong>
                  .
                </p>
              </div>
            )}

            {/* OPSI 4: TAHUNAN */}
            {periodType === 'tahunan' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Pilih Tahun Anggaran / Akademik:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedYear(currentYear)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold hover:bg-indigo-200 transition-colors"
                  >
                    Tahun Ini ({currentYear})
                  </button>
                </div>

                <div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {AVAILABLE_YEARS.map((y) => (
                      <option key={y} value={y}>
                        Tahun Anggaran {y}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-slate-500">
                  Laporan tahunan merangkum seluruh berkas penugasan dari 1 Januari {selectedYear} hingga 31 Desember{' '}
                  {selectedYear}.
                </p>
              </div>
            )}

            {/* OPSI 5: SEMUA PERIODE */}
            {periodType === 'semua' && (
              <div className="p-2.5 rounded-xl bg-indigo-100/50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Mencetak seluruh rekaman data WFA bimbingan dari awal pencatatan hingga saat ini.</span>
              </div>
            )}
          </div>

          {/* 2. KUSTOMISASI GAMBAR KOP SURAT PDF (PNG / JPG) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Gambar Kop Surat Laporan PDF:</span>
              </label>

              {customKopSurat ? (
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Kop Kustom Aktif ({customKopSuratName || 'custom.png'})
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-medium self-start sm:self-auto">
                  Format Standar: Kemenkes & Poltekkes Bandung
                </span>
              )}
            </div>

            {/* Pratinjau Tampilan Header Kop Surat */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-slate-400" />
                  Pratinjau Kop Surat Saat Dicetak di PDF:
                </span>
                {customKopSurat && (
                  <button
                    type="button"
                    onClick={handleResetKopSurat}
                    className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Kembalikan ke Kop Bawaan
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-2.5 overflow-hidden shadow-2xs">
                <img
                  src={customKopSurat || '/kop-surat.svg'}
                  alt="Kop Surat Laporan Resmi"
                  className="w-full h-auto max-h-24 object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={kopFileInputRef}
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessKopFile(file);
              }}
              className="hidden"
            />

            {/* Drag and Drop Zone & Upload Buttons */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingKop(true);
              }}
              onDragLeave={() => setIsDraggingKop(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingKop(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessKopFile(file);
              }}
              className={`border-2 border-dashed rounded-xl p-3 sm:p-4 text-center transition-all ${
                isDraggingKop
                  ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                  : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-center sm:text-left space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    {customKopSurat ? 'Ingin mengganti gambar kop surat?' : 'Sesuaikan Kop Surat dengan Gambar Anda'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Klik tombol untuk memilih atau seret & lepas file gambar (PNG / JPG, maks. 6 MB).
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <button
                    type="button"
                    onClick={() => kopFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customKopSurat ? 'Ganti File Gambar' : 'Upload Gambar Kop'}</span>
                  </button>

                  {customKopSurat && (
                    <button
                      type="button"
                      onClick={handleResetKopSurat}
                      title="Hapus gambar kustom dan gunakan kop resmi bawaan"
                      className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error message */}
            {kopUploadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{kopUploadError}</span>
              </div>
            )}

            {/* Success toast notification */}
            {uploadSuccessToast && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccessToast}</span>
              </div>
            )}

            <p className="text-[10px] text-slate-400">
              💡 Rekomendasi: Gunakan gambar berorientasi horizontal/lanskap (rasio ~5:1 atau 6:1) berlatar belakang putih atau transparan untuk hasil laporan yang simetris dan rapi.
            </p>
          </div>

          {/* 3. FILTER TAMBAHAN: STATUS & WILAYAH */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>2. Filter Tambahan (Opsional):</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Status Validasi Berkas:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="All">Semua Status (Valid, Menunggu, Ditolak)</option>
                  <option value="Valid">Hanya Valid / Disetujui</option>
                  <option value="Menunggu Validasi">Hanya Menunggu Validasi</option>
                  <option value="Ditolak">Hanya Ditolak</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Wilayah Penugasan:
                </span>
                <select
                  value={lokasiFilter}
                  onChange={(e) => setLokasiFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="All">Semua Wilayah Penugasan</option>
                  <option value="Kota Bandung">Kota Bandung</option>
                  <option value="Kabupaten Bandung">Kabupaten Bandung</option>
                  <option value="Kota Bogor">Kota Bogor</option>
                  <option value="Kabupaten Bogor">Kabupaten Bogor</option>
                  <option value="Kota Karawang">Kota Karawang</option>
                  <option value="Kabupaten Karawang">Kabupaten Karawang</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. RINGKASAN PRATINJAU HASIL FILTER */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pratinjau Data Siap Cetak
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {matchedSubmissions.length} Berkas Ditemukan
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-emerald-400 font-semibold">Disetujui (Valid)</p>
                <p className="text-lg font-black text-white mt-0.5">{validCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-amber-400 font-semibold">Menunggu</p>
                <p className="text-lg font-black text-white mt-0.5">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-rose-400 font-semibold">Ditolak</p>
                <p className="text-lg font-black text-white mt-0.5">{rejectedCount}</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 pt-1 space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="text-slate-400">Label Laporan:</span>
                <span className="font-semibold text-white">{periodLabel}</span>
              </p>
              <p className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                <span>Nama File:</span>
                <span className="text-indigo-300">{filenamePrefix}.pdf</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecuteDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>
              {isGenerating
                ? 'Sedang Memproses PDF...'
                : `Unduh Laporan PDF (${matchedSubmissions.length} Berkas)`}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
