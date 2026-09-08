import React, { useState, useEffect, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Heart,
  Activity,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Scale,
  Ruler,
  Droplet,
  Send,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Check,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { KebugaranSubmission, KebugaranPeriode, GulaDarahType, EmployeeRecord } from '../types';
import { findEmployeeByNip, searchEmployees, getActiveEmployees } from '../data/employeeDatabase';
import {
  extractBirthDateFromNip,
  formatTanggalIndo,
  generateOrGetNik,
  calculateBmi,
  classifyBloodPressure,
  classifyBloodSugar,
  classifyCholesterol
} from '../utils/kebugaranUtils';

interface KebugaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submission: Omit<KebugaranSubmission, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  logoUrl?: string;
  defaultPeriode?: KebugaranPeriode;
}

export const KebugaranModal: React.FC<KebugaranModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  logoUrl = 'https://poltekkesbandung.ac.id/wp-content/uploads/2026/05/cropped-logo-transparan-2.png',
  defaultPeriode
}) => {
  const formId = useId();

  // Determine current active quarter by month
  const currentQuarter = useMemo<KebugaranPeriode>(() => {
    if (defaultPeriode) return defaultPeriode;
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 1 && month <= 3) return 'Triwulan I';
    if (month >= 4 && month <= 6) return 'Triwulan II';
    if (month >= 7 && month <= 9) return 'Triwulan III';
    return 'Triwulan IV';
  }, [defaultPeriode]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Form States
  const [tanggalPeriksa, setTanggalPeriksa] = useState(todayStr);
  const [periode, setPeriode] = useState<KebugaranPeriode>(currentQuarter);
  
  // Pegawai fields
  const [nip, setNip] = useState('');
  const [namaPegawai, setNamaPegawai] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  const [nik, setNik] = useState('');

  // Vital & Physical Signs
  const [tensiSistolik, setTensiSistolik] = useState<number | ''>(120);
  const [tensiDiastolik, setTensiDiastolik] = useState<number | ''>(80);
  const [beratBadan, setBeratBadan] = useState<number | ''>(65);
  const [tinggiBadan, setTinggiBadan] = useState<number | ''>(165);
  const [lingkarPinggang, setLingkarPinggang] = useState<number | ''>(78);

  // Lab Results
  const [tipeGulaDarah, setTipeGulaDarah] = useState<GulaDarahType>('GDS');
  const [gulaDarah, setGulaDarah] = useState<number | ''>(110);
  const [kolesterol, setKolesterol] = useState<number | ''>(185);

  // Contact & Facility
  const [nomorWa, setNomorWa] = useState('');
  const [fasyankes, setFasyankes] = useState('Klinik Pratama Poltekkes Kemenkes Bandung');

  // UI States
  const [isEmployeeFound, setIsEmployeeFound] = useState(false);
  const [showNipSuggestions, setShowNipSuggestions] = useState(false);
  const [nipSearchKeyword, setNipSearchKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<KebugaranSubmission | null>(null);

  // Suggestions for NIP search
  const employeeSuggestions = useMemo(() => {
    if (!nipSearchKeyword || nipSearchKeyword.trim().length === 0) return [];
    return searchEmployees(nipSearchKeyword).slice(0, 6);
  }, [nipSearchKeyword]);

  // Handle NIP changes & auto-filling
  const handleNipInput = (rawVal: string) => {
    setNip(rawVal);
    setNipSearchKeyword(rawVal);
    setShowNipSuggestions(true);

    const clean = rawVal.replace(/[\s.-]/g, '').trim();
    if (clean.length >= 8) {
      const found = findEmployeeByNip(clean);
      if (found) {
        setNamaPegawai(found.name);
        setUnitKerja(found.unitKerja);
        if (found.nomorWa) setNomorWa(found.nomorWa);
        
        // Auto-extract birthdate
        const bdate = found.tanggalLahir || extractBirthDateFromNip(clean);
        if (bdate) setTanggalLahir(bdate);
        
        // Auto-extract or generate NIK
        const generatedNik = generateOrGetNik(clean, found.nik);
        if (generatedNik) setNik(generatedNik);

        setIsEmployeeFound(true);
      } else {
        setIsEmployeeFound(false);
        // Still attempt to extract birth date from NIP if 18-digit pattern matches
        const extractedDate = extractBirthDateFromNip(clean);
        if (extractedDate && !tanggalLahir) {
          setTanggalLahir(extractedDate);
        }
        if (!nik && clean.length >= 8) {
          setNik(generateOrGetNik(clean));
        }
      }
    } else {
      setIsEmployeeFound(false);
    }
  };

  // Select employee from autocomplete
  const handleSelectEmployee = (emp: EmployeeRecord) => {
    setNip(emp.nip);
    setNamaPegawai(emp.name);
    setUnitKerja(emp.unitKerja);
    if (emp.nomorWa) setNomorWa(emp.nomorWa);

    const bdate = emp.tanggalLahir || extractBirthDateFromNip(emp.nip);
    if (bdate) setTanggalLahir(bdate);

    const generatedNik = generateOrGetNik(emp.nip, emp.nik);
    if (generatedNik) setNik(generatedNik);

    setIsEmployeeFound(true);
    setShowNipSuggestions(false);
    setNipSearchKeyword('');
  };

  // Real-time calculated health indicators
  const currentBmi = useMemo(() => {
    return calculateBmi(Number(beratBadan) || 0, Number(tinggiBadan) || 0);
  }, [beratBadan, tinggiBadan]);

  const currentBp = useMemo(() => {
    return classifyBloodPressure(Number(tensiSistolik) || 0, Number(tensiDiastolik) || 0);
  }, [tensiSistolik, tensiDiastolik]);

  const currentBs = useMemo(() => {
    return classifyBloodSugar(Number(gulaDarah) || 0, tipeGulaDarah);
  }, [gulaDarah, tipeGulaDarah]);

  const currentChol = useMemo(() => {
    return classifyCholesterol(Number(kolesterol) || 0);
  }, [kolesterol]);

  // Reset form
  const handleResetForm = () => {
    setTanggalPeriksa(todayStr);
    setPeriode(currentQuarter);
    setNip('');
    setNamaPegawai('');
    setTanggalLahir('');
    setUnitKerja('');
    setNik('');
    setTensiSistolik(120);
    setTensiDiastolik(80);
    setBeratBadan(65);
    setTinggiBadan(165);
    setLingkarPinggang(78);
    setTipeGulaDarah('GDS');
    setGulaDarah(110);
    setKolesterol(185);
    setNomorWa('');
    setFasyankes('Klinik Pratama Poltekkes Kemenkes Bandung');
    setIsEmployeeFound(false);
    setErrorMessage(null);
    setSubmittedData(null);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!tanggalPeriksa) {
      setErrorMessage('Tanggal periksa kebugaran wajib diisi!');
      return;
    }
    if (!nip.trim()) {
      setErrorMessage('Nomor Induk Pegawai (NIP) wajib diisi!');
      return;
    }
    if (!namaPegawai.trim()) {
      setErrorMessage('Nama lengkap pegawai wajib diisi!');
      return;
    }
    if (!unitKerja.trim()) {
      setErrorMessage('Unit kerja / jurusan wajib diisi!');
      return;
    }
    if (!tensiSistolik || !tensiDiastolik) {
      setErrorMessage('Tekanan darah sistolik dan diastolik wajib diisi!');
      return;
    }
    if (!beratBadan || Number(beratBadan) <= 20) {
      setErrorMessage('Berat badan harus valid (minimal 20 kg)!');
      return;
    }
    if (!tinggiBadan || Number(tinggiBadan) <= 50) {
      setErrorMessage('Tinggi badan harus valid (minimal 50 cm)!');
      return;
    }
    if (!lingkarPinggang || Number(lingkarPinggang) <= 20) {
      setErrorMessage('Lingkar pinggang harus diisi dengan benar!');
      return;
    }
    if (!gulaDarah || Number(gulaDarah) <= 20) {
      setErrorMessage('Nilai gula darah wajib diisi dengan benar!');
      return;
    }
    if (!kolesterol || Number(kolesterol) <= 20) {
      setErrorMessage('Nilai kolesterol total wajib diisi dengan benar!');
      return;
    }
    if (!fasyankes.trim()) {
      setErrorMessage('Fasyankes tempat pemeriksaan kebugaran wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<KebugaranSubmission, 'id' | 'createdAt'> = {
        tanggalPeriksa,
        periode,
        nip: nip.trim(),
        namaPegawai: namaPegawai.trim(),
        tanggalLahir: tanggalLahir.trim(),
        unitKerja: unitKerja.trim(),
        nik: nik.trim() || generateOrGetNik(nip),
        tensiSistolik: Number(tensiSistolik),
        tensiDiastolik: Number(tensiDiastolik),
        beratBadan: Number(beratBadan),
        tinggiBadan: Number(tinggiBadan),
        lingkarPinggang: Number(lingkarPinggang),
        tipeGulaDarah,
        gulaDarah: Number(gulaDarah),
        kolesterol: Number(kolesterol),
        nomorWa: nomorWa.trim(),
        fasyankes: fasyankes.trim(),
        catatan: `Pemeriksaan Kebugaran ${periode} di ${fasyankes.trim()}`,
      };

      const result = await onSubmit(payload);
      if (result.success) {
        setSubmittedData({
          ...payload,
          id: `kbg-${Date.now()}`,
          createdAt: new Date().toISOString()
        });
      } else {
        setErrorMessage(result.error || 'Gagal menyimpan data kebugaran.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Floating Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner shrink-0 backdrop-blur-xs">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase mb-1">
                <Sparkles className="w-3 h-3 text-sky-200" />
                <span>Formulir Melayang Resmi OSDM</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Formulir Input Data Kebugaran
              </h2>
              <p className="text-xs text-sky-100/90 hidden sm:block">
                Pencatatan data kesehatan berkala pegawai Poltekkes Kemenkes Bandung
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors border border-white/20"
            title="Tutup Formulir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1 bg-slate-50/60">
          {submittedData ? (
            /* SUCCESS SUBMITTED VIEW */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-300 shadow-sm animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900">
                  Data Kebugaran Berhasil Disimpan!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Data hasil pemeriksaan kebugaran pegawai atas nama{' '}
                  <strong className="text-slate-900">{submittedData.namaPegawai}</strong> ({submittedData.periode}) telah tercatat di sistem monitoring.
                </p>
              </div>

              {/* Summary Card */}
              <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 text-left shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs text-slate-500 font-medium">Periode / Tanggal:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {submittedData.periode} • {formatTanggalIndo(submittedData.tanggalPeriksa)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">NIP:</span>
                    <span className="font-mono font-semibold text-slate-700">{submittedData.nip}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Unit Kerja:</span>
                    <span className="font-semibold text-slate-700">{submittedData.unitKerja}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tensi Darah:</span>
                    <span className="font-bold text-slate-800">{submittedData.tensiSistolik}/{submittedData.tensiDiastolik} mmHg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">BB / TB / IMT:</span>
                    <span className="font-bold text-slate-800">
                      {submittedData.beratBadan} kg / {submittedData.tinggiBadan} cm ({calculateBmi(submittedData.beratBadan, submittedData.tinggiBadan).bmi})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gula Darah ({submittedData.tipeGulaDarah}):</span>
                    <span className="font-bold text-slate-800">{submittedData.gulaDarah} mg/dL</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kolesterol Total:</span>
                    <span className="font-bold text-slate-800">{submittedData.kolesterol} mg/dL</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Fasyankes:</span>
                  <span className="font-medium text-slate-700">{submittedData.fasyankes}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Input Data Pegawai Lain</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : (
            /* FORM VIEW */
            <form id={formId} onSubmit={handleSubmit} className="space-y-6">
              {/* Alert / Error Banner */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* SEKSI 1: WAKTU & PERIODE */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>1. Waktu & Periode Pemeriksaan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tanggal Periksa */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tanggal Periksa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggalPeriksa}
                      onChange={(e) => setTanggalPeriksa(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatTanggalIndo(tanggalPeriksa)}
                    </span>
                  </div>

                  {/* Dropdown Periode (Triwulan I s.d Triwulan IV) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Periode Pemeriksaan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={periode}
                      onChange={(e) => setPeriode(e.target.value as KebugaranPeriode)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                    >
                      <option value="Triwulan I">Triwulan I (Januari - Maret)</option>
                      <option value="Triwulan II">Triwulan II (April - Juni)</option>
                      <option value="Triwulan III">Triwulan III (Juli - September)</option>
                      <option value="Triwulan IV">Triwulan IV (Oktober - Desember)</option>
                    </select>
                    <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                      Jadwal Pemeriksaan Kebugaran Berkala {periode}
                    </span>
                  </div>
                </div>
              </div>

              {/* SEKSI 2: IDENTITAS PEGAWAI (NIP Auto-fill) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>2. Identitas Pegawai (NIP & Otomatis)</span>
                  </div>
                  {isEmployeeFound && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Data Terverifikasi
                    </span>
                  )}
                </div>

                {/* NIP Input with Autocomplete Suggestions */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    NIP Pegawai (Nomor Induk Pegawai) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ketik NIP atau nama pegawai (contoh: 19700921...)"
                      value={nip}
                      onChange={(e) => handleNipInput(e.target.value)}
                      onFocus={() => {
                        if (nip.trim().length > 0) setShowNipSuggestions(true);
                      }}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Cukup ketik NIP, nama pegawai, tanggal lahir, unit kerja, dan NIK akan langsung terisi otomatis.
                  </p>

                  {/* Autocomplete Dropdown */}
                  {showNipSuggestions && employeeSuggestions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {employeeSuggestions.map((item) => (
                        <button
                          key={item.nip}
                          type="button"
                          onClick={() => handleSelectEmployee(item)}
                          className="w-full px-3.5 py-2 text-left hover:bg-sky-50 transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
                              <span>NIP: {item.nip}</span>
                              <span>•</span>
                              <span>{item.unitKerja}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            Pilih
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto-filled Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Nama Pegawai */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Lengkap Pegawai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama pegawai otomatis muncul..."
                      value={namaPegawai}
                      onChange={(e) => setNamaPegawai(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                        isEmployeeFound ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  {/* Tanggal Lahir (Otomatis dari NIP) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Tanggal Lahir Pegawai <span className="text-rose-500">*</span>
                      </label>
                      {tanggalLahir && (
                        <span className="text-[10px] font-semibold text-blue-600">
                          {formatTanggalIndo(tanggalLahir)}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      required
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* Unit Kerja */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Unit Kerja / Jurusan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Keperawatan Bandung, Kebidanan, TLM..."
                      value={unitKerja}
                      onChange={(e) => setUnitKerja(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>

                  {/* NIK (Nomor Induk Kependudukan 16 Digit) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NIK (Nomor Induk Kependudukan) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="16 digit NIK..."
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 3: PEMERIKSAAN FISIK & VITAL */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>3. Tensi Darah & Antropometri Fisik</span>
                  </div>
                </div>

                {/* Tensi Sistolik & Diastolik */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Tekanan Darah (Tensi) <span className="text-rose-500">*</span>
                    </label>
                    {tensiSistolik && tensiDiastolik && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentBp.badgeBg}`}>
                        {currentBp.label}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min={60}
                          max={260}
                          placeholder="120"
                          value={tensiSistolik}
                          onChange={(e) => setTensiSistolik(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full pl-3 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                          Sistolik
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Satuan: mmHg</span>
                    </div>

                    <div>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min={40}
                          max={160}
                          placeholder="80"
                          value={tensiDiastolik}
                          onChange={(e) => setTensiDiastolik(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full pl-3 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                          Diastolik
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Satuan: mmHg</span>
                    </div>
                  </div>
                </div>

                {/* Berat Badan, Tinggi Badan, Lingkar Pinggang */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  {/* Berat Badan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-blue-600" />
                      <span>Berat Badan (kg) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min={25}
                      max={220}
                      placeholder="65"
                      value={beratBadan}
                      onChange={(e) => setBeratBadan(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  {/* Tinggi Badan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tinggi Badan (cm) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      max={220}
                      placeholder="165"
                      value={tinggiBadan}
                      onChange={(e) => setTinggiBadan(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  {/* Lingkar Pinggang */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <span>Lingkar Pinggang (cm) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="number"
                      required
                      min={40}
                      max={180}
                      placeholder="78"
                      value={lingkarPinggang}
                      onChange={(e) => setLingkarPinggang(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* IMT Calculator Preview Badge */}
                {beratBadan && tinggiBadan && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-900">Indeks Massa Tubuh (IMT):</span>
                      <span className="font-mono font-extrabold text-blue-700 text-sm">{currentBmi.bmi}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentBmi.badgeBg}`}>
                      {currentBmi.label}
                    </span>
                  </div>
                )}
              </div>

              {/* SEKSI 4: HASIL LAB (GULA DARAH & KOLESTEROL) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <Droplet className="w-4 h-4 text-rose-600" />
                  <span>4. Hasil Laboratorium Kebugaran</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gula Darah with GDS / GDP toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Gula Darah (GDS / GDP) <span className="text-rose-500">*</span>
                      </label>
                      {gulaDarah && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentBs.badgeBg}`}>
                          {currentBs.label}
                        </span>
                      )}
                    </div>

                    {/* Radio Switch: GDS vs GDP */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTipeGulaDarah('GDS')}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                          tipeGulaDarah === 'GDS'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        GDS (Sewaktu)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipeGulaDarah('GDP')}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                          tipeGulaDarah === 'GDP'
                            ? 'bg-white text-blue-600 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        GDP (Puasa)
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={40}
                        max={600}
                        placeholder="110"
                        value={gulaDarah}
                        onChange={(e) => setGulaDarah(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-3 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                        mg/dL
                      </span>
                    </div>
                  </div>

                  {/* Kolesterol Total */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Kolesterol Total <span className="text-rose-500">*</span>
                      </label>
                      {kolesterol && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentChol.badgeBg}`}>
                          {currentChol.label}
                        </span>
                      )}
                    </div>

                    <div className="h-[38px] flex items-center text-xs text-slate-500">
                      <span>Pemeriksaan kolesterol darah kapiler / vena</span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={70}
                        max={500}
                        placeholder="185"
                        value={kolesterol}
                        onChange={(e) => setKolesterol(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-3 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                        mg/dL
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEKSI 5: KONTAK & FASYANKES */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>5. Kontak & Fasilitas Pelayanan Kesehatan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nomor WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nomor WhatsApp Pegawai <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 08123456789"
                      value={nomorWa}
                      onChange={(e) => setNomorWa(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Untuk konfirmasi dan pengiriman e-sertifikat/rekap tes kebugaran
                    </span>
                  </div>

                  {/* Fasyankes Pemeriksaan Kebugaran */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Fasyankes Pemeriksaan Kebugaran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Fasyankes tempat pemeriksaan..."
                      value={fasyankes}
                      onChange={(e) => setFasyankes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />

                    {/* Quick presets for Fasyankes */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        'Klinik Pratama Poltekkes Kemenkes Bandung',
                        'Laboratorium Terpadu Poltekkes Bandung',
                        'RSUP Dr. Hasan Sadikin Bandung',
                        'Puskesmas Pasirkaliki'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFasyankes(preset)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                            fasyankes === preset
                              ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {preset.split(' ')[0]} {preset.split(' ')[1] || ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                    title="Bersihkan Isian"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Simpan Data Kebugaran</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
