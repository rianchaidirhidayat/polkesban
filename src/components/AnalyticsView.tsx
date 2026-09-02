import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  Sparkles,
  Zap,
  Search,
  RefreshCw,
  Trash2,
  Calendar
} from 'lucide-react';
import { MenuItem, ClickLog, MicrositeProfile } from '../types';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { getIconComponent } from '../utils/iconMap';

interface AnalyticsViewProps {
  menus: MenuItem[];
  logs: ClickLog[];
  profile: MicrositeProfile;
  onSimulateClick: () => void;
  onClearLogs: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  menus,
  logs,
  profile,
  onSimulateClick,
  onClearLogs,
}) => {
  const [logSearch, setLogSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'All' | 'Mobile' | 'Desktop' | 'Tablet'>('All');

  // Total Clicks
  const totalClicks = useMemo(() => {
    return menus.reduce((acc, m) => acc + (m.clickCount || 0), 0);
  }, [menus]);

  // Estimated views (views are clicks / CTR estimate)
  const totalViews = Math.max(Math.round(totalClicks * 1.48) + 120, logs.length * 2);
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0';

  // Top performing menu
  const sortedMenus = useMemo(() => {
    return [...menus].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
  }, [menus]);

  const topMenu = sortedMenus[0];

  // Device Breakdown
  const deviceStats = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    let tablet = 0;

    logs.forEach((l) => {
      if (l.device === 'Mobile') mobile++;
      else if (l.device === 'Desktop') desktop++;
      else if (l.device === 'Tablet') tablet++;
    });

    const total = logs.length || 1;
    return {
      mobile: { count: mobile, pct: Math.round((mobile / total) * 100) },
      desktop: { count: desktop, pct: Math.round((desktop / total) * 100) },
      tablet: { count: tablet, pct: Math.round((tablet / total) * 100) },
    };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((l) => {
        const matchesSearch =
          logSearch.trim() === '' ||
          l.menuTitle.toLowerCase().includes(logSearch.toLowerCase()) ||
          (l.category && l.category.toLowerCase().includes(logSearch.toLowerCase())) ||
          l.referrer.toLowerCase().includes(logSearch.toLowerCase());
        const matchesDevice = deviceFilter === 'All' || l.device === deviceFilter;
        return matchesSearch && matchesDevice;
      })
      .slice(0, 50); // limit to 50 for smooth UI
  }, [logs, logSearch, deviceFilter]);

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Analitik & Pelacakan Klik Real-time</h2>
              <p className="text-xs text-slate-500">
                Pantau performa setiap direct menu dan ekspor laporan secara instan
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSimulateClick}
            title="Tambah data klik uji coba"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Simulasi Klik (+1)
          </button>

          <button
            onClick={() => exportToCSV(menus, logs, profile)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Ekspor CSV
          </button>

          <button
            onClick={() => exportToPDF(menus, logs, profile)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Clicks */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TOTAL KLIK MENU</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totalClicks}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total interaksi semua tombol direct</p>
        </div>

        {/* Card 2: Estimated Views */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ESTIMASI TAYANGAN</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totalViews}</span>
            <span className="text-xs font-semibold text-slate-500">Kunjungan</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Estimasi pengguna membuka microsite</p>
        </div>

        {/* Card 3: CTR */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RATA-RATA CTR</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-mono">{ctr}%</span>
            <span className="text-xs font-semibold text-emerald-600">Optimal</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Rasio klik terhadap total kunjungan</p>
        </div>

        {/* Card 4: Top Performer */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MENU TERPOPULER</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-bold text-slate-900 truncate max-w-full">
              {topMenu ? topMenu.title : 'Belum ada data'}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold text-indigo-600">
                {topMenu ? `${topMenu.clickCount} Klik` : '0'}
              </span>
              <span className="text-[10px] text-slate-400">
                ({topMenu && totalClicks > 0 ? ((topMenu.clickCount / totalClicks) * 100).toFixed(0) : 0}% dari total)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Button Performance Bar Chart (8 cols) */}
        <div className="lg:col-span-8 p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Peringkat & Distribusi Klik Setiap Tombol</h3>
              <p className="text-xs text-slate-500">Jumlah klik per direct menu tombol secara proporsional</p>
            </div>
            <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              {menus.length} Tombol
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {sortedMenus.map((menu, index) => {
              const maxClicks = Math.max(...menus.map((m) => m.clickCount || 1), 1);
              const pctOfMax = Math.round(((menu.clickCount || 0) / maxClicks) * 100);
              const shareOfTotal =
                totalClicks > 0 ? (((menu.clickCount || 0) / totalClicks) * 100).toFixed(1) : '0';

              return (
                <div key={menu.id} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-5 font-mono text-slate-400 font-bold shrink-0">
                        #{index + 1}
                      </span>
                      <div className="p-1 rounded bg-slate-100 text-slate-600 shrink-0">
                        {getIconComponent(menu.iconName, 'w-3.5 h-3.5')}
                      </div>
                      <span className="font-semibold text-slate-800 truncate group-hover:text-slate-900">
                        {menu.title}
                      </span>
                      {menu.badgeText && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                          {menu.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="font-bold text-slate-900">{menu.clickCount} klik</span>
                      <span className="text-slate-400 text-[11px] w-12 text-right">{shareOfTotal}%</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      style={{
                        width: `${Math.max(pctOfMax, 2)}%`,
                        background: menu.isGradient
                          ? `linear-gradient(90deg, ${menu.bgColor}, ${menu.gradientTo || menu.bgColor})`
                          : menu.bgColor,
                      }}
                      className="h-full rounded-full transition-all duration-500 shadow-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Device & Traffic Insights (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Device Breakdown Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Distribusi Perangkat</h3>
            <div className="space-y-2.5">
              {/* Smartphone */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Mobile (HP)</span>
                    <span className="text-[10px] text-slate-500">{deviceStats.mobile.count} interaksi</span>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-600">
                  {deviceStats.mobile.pct}%
                </span>
              </div>

              {/* Desktop */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Desktop / PC</span>
                    <span className="text-[10px] text-slate-500">{deviceStats.desktop.count} interaksi</span>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-indigo-600">
                  {deviceStats.desktop.pct}%
                </span>
              </div>

              {/* Tablet */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-amber-50 text-amber-600 border border-amber-100">
                    <Tablet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Tablet / iPad</span>
                    <span className="text-[10px] text-slate-500">{deviceStats.tablet.count} interaksi</span>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-amber-600">
                  {deviceStats.tablet.pct}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Tip / Optimization Card */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Saran Optimasi Konversi</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Gunakan ukuran <strong>Featured</strong> atau <strong>Large</strong> pada tombol WhatsApp dan Promo untuk meningkatkan rasio klik hingga 40%.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Click Logs Table */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Log Kejadian Klik Terkini</h3>
            <p className="text-xs text-slate-500">
              Pelacakan real-time setiap kali pengunjung menekan tombol menu
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari log..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Device Filter */}
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Semua Perangkat</option>
              <option value="Mobile">Mobile Saja</option>
              <option value="Desktop">Desktop Saja</option>
              <option value="Tablet">Tablet Saja</option>
            </select>

            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                title="Hapus riwayat log"
                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Waktu</th>
                <th className="py-2.5 px-4 font-semibold">Menu Terklik</th>
                <th className="py-2.5 px-4 font-semibold">Kategori</th>
                <th className="py-2.5 px-4 font-semibold">Perangkat</th>
                <th className="py-2.5 px-4 font-semibold">Browser</th>
                <th className="py-2.5 px-4 font-semibold">Sumber / Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-[200px] truncate">
                      {log.menuTitle}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] border border-slate-200">
                        {log.category || 'Umum'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        {log.device === 'Mobile' ? (
                          <Smartphone className="w-3 h-3 text-emerald-600" />
                        ) : log.device === 'Desktop' ? (
                          <Monitor className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <Tablet className="w-3 h-3 text-amber-600" />
                        )}
                        {log.device}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                      {log.browser}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.referrer}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada log klik yang sesuai dengan pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
