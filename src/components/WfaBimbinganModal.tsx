import React, { useState, useEffect, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  MapPin,
  FileText,
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Building2,
  Send,
  RotateCcw,
  Check,
  Briefcase,
  MessageCircle,
  ShieldCheck,
  Info
} from 'lucide-react';
import { WfaSubmission, WfaLocation, EmployeeRecord } from '../types';
import { findEmployeeByNip, searchEmployees } from '../data/employeeDatabase';

interface WfaBimbinganModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submission: Omit<WfaSubmission, 'id' | 'status' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  allSubmissions: WfaSubmission[];
  logoUrl?: string;
  osdmContactWa?: string;
}

export const WfaBimbinganModal: React.FC<WfaBimbinganModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allSubmissions,
  logoUrl = 'https://poltekkesbandung.ac.id/wp-content/uploads/2026/05/cropped-logo-transparan-2.png',
  osdmContactWa = '08119712525',
}) => {
  const formId = useId();
  // Mode: 'form' (Pengajuan Baru) vs 'check' (Pengecekan Pengajuan)
  const [activeTab, setActiveTab] = useState<'form' | 'check'>('form');

  // Form Fields
  const [nip, setNip] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [tanggalWfa, setTanggalWfa] = useState('');
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [lokasiKegiatan, setLokasiKegiatan] = useState<WfaLocation | ''>('');
  const [lokasiLahanBimbingan, setLokasiLahanBimbingan] = useState('');

  // Status WFA states:
  // For 'Kota Bandung': single choice 'WFA Datang' or 'WFA Pulang'
  const [statusKota, setStatusKota] = useState<'WFA Datang' | 'WFA Pulang' | ''>('');
  // For 'Kabupaten Bandung': checkboxes (can choose both)
  const [kabDatang, setKabDatang] = useState(false);
  const [kabPulang, setKabPulang] = useState(false);

  const [linkSuratTugas, setLinkSuratTugas] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [isEmployeeFound, setIsEmployeeFound] = useState(false);
  const [showNipSuggestions, setShowNipSuggestions] = useState(false);
  const [nipSearchKeyword, setNipSearchKeyword] = useState('');
  const [hasImgError, setHasImgError] = useState(false);

  // Status Checker States
  const [checkNip, setCheckNip] = useState('');
  const [checkTanggal, setCheckTanggal] = useState('');
  const [checkResult, setCheckResult] = useState<{
    searched: boolean;
    found: boolean;
    submission?: WfaSubmission;
    statusText?: string;
    isSuccessState?: boolean;
    isPendingState?: boolean;
    isRejectedState?: boolean;
  } | null>(null);

  // Calculate allowed date boundaries (Hari H s/d H+3 kalender, tidak boleh tanggal mundur)
  const { minDate, maxDate, formattedMinDate, formattedMaxDate } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const min = toYMD(now);
    const maxDateObj = new Date(now);
    maxDateObj.setDate(now.getDate() + 3);
    const max = toYMD(maxDateObj);

    const formatIndo = (d: Date) =>
      d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

    return {
      minDate: min,
      maxDate: max,
      formattedMinDate: formatIndo(now),
      formattedMaxDate: formatIndo(maxDateObj),
    };
  }, []);

  // Format WhatsApp number for international wa.me standard
  const { rawWaNumber, waLinkNumber } = useMemo(() => {
    const raw = (osdmContactWa || '08119712525').trim();
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    const intl = digitsOnly.startsWith('0')
      ? '62' + digitsOnly.slice(1)
      : digitsOnly.startsWith('62')
      ? digitsOnly
      : '62' + digitsOnly;
    return {
      rawWaNumber: raw,
      waLinkNumber: intl,
    };
  }, [osdmContactWa]);

  // Auto-detect employee name when NIP is changed
  useEffect(() => {
    if (!nip || nip.trim().length === 0) {
      setEmployeeName('');
      setUnitKerja('');
      setJabatan('');
      setIsEmployeeFound(false);
      return;
    }

    const matched = findEmployeeByNip(nip);
    if (matched) {
      setEmployeeName(matched.name);
      setUnitKerja(matched.unitKerja);
      setJabatan(matched.jabatan);
      setIsEmployeeFound(true);
    } else {
      setIsEmployeeFound(false);
    }
  }, [nip]);

  // When location changes, reset choices to prevent mismatched state
  const handleLokasiChange = (loc: WfaLocation | '') => {
    setLokasiKegiatan(loc);
    setStatusKota('');
    setKabDatang(false);
    setKabPulang(false);
    setErrorMessage(null);
  };

  // Select employee from autocomplete suggestion
  const handleSelectEmployee = (emp: EmployeeRecord) => {
    setNip(emp.nip);
    setEmployeeName(emp.name);
    setUnitKerja(emp.unitKerja);
    setJabatan(emp.jabatan);
    setIsEmployeeFound(true);
    setShowNipSuggestions(false);
    setErrorMessage(null);
  };

  // Reset form
  const handleResetForm = () => {
    setNip('');
    setEmployeeName('');
    setUnitKerja('');
    setJabatan('');
    setTanggalWfa('');
    setNamaKegiatan('');
    setLokasiKegiatan('');
    setLokasiLahanBimbingan('');
    setStatusKota('');
    setKabDatang(false);
    setKabPulang(false);
    setLinkSuratTugas('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmittedData(null);
  };

  // Determine computed statusWfa string
  const getComputedStatusWfa = (): string => {
    if (lokasiKegiatan === 'Kota Bandung') {
      return statusKota;
    }
    if (lokasiKegiatan === 'Kabupaten Bandung') {
      if (kabDatang && kabPulang) {
        return 'WFA Datang & WFA Pulang';
      }
      if (kabDatang) return 'WFA Datang';
      if (kabPulang) return 'WFA Pulang';
    }
    return '';
  };

  // Form Submission Handler
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Mandatory field checks
    const missingFields: string[] = [];

    if (!nip.trim()) missingFields.push('NIP Pegawai');
    if (!employeeName.trim()) missingFields.push('Nama Pegawai');
    if (!tanggalWfa.trim()) missingFields.push('Tanggal WFA');
    if (!namaKegiatan.trim()) missingFields.push('Nama Kegiatan');
    if (!lokasiKegiatan) missingFields.push('Lokasi Kegiatan');
    if (!lokasiLahanBimbingan.trim()) missingFields.push('Lokasi Lahan Bimbingan');

    const finalStatusWfa = getComputedStatusWfa();
    if (!finalStatusWfa) {
      missingFields.push('Pilihan Status WFA');
    }

    if (!linkSuratTugas.trim()) {
      missingFields.push('Link Surat Tugas');
    }

    if (missingFields.length > 0) {
      setErrorMessage(`Data tidak boleh kosong! Mohon lengkapi: ${missingFields.join(', ')}.`);
      return;
    }

    // 2. Strict Date Limits (Hari H s/d H+3 kalender, tidak boleh tanggal mundur)
    if (tanggalWfa < minDate) {
      setErrorMessage(
        `Pengajuan ditolak! Tanggal tidak boleh tanggal mundur. Pengajuan WFA hanya diperbolehkan mulai hari ini (${formattedMinDate}) sampai dengan H+3 hari kalender.`
      );
      return;
    }

    if (tanggalWfa > maxDate) {
      setErrorMessage(
        `Pengajuan ditolak! Batas waktu pengajuan maksimal sampai dengan H+3 hari kalender (${formattedMaxDate}). Tanggal yang Anda pilih melebihi batas waktu yang diizinkan.`
      );
      return;
    }

    // 3. Duplicate Submission Check (tidak boleh NIP sama mengajukan di tanggal yang sama dua kali)
    const cleanNip = nip.replace(/[\s.-]/g, '').trim();
    const cleanDate = tanggalWfa.trim();

    const duplicateSubmission = allSubmissions.find((sub) => {
      const subNip = sub.nip.replace(/[\s.-]/g, '').trim();
      return subNip === cleanNip && sub.tanggalWfa === cleanDate && sub.status !== 'Ditolak';
    });

    if (duplicateSubmission) {
      setErrorMessage(
        `Pengajuan DITOLAK! Pegawai dengan NIP ${nip.trim()} (${employeeName || 'Pegawai'}) sudah memiliki pengajuan WFA pada tanggal ${tanggalWfa} (Status saat ini: "${duplicateSubmission.status}"). Pegawai tidak diperbolehkan mengajukan WFA pada tanggal yang sama dua kali.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Omit<WfaSubmission, 'id' | 'status' | 'createdAt'> = {
        nip: nip.trim(),
        employeeName: employeeName.trim(),
        unitKerja: unitKerja.trim(),
        jabatan: jabatan.trim(),
        tanggalWfa: tanggalWfa.trim(),
        namaKegiatan: namaKegiatan.trim(),
        lokasiKegiatan: lokasiKegiatan as WfaLocation,
        lokasiLahanBimbingan: lokasiLahanBimbingan.trim(),
        statusWfa: finalStatusWfa,
        linkSuratTugas: linkSuratTugas.trim(),
      };

      const result = await onSubmit(payload);

      if (result.success) {
        // Required exact phrasing: "jadwal WFA berhasil di ajukan, mohon menunggu validasi dari pengelola kepegawaian"
        setSuccessMessage('jadwal WFA berhasil di ajukan, mohon menunggu validasi dari pengelola kepegawaian');
        setSubmittedData({
          ...payload,
          status: 'Menunggu Validasi',
        });
      } else {
        setErrorMessage(result.error || 'Terjadi kendala saat mengajukan. Silakan coba kembali.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengajukan jadwal WFA.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Check Handler
  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkNip.trim() || !checkTanggal.trim()) {
      alert('Mohon isi NIP dan Tanggal WFA yang ingin diperiksa.');
      return;
    }

    const cleanInputNip = checkNip.replace(/[\s.-]/g, '').trim();
    const cleanDate = checkTanggal.trim();

    // Match all submissions for this NIP and Date
    const matches = allSubmissions.filter((item) => {
      const itemNip = item.nip.replace(/[\s.-]/g, '').trim();
      return itemNip === cleanInputNip && item.tanggalWfa === cleanDate;
    });

    if (matches.length === 0) {
      setCheckResult({
        searched: true,
        found: false,
      });
      return;
    }

    // Sort to prioritize latest status update/creation
    const sorted = [...matches].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    const matched = sorted[0];

    if (matched.status === 'Valid') {
      setCheckResult({
        searched: true,
        found: true,
        submission: matched,
        statusText: 'pengajuan WFA anda pada tanggal tersebut sudah "VALID dan Sudah terjadwal WFA"',
        isSuccessState: true,
      });
    } else if (matched.status === 'Ditolak') {
      setCheckResult({
        searched: true,
        found: true,
        submission: matched,
        statusText: 'Pengajuan WFA Anda pada tanggal tersebut DITOLAK oleh pengelola kepegawaian (OSDM)',
        isRejectedState: true,
      });
    } else {
      // Pending / Menunggu Validasi
      setCheckResult({
        searched: true,
        found: true,
        submission: matched,
        statusText: 'pengajuan anda masih dalam proses, silahkan hubungi tim kerja OSDM',
        isPendingState: true,
      });
    }
  };

  // Real-time synchronization for check status screen when admin updates status or deletes data
  useEffect(() => {
    if (checkResult?.searched && checkNip && checkTanggal) {
      const cleanInputNip = checkNip.replace(/[\s.-]/g, '').trim();
      const cleanDate = checkTanggal.trim();

      const matches = allSubmissions.filter((item) => {
        const itemNip = item.nip.replace(/[\s.-]/g, '').trim();
        return itemNip === cleanInputNip && item.tanggalWfa === cleanDate;
      });

      if (matches.length > 0) {
        const sorted = [...matches].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        const matched = sorted[0];

        if (matched.status === 'Valid') {
          setCheckResult({
            searched: true,
            found: true,
            submission: matched,
            statusText: 'pengajuan WFA anda pada tanggal tersebut sudah "VALID dan Sudah terjadwal WFA"',
            isSuccessState: true,
          });
        } else if (matched.status === 'Ditolak') {
          setCheckResult({
            searched: true,
            found: true,
            submission: matched,
            statusText: 'Pengajuan WFA Anda pada tanggal tersebut DITOLAK oleh pengelola kepegawaian (OSDM)',
            isRejectedState: true,
          });
        } else {
          setCheckResult({
            searched: true,
            found: true,
            submission: matched,
            statusText: 'pengajuan anda masih dalam proses, silahkan hubungi tim kerja OSDM',
            isPendingState: true,
          });
        }
      } else {
        // Submission has been deleted by admin or removed from database
        setCheckResult({
          searched: true,
          found: false,
          statusText: 'Data pengajuan tidak ditemukan. Pengajuan Anda mungkin telah dihapus oleh pengelola kepegawaian (OSDM) atau belum terdaftar.',
        });
      }
    }
  }, [allSubmissions, checkNip, checkTanggal, checkResult?.searched]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-4xl xl:max-w-5xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            aria-label="Tutup Formulir"
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700 shadow-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header - Spacious and Institutional */}
          <div className="pt-6 pb-5 px-6 sm:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-800/70 via-slate-850 to-slate-900 shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Institutional Branding */}
              <div className="flex items-center gap-3.5">
                <div className="bg-white px-3.5 py-1.5 rounded-xl border border-white/20 shadow-md shrink-0">
                  {!hasImgError && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Poltekkes Kemenkes Bandung"
                      className="h-8 sm:h-9 w-auto max-w-[200px] object-contain"
                      referrerPolicy="no-referrer"
                      onError={() => setHasImgError(true)}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs tracking-tight">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span>POLTEKKES KEMENKES BANDUNG</span>
                    </div>
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase block">
                    OSDM Poltekkes Kemenkes Bandung
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                    Portal Layanan Pengajuan WFA Bimbingan
                  </h2>
                </div>
              </div>

              {/* Navigation Switch Tabs */}
              <div className="flex items-center p-1 bg-slate-950/90 rounded-2xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('form');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'form'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Formulir Pengajuan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('check');
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'check'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Pengecekan Status</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Modal Body - Generous Padding and Two-Column Proportions */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm">
            {/* Error Alert */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-start gap-3 shadow-md"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs sm:text-sm">
                  <p className="font-bold text-rose-200">Perhatian / Peringatan:</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200 text-xs px-2 py-1 rounded-md bg-rose-500/10"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* TAB 1: FORMULIR PENGAJUAN */}
            {activeTab === 'form' && (
              <>
                {successMessage ? (
                  /* Success Confirmation Screen */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-5 max-w-2xl mx-auto"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        ✓ Berhasil Terkirim ke Sistem OSDM
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        {successMessage}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                        Data jadwal WFA Anda telah tersimpan secara resmi di database kepegawaian Poltekkes Kemenkes Bandung. Anda dapat memantau status persetujuan kapan saja menggunakan NIP dan tanggal kegiatan pada tab Pengecekan.
                      </p>
                    </div>

                    {/* Summary Card */}
                    {submittedData && (
                      <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2.5 max-w-lg mx-auto shadow-inner">
                        <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                          <span>NIP Pegawai:</span>
                          <span className="font-mono font-bold text-white">{submittedData.nip}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                          <span>Nama Pegawai:</span>
                          <span className="font-bold text-emerald-300">{submittedData.employeeName}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                          <span>Tanggal Pelaksanaan WFA:</span>
                          <span className="font-semibold text-white">{submittedData.tanggalWfa}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                          <span>Lokasi & Status:</span>
                          <span className="font-semibold text-amber-300">
                            {submittedData.lokasiKegiatan} ({submittedData.statusWfa})
                          </span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                          <span>Lahan Bimbingan:</span>
                          <span className="font-semibold text-emerald-300 text-right truncate max-w-[240px]">
                            {submittedData.lokasiLahanBimbingan}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400 pt-1">
                          <span>Status Validasi:</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Menunggu Validasi Pengelola
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (submittedData) {
                            setCheckNip(submittedData.nip);
                            setCheckTanggal(submittedData.tanggalWfa);
                          }
                          setActiveTab('check');
                          setSuccessMessage(null);
                        }}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        <span>Cek Status Pengajuan Ini</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm transition-all border border-slate-700 flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Ajukan Jadwal Lain</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitForm} className="space-y-6">
                    {/* Policy Banner */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex items-start gap-3 text-xs text-slate-300">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold text-white">Ketentuan Pengajuan WFA Bimbingan:</span>
                        <p className="mt-0.5 text-slate-300">
                          Pengajuan hanya diperbolehkan mulai hari ini (<strong className="text-emerald-300">{formattedMinDate}</strong>) sampai dengan <strong className="text-emerald-300">H+3 hari kalender ({formattedMaxDate})</strong>. Tidak diperbolehkan memilih tanggal mundur dan tidak diperbolehkan mengajukan dua kali di tanggal yang sama.
                        </p>
                      </div>
                    </div>

                    {/* SECTION 1: DATA IDENTITAS PEGAWAI (2-Column Grid) */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <h4 className="font-bold text-sm text-white">1. Identitas Dosen / Pegawai</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNipSuggestions(!showNipSuggestions)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium flex items-center gap-1.5"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Pilih dari Pangkalan Data Pegawai</span>
                        </button>
                      </div>

                      {/* Autocomplete Directory Popup */}
                      {showNipSuggestions && (
                        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Pangkalan Data Pegawai Poltekkes Bandung:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowNipSuggestions(false)}
                              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                            >
                              Tutup ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Ketik nama atau 18 digit NIP pegawai untuk mencari..."
                            value={nipSearchKeyword}
                            onChange={(e) => setNipSearchKeyword(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                          <div className="space-y-1 divide-y divide-slate-800/60 max-h-56 overflow-y-auto pr-1">
                            {searchEmployees(nipSearchKeyword).map((emp) => (
                              <button
                                key={emp.nip}
                                type="button"
                                onClick={() => handleSelectEmployee(emp)}
                                className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-800/90 transition-colors flex items-center justify-between gap-3 group"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate">
                                    {emp.name}
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                    NIP: {emp.nip} • {emp.unitKerja}
                                  </p>
                                </div>
                                <span className="text-xs text-emerald-400 shrink-0 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  Pilih →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* FIELD 1: NIP */}
                        <div className="space-y-1.5">
                          <label htmlFor={`${formId}-nip`} className="text-xs font-bold text-slate-200 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span>Nomor Induk Pegawai (NIP)</span>
                              <span className="text-rose-400">*</span>
                            </span>
                            {isEmployeeFound && (
                              <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Terverifikasi</span>
                              </span>
                            )}
                          </label>

                          <div className="relative">
                            <input
                              id={`${formId}-nip`}
                              type="text"
                              placeholder="Masukkan 18 digit NIP..."
                              value={nip}
                              onChange={(e) => {
                                setNip(e.target.value);
                                setErrorMessage(null);
                              }}
                              className={`w-full px-4 py-3 rounded-xl bg-slate-900 border ${
                                isEmployeeFound
                                  ? 'border-emerald-500 focus:border-emerald-400 text-white'
                                  : 'border-slate-700 focus:border-emerald-500 text-slate-100'
                              } text-xs sm:text-sm font-mono focus:outline-none transition-colors placeholder:text-slate-500`}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {isEmployeeFound ? (
                              <span className="text-emerald-400 font-medium">
                                ✓ NIP terdaftar di database Poltekkes Bandung.
                              </span>
                            ) : (
                              'Ketik 18 digit NIP untuk memuat nama & unit kerja secara otomatis.'
                            )}
                          </p>
                        </div>

                        {/* FIELD 2: NAMA PEGAWAI */}
                        <div className="space-y-1.5">
                          <label htmlFor={`${formId}-nama-pegawai`} className="text-xs font-bold text-slate-200 flex items-center gap-1">
                            <span>Nama Lengkap Pegawai</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <input
                            id={`${formId}-nama-pegawai`}
                            type="text"
                            placeholder="Nama pegawai terisi otomatis dari NIP..."
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                          />
                          {unitKerja && (
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                                <Building2 className="w-3 h-3 text-emerald-400" />
                                <span>{unitKerja}</span>
                              </span>
                              {jabatan && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                                  <Briefcase className="w-3 h-3 text-amber-400" />
                                  <span>{jabatan}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: DETAIL WAKTU & LOKASI KEGIATAN (2-Column Grid) */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-sm text-white">2. Waktu & Lokasi Penugasan Bimbingan</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* FIELD 3: TANGGAL WFA (Restricted: Hari H s.d. H+3 kalender) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label htmlFor={`${formId}-tanggal-wfa`} className="text-xs font-bold text-slate-200 flex items-center gap-1">
                              <span>Tanggal Pelaksanaan WFA</span>
                              <span className="text-rose-400">*</span>
                            </label>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                              Hari H s/d H+3 Kalender
                            </span>
                          </div>

                          <input
                            id={`${formId}-tanggal-wfa`}
                            type="date"
                            min={minDate}
                            max={maxDate}
                            value={tanggalWfa}
                            onChange={(e) => {
                              setTanggalWfa(e.target.value);
                              setErrorMessage(null);
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-500"
                          />
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Rentang: {minDate} s/d {maxDate} (tidak boleh tanggal mundur).</span>
                          </p>
                        </div>

                        {/* FIELD 4: LOKASI KEGIATAN */}
                        <div className="space-y-1.5">
                          <label htmlFor={`${formId}-lokasi-kegiatan`} className="text-xs font-bold text-slate-200 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            <span>Wilayah Lokasi Kegiatan</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <select
                            id={`${formId}-lokasi-kegiatan`}
                            value={lokasiKegiatan}
                            onChange={(e) => handleLokasiChange(e.target.value as WfaLocation)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="">-- Pilih Wilayah Kegiatan --</option>
                            <option value="Kota Bandung">Kota Bandung</option>
                            <option value="Kabupaten Bandung">Kabupaten Bandung</option>
                          </select>
                          <p className="text-[11px] text-slate-400">
                            Pilih wilayah Kota Bandung atau Kabupaten Bandung sesuai penugasan.
                          </p>
                        </div>
                      </div>

                      {/* SECTION 2B: PILIHAN STATUS WFA SESUAI ATURAN WILAYAH */}
                      {lokasiKegiatan === 'Kota Bandung' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 sm:p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-indigo-200 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                              <span>Ketentuan Status Presensi (Khusus Kota Bandung):</span>
                              <span className="text-rose-400">*</span>
                            </label>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                              Wajib Pilih Salah Satu
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Option 1: WFA Datang */}
                            <label
                              className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                                statusKota === 'WFA Datang'
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="wfa-kota-choice"
                                value="WFA Datang"
                                checked={statusKota === 'WFA Datang'}
                                onChange={() => {
                                  setStatusKota('WFA Datang');
                                  setErrorMessage(null);
                                }}
                                className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <p className="font-bold text-xs sm:text-sm text-white">WFA Datang</p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  Presensi datang di lokasi bimbingan lapangan, presensi pulang di kantor direktorat sebelum jam pulang.
                                </p>
                              </div>
                            </label>

                            {/* Option 2: WFA Pulang */}
                            <label
                              className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                                statusKota === 'WFA Pulang'
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="wfa-kota-choice"
                                value="WFA Pulang"
                                checked={statusKota === 'WFA Pulang'}
                                onChange={() => {
                                  setStatusKota('WFA Pulang');
                                  setErrorMessage(null);
                                }}
                                className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <p className="font-bold text-xs sm:text-sm text-white">WFA Pulang</p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  Presensi datang di kantor direktorat, presensi pulang di lokasi bimbingan lapangan.
                                </p>
                              </div>
                            </label>
                          </div>
                        </motion.div>
                      )}

                      {lokasiKegiatan === 'Kabupaten Bandung' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 sm:p-5 rounded-2xl bg-teal-950/30 border border-teal-500/40 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-teal-200 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                              <span>Ketentuan Status Presensi (Khusus Kabupaten Bandung):</span>
                              <span className="text-rose-400">*</span>
                            </label>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                              Dapat Dipilih Salah Satu atau Keduanya
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Checkbox 1: WFA Datang */}
                            <label
                              className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                                kabDatang
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={kabDatang}
                                onChange={(e) => {
                                  setKabDatang(e.target.checked);
                                  setErrorMessage(null);
                                }}
                                className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer rounded"
                              />
                              <div>
                                <p className="font-bold text-xs sm:text-sm text-white">WFA Datang</p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  Presensi datang dilakukan di lokasi bimbingan luar kampus.
                                </p>
                              </div>
                            </label>

                            {/* Checkbox 2: WFA Pulang */}
                            <label
                              className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                                kabPulang
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={kabPulang}
                                onChange={(e) => {
                                  setKabPulang(e.target.checked);
                                  setErrorMessage(null);
                                }}
                                className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer rounded"
                              />
                              <div>
                                <p className="font-bold text-xs sm:text-sm text-white">WFA Pulang</p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  Presensi pulang dilakukan di lokasi bimbingan luar kampus.
                                </p>
                              </div>
                            </label>
                          </div>

                          {kabDatang && kabPulang && (
                            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>
                                Terpilih: <strong>WFA Datang & WFA Pulang</strong> (Full Day WFA Kabupaten Bandung).
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* SECTION 3: FASILITAS LAHAN & DOKUMEN (2-Column Grid) */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Briefcase className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-sm text-white">3. Detail Lahan Bimbingan & Berkas Tugas</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* FIELD 5: LOKASI LAHAN BIMBINGAN */}
                        <div className="space-y-1.5">
                          <label htmlFor={`${formId}-lokasi-lahan-bimbingan`} className="text-xs font-bold text-slate-200 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Lokasi Lahan Bimbingan</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <input
                            id={`${formId}-lokasi-lahan-bimbingan`}
                            type="text"
                            placeholder="Contoh: RSUP Dr. Hasan Sadikin, RSUD Al-Ihsan, Puskesmas Ibrahim Adjie..."
                            value={lokasiLahanBimbingan}
                            onChange={(e) => {
                              setLokasiLahanBimbingan(e.target.value);
                              setErrorMessage(null);
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                          />
                          <p className="text-[11px] text-slate-400">
                            Nama rumah sakit, puskesmas, klinik, atau fasilitas lahan bimbingan.
                          </p>
                        </div>

                        {/* FIELD 6: LINK SURAT TUGAS */}
                        <div className="space-y-1.5">
                          <label htmlFor={`${formId}-link-surat-tugas`} className="text-xs font-bold text-slate-200 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Link Surat Tugas (Google Drive)</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <input
                            id={`${formId}-link-surat-tugas`}
                            type="url"
                            placeholder="https://tautan Google Drive surat tugas resmi"
                            value={linkSuratTugas}
                            onChange={(e) => {
                              setLinkSuratTugas(e.target.value);
                              setErrorMessage(null);
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                          />
                          <p className="text-[11px] text-slate-400">
                            Salin tautan dokumen surat tugas (pastikan akses tautan dapat dilihat oleh pengelola).
                          </p>
                        </div>
                      </div>

                      {/* FIELD 7: NAMA KEGIATAN (Full Width) */}
                      <div className="space-y-1.5 pt-1">
                        <label htmlFor={`${formId}-nama-kegiatan`} className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Deskripsi Nama Kegiatan Bimbingan</span>
                          <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          id={`${formId}-nama-kegiatan`}
                          rows={2}
                          placeholder="Contoh: Bimbingan Praktik Klinik Keperawatan / Kebidanan Mahasiswa Semester VI"
                          value={namaKegiatan}
                          onChange={(e) => {
                            setNamaKegiatan(e.target.value);
                            setErrorMessage(null);
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                      <p className="text-[11px] text-slate-400 text-center sm:text-left">
                        Pastikan seluruh data penugasan telah sesuai sebelum menekan tombol ajukan.
                      </p>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-all border border-slate-700"
                        >
                          Batal
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`flex-1 sm:flex-none px-7 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                            isSubmitting
                              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              <span>Memproses Pengajuan...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Ajukan Jadwal WFA</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* TAB 2: PENGECEKAN PENGAJUAN (CEK STATUS MANDIRI) */}
            {activeTab === 'check' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5 text-emerald-400 text-sm font-bold">
                      <Search className="w-4 h-4" />
                      <span>Pengecekan Status Pengajuan WFA Bimbingan</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Server OSDM Terhubung (Real-time)</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Masukkan NIP dan Tanggal WFA Anda untuk memverifikasi apakah pengajuan telah divalidasi oleh tim kerja OSDM Poltekkes Kemenkes Bandung.
                  </p>

                  <form onSubmit={handleCheckStatus} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label htmlFor={`${formId}-check-nip`} className="text-xs font-bold text-slate-300">
                        NIP Pegawai:
                      </label>
                      <input
                        id={`${formId}-check-nip`}
                        type="text"
                        placeholder="Masukkan 18 digit NIP..."
                        value={checkNip}
                        onChange={(e) => setCheckNip(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor={`${formId}-check-tanggal`} className="text-xs font-bold text-slate-300">
                        Tanggal WFA:
                      </label>
                      <input
                        id={`${formId}-check-tanggal`}
                        type="date"
                        value={checkTanggal}
                        onChange={(e) => setCheckTanggal(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        <span>Cek Status Pengajuan</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* RESULT DISPLAY */}
                {checkResult?.searched && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* CONDITION 1: STATUS VALID */}
                    {checkResult.isSuccessState && checkResult.submission && (
                      <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/50 border-2 border-emerald-400 shadow-xl text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>

                        <div>
                          <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
                            ✓ STATUS RESMI: VALID
                          </span>

                          {/* Required exact phrasing */}
                          <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                            pengajuan WFA anda telah &quot;VALID dan Sudah terjadwal WFA&quot;
                          </h3>
                        </div>

                        {/* Submission details card */}
                        <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-left text-xs sm:text-sm space-y-2.5 mt-4 max-w-xl mx-auto shadow-inner">
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Nama Pegawai:</span>
                            <span className="font-bold text-emerald-300">{checkResult.submission.employeeName}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>NIP:</span>
                            <span className="font-mono text-white">{checkResult.submission.nip}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Tanggal WFA:</span>
                            <span className="font-semibold text-white">{checkResult.submission.tanggalWfa}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Lokasi & Jadwal:</span>
                            <span className="font-bold text-amber-300">
                              {checkResult.submission.lokasiKegiatan} — {checkResult.submission.statusWfa}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Lahan Bimbingan:</span>
                            <span className="font-bold text-emerald-300 truncate max-w-[240px] sm:max-w-[320px]">
                              {checkResult.submission.lokasiLahanBimbingan || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Kegiatan:</span>
                            <span className="font-medium text-slate-200 truncate max-w-[240px] sm:max-w-[320px]">
                              {checkResult.submission.namaKegiatan}
                            </span>
                          </div>
                          {checkResult.submission.validatedAt && (
                            <div className="flex justify-between text-slate-400 pt-0.5 text-xs">
                              <span>Divalidasi pada:</span>
                              <span className="text-emerald-400 font-medium">
                                {new Date(checkResult.submission.validatedAt).toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                          {checkResult.submission.linkSuratTugas && (
                            <div className="pt-2">
                              <a
                                href={checkResult.submission.linkSuratTugas}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 underline font-medium"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Lihat Surat Tugas Terlampir</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CONDITION 2: STATUS BELUM VALID (MASIH DALAM PROSES) */}
                    {checkResult.isPendingState && checkResult.submission && (
                      <div className="p-6 sm:p-8 rounded-3xl bg-amber-950/40 border-2 border-amber-500/60 shadow-xl text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                          <Clock className="w-8 h-8 animate-pulse" />
                        </div>

                        <div>
                          <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs uppercase tracking-wider mb-2 border border-amber-500/40">
                            ⏳ STATUS: MENUNGGU VALIDASI
                          </span>

                          {/* Required exact phrasing */}
                          <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                            pengajuan anda masih dalam proses, silahkan hubungi tim kerja OSDM
                          </h3>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-left text-xs sm:text-sm space-y-2.5 mt-4 max-w-xl mx-auto shadow-inner">
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Nama Pegawai:</span>
                            <span className="font-bold text-white">{checkResult.submission.employeeName}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Tanggal WFA:</span>
                            <span className="font-mono text-white">{checkResult.submission.tanggalWfa}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Lahan Bimbingan:</span>
                            <span className="font-semibold text-emerald-300 truncate max-w-[240px] sm:max-w-[320px]">
                              {checkResult.submission.lokasiLahanBimbingan || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400 pt-0.5">
                            <span>Status OSDM:</span>
                            <span className="font-bold text-amber-400">Dalam antrean verifikasi pengelola kepegawaian</span>
                          </div>
                        </div>

                        {/* WhatsApp Contact Button with Dynamic Number */}
                        <div className="pt-3">
                          <a
                            href={`https://wa.me/${waLinkNumber}?text=${encodeURIComponent(
                              `Halo Tim Kerja OSDM Poltekkes Bandung, saya ${checkResult.submission.employeeName} (NIP: ${checkResult.submission.nip}) ingin konfirmasi status pengajuan WFA Bimbingan saya untuk tanggal ${checkResult.submission.tanggalWfa}. Mohon bantuannya. Terima kasih.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>💬 Hubungi Tim Kerja OSDM (WhatsApp: {rawWaNumber})</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* CONDITION 3: STATUS DITOLAK / TIDAK DISETUJUI */}
                    {checkResult.isRejectedState && checkResult.submission && (
                      <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/50 border-2 border-rose-500/70 shadow-2xl text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-400 text-rose-400 flex items-center justify-center mx-auto shadow-sm">
                          <XCircle className="w-8 h-8" />
                        </div>

                        <div>
                          <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider mb-2 shadow-sm">
                            ❌ STATUS RESMI: PENGAJUAN DITOLAK
                          </span>

                          <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                            Pengajuan WFA Anda pada tanggal tersebut DITOLAK
                          </h3>
                          <p className="text-xs sm:text-sm text-rose-200 mt-1 max-w-lg mx-auto leading-relaxed">
                            Pengajuan tidak disetujui oleh pengelola kepegawaian (Tim Kerja OSDM Poltekkes Kemenkes Bandung).
                          </p>
                        </div>

                        {/* Reason / Catatan Pengelola Box */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-rose-500/40 text-left space-y-2.5 max-w-xl mx-auto shadow-inner">
                          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider pb-1 border-b border-rose-900/60">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Catatan &amp; Alasan Penolakan dari Admin OSDM:</span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-rose-100 bg-rose-950/40 p-3 rounded-xl border border-rose-900/50 leading-relaxed">
                            &quot;{checkResult.submission.catatanPengelola || 'Pengajuan berkas belum memenuhi persyaratan atau tidak sesuai ketentuan WFA Bimbingan. Silakan hubungi tim kerja OSDM untuk informasi lebih lanjut.'}&quot;
                          </p>
                          {checkResult.submission.validatedAt && (
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span>Waktu Peninjauan:</span>
                              <span className="font-mono text-slate-300">
                                {new Date(checkResult.submission.validatedAt).toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Submission details card */}
                        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs sm:text-sm space-y-2.5 max-w-xl mx-auto shadow-inner">
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Nama Pegawai:</span>
                            <span className="font-bold text-white">{checkResult.submission.employeeName}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>NIP:</span>
                            <span className="font-mono text-white">{checkResult.submission.nip}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Tanggal Pengajuan WFA:</span>
                            <span className="font-semibold text-rose-300">{checkResult.submission.tanggalWfa}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Lokasi &amp; Jadwal:</span>
                            <span className="font-medium text-slate-300">
                              {checkResult.submission.lokasiKegiatan} — {checkResult.submission.statusWfa}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                            <span>Lahan Bimbingan:</span>
                            <span className="font-medium text-slate-300 truncate max-w-[240px] sm:max-w-[320px]">
                              {checkResult.submission.lokasiLahanBimbingan || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400 pt-0.5">
                            <span>Status Sistem:</span>
                            <span className="font-bold text-rose-400">Ditolak / Perlu Pengajuan Ulang</span>
                          </div>
                        </div>

                        {/* Action Buttons: Ajukan Ulang / Hubungi WA */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
                          <button
                            type="button"
                            onClick={() => {
                              if (checkResult.submission) {
                                setNip(checkResult.submission.nip);
                                setEmployeeName(checkResult.submission.employeeName);
                                setUnitKerja(checkResult.submission.unitKerja || '');
                                setJabatan(checkResult.submission.jabatan || '');
                                setTanggalWfa(checkResult.submission.tanggalWfa);
                                setNamaKegiatan(checkResult.submission.namaKegiatan);
                                setLokasiKegiatan(checkResult.submission.lokasiKegiatan);
                                setLokasiLahanBimbingan(checkResult.submission.lokasiLahanBimbingan);
                                setLinkSuratTugas(checkResult.submission.linkSuratTugas);
                                setIsEmployeeFound(true);
                                setActiveTab('form');
                                setErrorMessage(null);
                              }
                            }}
                            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Ajukan Ulang / Perbaiki Berkas</span>
                          </button>

                          <a
                            href={`https://wa.me/${waLinkNumber}?text=${encodeURIComponent(
                              `Halo Tim Kerja OSDM Poltekkes Bandung, saya ${checkResult.submission.employeeName} (NIP: ${checkResult.submission.nip}) ingin konfirmasi dan klarifikasi mengenai pengajuan WFA Bimbingan saya pada tanggal ${checkResult.submission.tanggalWfa} yang berstatus DITOLAK (Catatan: "${checkResult.submission.catatanPengelola || '-'}"). Mohon petunjuk perbaikannya. Terima kasih.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Hubungi OSDM via WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* CONDITION 4: NOT FOUND / TELAH DIHAPUS */}
                    {!checkResult.found && (
                      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-200">
                          Data Pengajuan Tidak Ditemukan
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                          Tidak ditemukan berkas pengajuan WFA untuk NIP <span className="font-mono font-bold text-white">{checkNip}</span> pada tanggal <span className="font-bold text-white">{checkTanggal}</span>. Berkas pengajuan mungkin telah <span className="text-amber-300 font-semibold">dihapus / dibatalkan oleh pengelola kepegawaian (OSDM)</span> atau belum diajukan.
                        </p>
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setNip(checkNip);
                              setTanggalWfa(checkTanggal);
                              setActiveTab('form');
                            }}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                          >
                            <span>+ Ajukan Jadwal WFA Baru</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCheckStatus}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Cek Ulang Server</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
