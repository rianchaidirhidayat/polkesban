import React from 'react';
import { Printer, X, FileText, CheckCircle2, Building, ShieldCheck } from 'lucide-react';
import { KebugaranSubmission } from '../types';
import { formatTanggalIndo, calculateBmi, classifyBloodPressure, classifyBloodSugar, classifyCholesterol } from '../utils/kebugaranUtils';

interface KebugaranPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: KebugaranSubmission[];
  periodeFilter: string;
  unitFilter: string;
}

export const KebugaranPrintModal: React.FC<KebugaranPrintModalProps> = ({
  isOpen,
  onClose,
  submissions,
  periodeFilter,
  unitFilter,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = formatTanggalIndo(new Date().toISOString().slice(0, 10));

  // Summary counts for printed report
  const totalSubmissions = submissions.length;
  const normalBpCount = submissions.filter((s) => s.tensiSistolik < 120 && s.tensiDiastolik < 80).length;
  const normalCholCount = submissions.filter((s) => s.kolesterol < 200).length;
  const idealBmiCount = submissions.filter((s) => {
    const b = calculateBmi(s.beratBadan, s.tinggiBadan).bmi;
    return b >= 18.5 && b <= 22.9;
  }).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Container */}
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header Controls (Hidden on actual print) */}
        <div className="print:hidden px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold">Pratinjau Cetak Rekapan Tes Kebugaran</h3>
              <p className="text-[11px] text-slate-300">
                Format resmi A4 lanskap/portrait dengan Kop Surat Kemenkes & rekap hasil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Cetak ke PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="overflow-y-auto p-8 sm:p-10 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="printable-kebugaran-area">
          {/* KOP SURAT RESMI */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-6">
            <div className="flex items-center gap-4">
              <img
                src="https://poltekkesbandung.ac.id/wp-content/uploads/2026/05/cropped-logo-transparan-2.png"
                alt="Logo Kemenkes Poltekkes"
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <div className="text-xs font-bold tracking-widest text-slate-700 uppercase">
                  KEMENTERIAN KESEHATAN REPUBLIK INDONESIA
                </div>
                <div className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  DIREKTORAT JENDERAL TENAGA KESEHATAN
                </div>
                <div className="text-base font-extrabold text-blue-900 uppercase">
                  POLITEKNIK KESEHATAN KEMENKES BANDUNG
                </div>
                <div className="text-[11px] text-slate-600 leading-tight">
                  Jl. Pajajaran No. 56, Pasirkaliki, Kec. Cicendo, Kota Bandung, Jawa Barat 40171
                  <br />
                  Laman: www.poltekkesbandung.ac.id | Pos-el: informasi@poltekkesbandung.ac.id
                </div>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-mono text-slate-500">KODE DOKUMEN:</div>
              <div className="text-xs font-bold font-mono text-slate-800">OSDM-KBG-2026</div>
              <div className="text-[10px] text-slate-500 mt-1">Dicetak: {currentDateStr}</div>
            </div>
          </div>

          {/* DOKUMEN HEADER & FILTER METADATA */}
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
              REKAPITULASI HASIL PEMERIKSAAN & TES KEBUGARAN PEGAWAI
            </h1>
            <p className="text-xs text-slate-600">
              Periode Pemeriksaan: <strong className="text-slate-900">{periodeFilter}</strong> • Unit Kerja: <strong className="text-slate-900">{unitFilter}</strong>
            </p>
          </div>

          {/* TABEL REKAPAN */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg mb-6">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="py-2.5 px-2 border-r border-slate-300 text-center w-8">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">NIP & Nama Pegawai</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Unit Kerja</th>
                  <th className="py-2.5 px-2 border-r border-slate-300 text-center">Tgl Periksa</th>
                  <th className="py-2.5 px-2 border-r border-slate-300 text-center">Tensi (mmHg)</th>
                  <th className="py-2.5 px-2 border-r border-slate-300 text-center">BB/TB (IMT)</th>
                  <th className="py-2.5 px-2 border-r border-slate-300 text-center">LP (cm)</th>
                  <th className="py-2.5 px-2 border-r border-slate-300 text-center">Gula Darah</th>
                  <th className="py-2.5 px-2 border-r border-slate-300 text-center">Kolesterol</th>
                  <th className="py-2.5 px-3">Fasyankes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      Tidak ada data pemeriksaan kebugaran untuk filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub, idx) => {
                    const bmi = calculateBmi(sub.beratBadan, sub.tinggiBadan);
                    const bp = classifyBloodPressure(sub.tensiSistolik, sub.tensiDiastolik);
                    return (
                      <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-medium text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{sub.namaPegawai}</div>
                          <div className="font-mono text-[10px] text-slate-500">NIP: {sub.nip}</div>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                          {sub.unitKerja}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-[10px]">
                          {sub.tanggalPeriksa}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-bold">
                          {sub.tensiSistolik}/{sub.tensiDiastolik}
                          <span className="block text-[9px] font-normal text-slate-500">{bp.label}</span>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center">
                          <span className="font-bold">{sub.beratBadan}k / {sub.tinggiBadan}c</span>
                          <span className="block text-[9px] text-slate-500">IMT: {bmi.bmi}</span>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-semibold">
                          {sub.lingkarPinggang}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center">
                          <span className="font-bold">{sub.gulaDarah}</span>
                          <span className="block text-[9px] text-slate-500 font-semibold">{sub.tipeGulaDarah}</span>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-center font-bold">
                          {sub.kolesterol} <span className="text-[9px] font-normal text-slate-400">mg/dL</span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 text-[10px]">
                          {sub.fasyankes}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* STATISTIK RINGKAS */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-8">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Pegawai Terdata:</span>
              <span className="font-black text-slate-900 text-sm">{totalSubmissions} Orang</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Tensi Normal:</span>
              <span className="font-bold text-emerald-700">{normalBpCount} Orang ({totalSubmissions > 0 ? Math.round((normalBpCount / totalSubmissions) * 100) : 0}%)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Kolesterol &lt; 200 mg/dL:</span>
              <span className="font-bold text-blue-700">{normalCholCount} Orang ({totalSubmissions > 0 ? Math.round((normalCholCount / totalSubmissions) * 100) : 0}%)</span>
            </div>
          </div>

          {/* PENGESAHAN & TANDA TANGAN */}
          <div className="flex justify-between items-end text-xs text-slate-800 pt-4">
            <div className="space-y-1">
              <p className="text-slate-500 text-[11px]">Mengetahui,</p>
              <p className="font-bold">Ketua Tim Kerja Kepegawaian & OSDM</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900">Dr. Haris Sofyana, S.Kep., Ners., M.Kep.</p>
              <p className="text-[10px] font-mono text-slate-500">NIP. 197306211998031003</p>
            </div>

            <div className="text-right space-y-1">
              <p className="text-slate-500 text-[11px]">Bandung, {currentDateStr}</p>
              <p className="font-bold">Penanggung Jawab Kebugaran Pegawai</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900">Tim Kesehatan & Kebugaran Terpadu</p>
              <p className="text-[10px] text-slate-500">Poltekkes Kemenkes Bandung</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
