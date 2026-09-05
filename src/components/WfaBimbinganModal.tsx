import React, { useState, useEffect, useId } from 'react';
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
  ExternalLink,
  ChevronRight,
  Sparkles,
  Building2,
  HelpCircle,
  Send,
  RotateCcw,
  Check,
  Briefcase
} from 'lucide-react';
import { WfaSubmission, WfaLocation, EmployeeRecord } from '../types';
import { findEmployeeByNip, searchEmployees, POLTEKKES_EMPLOYEES } from '../data/employeeDatabase';

interface WfaBimbinganModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submission: Omit<WfaSubmission, 'id' | 'status' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  allSubmissions: WfaSubmission[];
  logoUrl?: string;
}

export const WfaBimbinganModal: React.FC<WfaBimbinganModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allSubmissions,
  logoUrl = 'https://poltekkesbandung.ac.id/wp-content/uploads/2026/05/cropped-logo-transparan-2.png',
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
  } | null>(null);

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

    // Mandate: "semua data wajib di isi jika salah satu data kosong ketika klik tombol ajukan muncul informasi data tidak boleh kosong"
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
  // Mandate:
  // "jika pengelola sudah merubah status pengajuan menjadi valid maka status pengajuan pegawai muncul keterangan pengajuan WFA anda pada tanggal tersebut sudah "VALID dan Sudah terjadwal WFA" jika belum maka muncul keterangan "pengajuan anda masih dalam proses, silahkan hubungi tim kerja OSDM""
  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkNip.trim() || !checkTanggal.trim()) {
      alert('Mohon isi NIP dan Tanggal WFA yang ingin diperiksa.');
      return;
    }

    const cleanInputNip = checkNip.replace(/[\s.-]/g, '').trim();
    const cleanDate = checkTanggal.trim();

    // Match in submissions
    const matched = allSubmissions.find((item) => {
      const itemNip = item.nip.replace(/[\s.-]/g, '').trim();
      return itemNip === cleanInputNip && item.tanggalWfa === cleanDate;
    });

    if (!matched) {
      setCheckResult({
        searched: true,
        found: false,
      });
      return;
    }

    if (matched.status === 'Valid') {
      setCheckResult({
        searched: true,
        found: true,
        submission: matched,
        statusText: 'pengajuan WFA anda pada tanggal tersebut sudah "VALID dan Sudah terjadwal WFA"',
        isSuccessState: true,
      });
    } else {
      // Pending or other non-valid state
      setCheckResult({
        searched: true,
        found: true,
        submission: matched,
        statusText: 'pengajuan anda masih dalam proses, silahkan hubungi tim kerja OSDM',
        isPendingState: true,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            aria-label="Tutup Formulir"
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="pt-6 pb-4 px-6 border-b border-slate-800 bg-gradient-to-b from-slate-800/60 to-slate-900 shrink-0 text-center">
            {/* Centered Institutional Logo Branding */}
            <div className="flex items-center justify-center pb-3 mb-3 border-b border-slate-800/80">
              <div className="inline-flex items-center justify-center bg-white px-4 py-2 rounded-xl border border-white/20 shadow-md">
                {!hasImgError && logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Resmi Poltekkes Kemenkes Bandung"
                    className="h-8 sm:h-9 w-auto max-w-[240px] object-contain"
                    referrerPolicy="no-referrer"
                    onError={() => setHasImgError(true)}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs tracking-tight">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>POLTEKKES KEMENKES BANDUNG</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Layanan Kepegawaian & SDM Terpadu</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Formulir Pengajuan WFA Bimbingan
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1">
              Pengajuan jadwal Work From Anywhere (WFA) bimbingan mahasiswa di wilayah Kota/Kabupaten Bandung dan cek validasi status OSDM.
            </p>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-center gap-2 mt-4 max-w-sm mx-auto p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('form');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'check'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Pengecekan Pengajuan</span>
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
            {/* Error Notification Alert */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-start gap-3 shadow-md"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs sm:text-sm">
                  <p className="font-bold text-rose-200">Perhatian:</p>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-200 text-xs"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* TAB 1: FORMULIR PENGAJUAN */}
            {activeTab === 'form' && (
              <>
                {successMessage ? (
                  /* Success Screen after submission */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        ✓ Berhasil Terkirim ke Sistem OSDM
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        {successMessage}
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                        Data jadwal WFA Anda telah tersimpan secara resmi di database kepegawaian Poltekkes Kemenkes Bandung. Anda dapat mengecek status persetujuan kapan saja menggunakan NIP dan tanggal kegiatan.
                      </p>
                    </div>

                    {/* Summary Card */}
                    {submittedData && (
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
                        <div className="flex justify-between pb-1.5 border-b border-slate-800 text-slate-400">
                          <span>NIP Pegawai:</span>
                          <span className="font-mono font-bold text-white">{submittedData.nip}</span>
                        </div>
                        <div className="flex justify-between pb-1.5 border-b border-slate-800 text-slate-400">
                          <span>Nama Pegawai:</span>
                          <span className="font-bold text-emerald-300">{submittedData.employeeName}</span>
                        </div>
                        <div className="flex justify-between pb-1.5 border-b border-slate-800 text-slate-400">
                          <span>Tanggal WFA:</span>
                          <span className="font-semibold text-white">{submittedData.tanggalWfa}</span>
                        </div>
                        <div className="flex justify-between pb-1.5 border-b border-slate-800 text-slate-400">
                          <span>Lokasi & Status:</span>
                          <span className="font-semibold text-amber-300">
                            {submittedData.lokasiKegiatan} ({submittedData.statusWfa})
                          </span>
                        </div>
                        <div className="flex justify-between pb-1.5 border-b border-slate-800 text-slate-400">
                          <span>Lahan Bimbingan:</span>
                          <span className="font-semibold text-emerald-300 text-right truncate max-w-[200px]">
                            {submittedData.lokasiLahanBimbingan}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Status Validasi:</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                            Menunggu Validasi Pengelola
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
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
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Search className="w-4 h-4" />
                        <span>Cek Status Pengajuan Ini</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ajukan Jadwal Lain</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitForm} className="space-y-4">
                    {/* FIELD 1: NIP (Berbasis Database) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${formId}-nip`} className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <span>Nomor Induk Pegawai (NIP)</span>
                          <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNipSuggestions(!showNipSuggestions)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" />
                          <span>Pilih dari Daftar Pegawai</span>
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          id={`${formId}-nip`}
                          type="text"
                          placeholder="Masukkan 18 digit NIP (contoh: 197508121998031002)..."
                          value={nip}
                          onChange={(e) => {
                            setNip(e.target.value);
                            setErrorMessage(null);
                          }}
                          className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border ${
                            isEmployeeFound
                              ? 'border-emerald-500/70 focus:border-emerald-400 text-white'
                              : 'border-slate-700 focus:border-emerald-500 text-slate-100'
                          } text-xs sm:text-sm font-mono focus:outline-none transition-colors placeholder:text-slate-500`}
                        />
                        {isEmployeeFound && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Terverifikasi</span>
                          </div>
                        )}
                      </div>

                      {/* Autocomplete / Quick Directory Popup */}
                      {showNipSuggestions && (
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-700 shadow-xl space-y-2 mt-1 max-h-56 overflow-y-auto">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-bold text-slate-300">
                              Pangkalan Data Pegawai Poltekkes Bandung:
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowNipSuggestions(false)}
                              className="text-slate-400 hover:text-white text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Cari nama atau NIP pegawai..."
                            value={nipSearchKeyword}
                            onChange={(e) => setNipSearchKeyword(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                          <div className="space-y-1 divide-y divide-slate-800/60">
                            {searchEmployees(nipSearchKeyword).map((emp) => (
                              <button
                                key={emp.nip}
                                type="button"
                                onClick={() => handleSelectEmployee(emp)}
                                className="w-full text-left py-2 px-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2 group"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 truncate">
                                    {emp.name}
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-400">
                                    NIP: {emp.nip} • {emp.unitKerja}
                                  </p>
                                </div>
                                <span className="text-xs text-emerald-400 shrink-0 font-semibold opacity-0 group-hover:opacity-100">
                                  Pilih →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400">
                        {isEmployeeFound ? (
                          <span className="text-emerald-400 font-medium">
                            ✓ Data NIP valid di sistem kepegawaian Poltekkes Kemenkes Bandung.
                          </span>
                        ) : (
                          'Ketik nomor NIP untuk memuat nama pegawai dan jabatan secara otomatis.'
                        )}
                      </p>
                    </div>

                    {/* AUTO-FILLED: NAMA PEGAWAI */}
                    <div className="space-y-1.5">
                      <label htmlFor={`${formId}-nama-pegawai`} className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Nama Pegawai</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id={`${formId}-nama-pegawai`}
                        type="text"
                        placeholder="Nama pegawai akan terisi otomatis setelah memasukkan NIP..."
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                      />
                      {unitKerja && (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                            <Building2 className="w-3 h-3 text-emerald-400" />
                            {unitKerja}
                          </span>
                          {jabatan && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                              <Briefcase className="w-3 h-3 text-amber-400" />
                              {jabatan}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* FIELD 2: TANGGAL WFA */}
                    <div className="space-y-1.5">
                      <label htmlFor={`${formId}-tanggal-wfa`} className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tanggal WFA</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id={`${formId}-tanggal-wfa`}
                        type="date"
                        value={tanggalWfa}
                        onChange={(e) => {
                          setTanggalWfa(e.target.value);
                          setErrorMessage(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        Pilih tanggal pelaksanaan bimbingan WFA di luar kampus.
                      </p>
                    </div>

                    {/* FIELD 3: NAMA KEGIATAN */}
                    <div className="space-y-1.5">
                      <label htmlFor={`${formId}-nama-kegiatan`} className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Nama Kegiatan</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        id={`${formId}-nama-kegiatan`}
                        rows={2}
                        placeholder="Contoh: Bimbingan Praktik Klinik Mahasiswa Kebidanan"
                        value={namaKegiatan}
                        onChange={(e) => {
                          setNamaKegiatan(e.target.value);
                          setErrorMessage(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 resize-none"
                      />
                    </div>

                    {/* FIELD 4: LOKASI KEGIATAN (Dropdown: Kota Bandung / Kabupaten Bandung) */}
                    <div className="space-y-1.5">
                      <label htmlFor={`${formId}-lokasi-kegiatan`} className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>Lokasi Kegiatan</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <select
                        id={`${formId}-lokasi-kegiatan`}
                        value={lokasiKegiatan}
                        onChange={(e) => handleLokasiChange(e.target.value as WfaLocation)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">-- Pilih Lokasi Kegiatan --</option>
                        <option value="Kota Bandung">Kota Bandung</option>
                        <option value="Kabupaten Bandung">Kabupaten Bandung</option>
                      </select>
                    </div>

                    {/* FIELD 5: KONDISI PILIHAN STATUS WFA SESUAI ATURAN LOKASI */}
                    {lokasiKegiatan === 'Kota Bandung' && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span>Pilihan Status WFA (Khusus Kota Bandung):</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                            Pilih Salah Satu
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Untuk lokasi kegiatan di Kota Bandung, sistem mewajibkan pilihan tunggal:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {/* Option 1: WFA Datang */}
                          <label
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              statusKota === 'WFA Datang'
                                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
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
                              className="mt-0.5 accent-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <p className="font-bold text-xs text-white">WFA Datang</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Presensi datang di lokasi bimbingan, kembali ke kantor sebelum jam pulang.
                              </p>
                            </div>
                          </label>

                          {/* Option 2: WFA Pulang */}
                          <label
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              statusKota === 'WFA Pulang'
                                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
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
                              className="mt-0.5 accent-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <p className="font-bold text-xs text-white">WFA Pulang</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Presensi datang di kantor direktorat, presensi pulang di lokasi bimbingan.
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
                        className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-400" />
                            <span>Pilihan Status WFA (Khusus Kabupaten Bandung):</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold">
                            Bisa Dipilih Keduanya
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Untuk lokasi kegiatan di Kabupaten Bandung, Anda dapat memilih WFA Datang, WFA Pulang, atau keduanya (WFA Datang dan WFA Pulang).
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {/* Checkbox 1: WFA Datang */}
                          <label
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              kabDatang
                                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={kabDatang}
                              onChange={(e) => {
                                setKabDatang(e.target.checked);
                                setErrorMessage(null);
                              }}
                              className="mt-0.5 accent-emerald-500 w-4 h-4 cursor-pointer rounded"
                            />
                            <div>
                              <p className="font-bold text-xs text-white">WFA Datang</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Presensi datang di lokasi bimbingan luar kantor.
                              </p>
                            </div>
                          </label>

                          {/* Checkbox 2: WFA Pulang */}
                          <label
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              kabPulang
                                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={kabPulang}
                              onChange={(e) => {
                                setKabPulang(e.target.checked);
                                setErrorMessage(null);
                              }}
                              className="mt-0.5 accent-emerald-500 w-4 h-4 cursor-pointer rounded"
                            />
                            <div>
                              <p className="font-bold text-xs text-white">WFA Pulang</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Presensi pulang di lokasi bimbingan luar kantor.
                              </p>
                            </div>
                          </label>
                        </div>

                        {kabDatang && kabPulang && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              Terpilih: <strong>WFA Datang & WFA Pulang</strong> (Full Day WFA Kabupaten Bandung).
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* FIELD 5: LOKASI LAHAN BIMBINGAN (TEXTBOX) */}
                    <div className="space-y-1.5">
                      <label htmlFor={`${formId}-lokasi-lahan-bimbingan`} className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lokasi Lahan Bimbingan</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id={`${formId}-lokasi-lahan-bimbingan`}
                        type="text"
                        placeholder="Contoh: RSUP Dr. Hasan Sadikin, RSUD Al-Ihsan, Puskesmas Ibrahim Adjie, Laboratorium..."
                        value={lokasiLahanBimbingan}
                        onChange={(e) => {
                          setLokasiLahanBimbingan(e.target.value);
                          setErrorMessage(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        Tuliskan nama rumah sakit, puskesmas, klinik, instansi, atau fasilitas lahan tempat bimbingan dilaksanakan.
                      </p>
                    </div>

                    {/* FIELD 6: LINK SURAT TUGAS */}
                    <div className="space-y-1.5">
                      <label htmlFor={`${formId}-link-surat-tugas`} className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Link Surat Tugas</span>
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
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        Salin tautan dokumen surat tugas (Google Drive).
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
                      >
                        Batal
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
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
                  </form>
                )}
              </>
            )}

            {/* TAB 2: PENGECEKAN PENGAJUAN (CEK STATUS MANDIRI) */}
            {activeTab === 'check' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Search className="w-4 h-4" />
                    <span>Pengecekan Status Pengajuan WFA Bimbingan</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Masukkan NIP dan Tanggal WFA Anda untuk memverifikasi apakah pengajuan telah divalidasi oleh tim pengelola kepegawaian OSDM.
                  </p>

                  <form onSubmit={handleCheckStatus} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label htmlFor={`${formId}-check-nip`} className="text-[11px] font-bold text-slate-300">NIP Pegawai:</label>
                      <input
                        id={`${formId}-check-nip`}
                        type="text"
                        placeholder="Masukkan 18 digit NIP..."
                        value={checkNip}
                        onChange={(e) => setCheckNip(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={`${formId}-check-tanggal`} className="text-[11px] font-bold text-slate-300">Tanggal WFA:</label>
                      <input
                        id={`${formId}-check-tanggal`}
                        type="date"
                        value={checkTanggal}
                        onChange={(e) => setCheckTanggal(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-1 flex items-center justify-end">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Search className="w-3.5 h-3.5" />
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
                    className="space-y-3"
                  >
                    {/* CONDITION 1: STATUS VALID */}
                    {checkResult.isSuccessState && checkResult.submission && (
                      <div className="p-5 rounded-3xl bg-emerald-950/50 border-2 border-emerald-400 shadow-xl text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>

                        <div>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
                            ✓ STATUS RESMI: VALID
                          </span>
                          
                          {/* Required exact phrasing */}
                          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                            pengajuan WFA anda telah &quot;VALID dan Sudah terjadwal WFA&quot;
                          </h3>
                        </div>

                        {/* Submission details card */}
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-left text-xs space-y-2 mt-3">
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>Nama Pegawai:</span>
                            <span className="font-bold text-emerald-300">{checkResult.submission.employeeName}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>NIP:</span>
                            <span className="font-mono text-white">{checkResult.submission.nip}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>Tanggal WFA:</span>
                            <span className="font-semibold text-white">{checkResult.submission.tanggalWfa}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>Lokasi & Jadwal:</span>
                            <span className="font-bold text-amber-300">
                              {checkResult.submission.lokasiKegiatan} — {checkResult.submission.statusWfa}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>Lahan Bimbingan:</span>
                            <span className="font-bold text-emerald-300 truncate max-w-[200px] sm:max-w-[280px]">
                              {checkResult.submission.lokasiLahanBimbingan || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>Kegiatan:</span>
                            <span className="font-medium text-slate-200 truncate max-w-[200px] sm:max-w-[280px]">
                              {checkResult.submission.namaKegiatan}
                            </span>
                          </div>
                          {checkResult.submission.validatedAt && (
                            <div className="flex justify-between text-slate-400 pt-0.5 text-[11px]">
                              <span>Divalidasi pada:</span>
                              <span className="text-emerald-400">
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
                      <div className="p-5 rounded-3xl bg-amber-950/40 border-2 border-amber-500/60 shadow-xl text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                          <Clock className="w-7 h-7 animate-pulse" />
                        </div>

                        <div>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs uppercase tracking-wider mb-2 border border-amber-500/40">
                            ⏳ STATUS: MENUNGGU VALIDASI
                          </span>
                          
                          {/* Required exact phrasing */}
                          <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                            pengajuan anda masih dalam proses, silahkan hubungi tim kerja OSDM
                          </h3>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-left text-xs space-y-2 mt-3">
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>Nama Pegawai:</span>
                            <span className="font-bold text-white">{checkResult.submission.employeeName}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>Tanggal WFA:</span>
                            <span className="font-mono text-white">{checkResult.submission.tanggalWfa}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span>Lahan Bimbingan:</span>
                            <span className="font-semibold text-emerald-300 truncate max-w-[200px] sm:max-w-[280px]">
                              {checkResult.submission.lokasiLahanBimbingan || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Status OSDM:</span>
                            <span className="font-bold text-amber-400">Dalam antrean verifikasi pengelola kepegawaian</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <a
                            href="https://wa.me/628119712525?text=Halo%20Tim%20Kerja%20OSDM%20Poltekkes%20Bandung,%20mohon%20konfirmasi%20validasi%20pengajuan%20WFA%20Bimbingan%20saya"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md"
                          >
                            <span>💬 Hubungi Tim Kerja OSDM (WhatsApp)</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* CONDITION 3: NOT FOUND */}
                    {!checkResult.found && (
                      <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-200">
                          Data Pengajuan Tidak Ditemukan
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                          Tidak ada data pengajuan WFA untuk NIP <span className="font-mono font-bold text-white">{checkNip}</span> pada tanggal <span className="font-bold text-white">{checkTanggal}</span>. Pastikan NIP dan tanggal yang dimasukkan sudah benar atau lakukan pengajuan baru.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setNip(checkNip);
                            setTanggalWfa(checkTanggal);
                            setActiveTab('form');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs transition-all border border-slate-700"
                        >
                          + Ajukan WFA Pada Tanggal Ini
                        </button>
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
