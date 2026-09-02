import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Palette,
  Layers,
  Link as LinkIcon,
  MessageCircle,
  Eye,
  Check,
  Type,
  Maximize2,
  Zap,
  Tag,
  Search,
  CheckCircle
} from 'lucide-react';
import { MenuItem, ButtonSize, ButtonActionType, AnimationEffect, ThemeConfig } from '../types';
import { AVAILABLE_ICONS, getIconComponent } from '../utils/iconMap';
import { DirectMenuButton } from './DirectMenuButton';

interface AdminMenuEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (menu: MenuItem) => void;
  initialMenu: MenuItem | null;
  currentTheme: ThemeConfig;
  availableCategories: string[];
}

const COLOR_PRESETS = [
  { name: 'Corporate Blue', bg: '#1e3a8a', to: '#1e40af', border: '#3b82f6', text: '#ffffff' },
  { name: 'Teal Emerald', bg: '#047857', to: '#065f46', border: '#10b981', text: '#ffffff' },
  { name: 'Indigo Executive', bg: '#4f46e5', to: '#4338ca', border: '#6366f1', text: '#ffffff' },
  { name: 'Sky Blue', bg: '#0284c7', to: '#0369a1', border: '#38bdf8', text: '#ffffff' },
  { name: 'Violet Purple', bg: '#7c3aed', to: '#6d28d9', border: '#8b5cf6', text: '#ffffff' },
  { name: 'Teal Modern', bg: '#0d9488', to: '#0f766e', border: '#14b8a6', text: '#ffffff' },
  { name: 'Slate Dark', bg: '#1e293b', to: '#0f172a', border: '#334155', text: '#f8fafc' },
  { name: 'Amber Alert', bg: '#d97706', to: '#b45309', border: '#f59e0b', text: '#ffffff' },
  { name: 'Rose Urgent', bg: '#e11d48', to: '#be123c', border: '#f43f5e', text: '#ffffff' },
  { name: 'Minimal Charcoal', bg: '#121212', to: '#1c1c1c', border: '#2e2e2e', text: '#ffffff' },
];

const BADGE_PRESETS = [
  { text: '⚡ WAJIB HARIAN', bg: '#3b82f6', color: '#ffffff' },
  { text: '🔒 AKSES AMAN', bg: '#10b981', color: '#ffffff' },
  { text: '📋 E-APPROVAL', bg: '#0284c7', color: '#ffffff' },
  { text: '✨ UPDATE 2026', bg: '#6366f1', color: '#ffffff' },
  { text: '🏥 BENEFIT', bg: '#7c3aed', color: '#ffffff' },
  { text: '📑 DOKUMEN SOP', bg: '#334155', color: '#ffffff' },
  { text: '🚨 PENTING', bg: '#ef4444', color: '#ffffff' },
];

export const AdminMenuEditorModal: React.FC<AdminMenuEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMenu,
  currentTheme,
  availableCategories,
}) => {
  const [formData, setFormData] = useState<MenuItem>({
    id: '',
    title: '',
    subtitle: '',
    url: '',
    type: 'link',
    size: 'medium',
    bgColor: '#4f46e5',
    textColor: '#ffffff',
    borderColor: '#6366f1',
    isGradient: true,
    gradientTo: '#4338ca',
    gradientAngle: 135,
    iconName: 'Link',
    badgeText: '',
    badgeBgColor: '#f59e0b',
    badgeTextColor: '#000000',
    isActive: true,
    order: 1,
    animation: 'none',
    clickCount: 0,
    category: 'Kepegawaian & HR',
    openInNewTab: true,
    priceTag: '',
  });

  const [iconSearch, setIconSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'appearance' | 'icon' | 'badge'>('content');

  // WhatsApp quick helper state
  const [waPhone, setWaPhone] = useState('6281234567890');
  const [waMessage, setWaMessage] = useState('Halo Helpdesk HR/IT, saya pegawai ingin menanyakan...');

  useEffect(() => {
    if (initialMenu) {
      setFormData({ ...initialMenu });
    } else {
      setFormData({
        id: `menu-${Date.now()}`,
        title: '',
        subtitle: '',
        url: '',
        type: 'link',
        size: 'medium',
        bgColor: '#1e3a8a',
        textColor: '#ffffff',
        borderColor: '#3b82f6',
        isGradient: true,
        gradientTo: '#1e40af',
        gradientAngle: 135,
        iconName: 'CalendarCheck',
        badgeText: '',
        badgeBgColor: '#3b82f6',
        badgeTextColor: '#ffffff',
        isActive: true,
        order: Date.now(),
        animation: 'none',
        clickCount: 0,
        category: 'Kepegawaian & HR',
        openInNewTab: true,
        priceTag: '',
      });
    }
  }, [initialMenu, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Mohon isi judul menu!');
      return;
    }
    onSave(formData);
    onClose();
  };

  const handleApplyWa = () => {
    const cleanPhone = waPhone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(waMessage);
    const generatedUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    setFormData((prev) => ({
      ...prev,
      url: generatedUrl,
      type: 'whatsapp',
      iconName: 'MessageCircle',
    }));
  };

  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-900 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {initialMenu ? 'Edit Menu Direct' : 'Tambah Menu Direct Baru'}
                </h2>
                <p className="text-xs text-slate-500">
                  Sesuaikan ukuran, tema warna, ikon, dan tautan tombol
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content (Split Layout: Form & Live Real-time Button Preview) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
            {/* Left Column: Configuration Controls */}
            <div className="lg:col-span-7 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-5">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                    activeTab === 'content'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Konten & Link
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('appearance')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                    activeTab === 'appearance'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Ukuran & Tema
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('icon')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                    activeTab === 'icon'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Ikon ({formData.iconName})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('badge')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                    activeTab === 'badge'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Badge & Efek
                </button>
              </div>

              {/* TAB 1: KONTEN & LINK */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Judul Tombol Menu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 🕒 Presensi & Log Absensi Online"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Subtitle / Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Deskripsi Singkat / Subtitle (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Clock-in/out, rekap kehadiran bulanan, jadwal shift"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Category & Action Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kategori Menu
                      </label>
                      <input
                        type="text"
                        list="categories-list"
                        placeholder="Kepegawaian & HR, Fasilitas & IT, dsb."
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                      <datalist id="categories-list">
                        {availableCategories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tipe Aksi
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ButtonActionType })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="link">🔗 Tautan Sistem / Portal Internal</option>
                        <option value="whatsapp">💬 WhatsApp Helpdesk HR / IT</option>
                        <option value="catalog">📖 Dokumen PDF / SOP Pegawai</option>
                        <option value="location">📍 Lokasi Kantor / Cabang</option>
                        <option value="email">✉️ Email HR / Departemen</option>
                        <option value="phone">📞 Telepon / Hotline Internal</option>
                        <option value="custom">⚡ Tautan URL Kustom</option>
                      </select>
                    </div>
                  </div>

                  {/* Direct URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      URL Akses / Direct Link
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://hris.internal/..."
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                      <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {/* WhatsApp Quick Builder Helper */}
                  {formData.type === 'whatsapp' && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Generator Tautan WhatsApp Langsung</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nomor WA (contoh: 6281234567890)"
                          value={waPhone}
                          onChange={(e) => setWaPhone(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-900"
                        />
                        <input
                          type="text"
                          placeholder="Pesan Otomatis"
                          value={waMessage}
                          onChange={(e) => setWaMessage(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyWa}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                      >
                        Terapkan ke URL Direct
                      </button>
                    </div>
                  )}

                  {/* Price tag */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tag Harga / Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Rp 35.000 atau Diskon 50%"
                      value={formData.priceTag || ''}
                      onChange={(e) => setFormData({ ...formData, priceTag: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Active Toggle & Open New Tab */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <span>Tampilkan Menu (Status Aktif)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.openInNewTab}
                        onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <span>Buka di Tab Baru</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: UKURAN & TEMA WARNA */}
              {activeTab === 'appearance' && (
                <div className="space-y-5">
                  {/* Real-time Button Size Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Pilih Ukuran Tombol Menu (Real-time Scale)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { size: 'compact', label: 'Compact', desc: 'Ringkas & ramping' },
                        { size: 'medium', label: 'Medium', desc: 'Standar seimbang' },
                        { size: 'large', label: 'Large', desc: 'Besar & terkemuka' },
                        { size: 'featured', label: 'Featured', desc: 'Hero sorotan utama' },
                        { size: 'bento-square', label: 'Bento 1x1', desc: 'Kotak grid bento' },
                        { size: 'bento-wide', label: 'Bento 2x1', desc: 'Lebar grid bento' },
                      ].map((item) => (
                        <button
                          key={item.size}
                          type="button"
                          onClick={() => setFormData({ ...formData, size: item.size as ButtonSize })}
                          className={`
                            p-3 rounded-xl border text-left transition-all
                            ${
                              formData.size === item.size
                                ? 'border-2 border-indigo-600 bg-indigo-50/80 text-slate-900 shadow-xs'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{item.label}</span>
                            {formData.size === item.size && <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Palettes Preset */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Preset Tema Warna Siap Pakai
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              bgColor: preset.bg,
                              gradientTo: preset.to,
                              borderColor: preset.border,
                              textColor: preset.text,
                              isGradient: true,
                            })
                          }
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-400 transition-all group"
                        >
                          <div
                            style={{
                              background: `linear-gradient(135deg, ${preset.bg}, ${preset.to})`,
                            }}
                            className="w-full h-6 rounded shadow-inner"
                          />
                          <span className="text-[10px] text-slate-600 group-hover:text-slate-900 truncate w-full text-center">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Hex Color Pickers */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">Kustomisasi Warna Presisi</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Warna Latar Utama</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.bgColor}
                            onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={formData.bgColor}
                            onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Warna Gradien Akhir</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.gradientTo || formData.bgColor}
                            onChange={(e) => setFormData({ ...formData, gradientTo: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={formData.gradientTo || ''}
                            onChange={(e) => setFormData({ ...formData, gradientTo: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Warna Teks</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.textColor}
                            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={formData.textColor}
                            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.isGradient}
                          onChange={(e) => setFormData({ ...formData, isGradient: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                        />
                        <span>Gunakan Efek Gradasi Halus</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: IKON */}
              {activeTab === 'icon' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari ikon (cth: Coffee, Message, Shopping, Map...)"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                    {filteredIcons.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, iconName })}
                        className={`
                          p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all
                          ${
                            formData.iconName === iconName
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                          }
                        `}
                      >
                        {getIconComponent(iconName, 'w-4 h-4')}
                        <span className="text-[9px] truncate w-full text-center">{iconName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: BADGE & EFEK ANIMASI */}
              {activeTab === 'badge' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Teks Badge Label Sorotan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 🔥 PROMO HARI INI"
                      value={formData.badgeText || ''}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Badge Presets */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Preset Badge Populer
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BADGE_PRESETS.map((bp) => (
                        <button
                          key={bp.text}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              badgeText: bp.text,
                              badgeBgColor: bp.bg,
                              badgeTextColor: bp.color,
                            })
                          }
                          style={{ backgroundColor: bp.bg, color: bp.color }}
                          className="px-2.5 py-1 rounded-full text-xs font-bold hover:scale-105 transition-transform"
                        >
                          {bp.text}
                        </button>
                      ))}
                      {formData.badgeText && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, badgeText: '' })}
                          className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                        >
                          Hapus Badge
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Animation Effects */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Efek Animasi Tombol
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: 'none', label: 'Tanpa Animasi', icon: X },
                        { val: 'pulse', label: 'Denyut (Pulse)', icon: Zap },
                        { val: 'bounce', label: 'Membal (Bounce)', icon: Sparkles },
                        { val: 'glow', label: 'Cahaya (Glow)', icon: Sparkles },
                        { val: 'shimmer', label: 'Kilauan (Shimmer)', icon: Sparkles },
                      ].map((eff) => (
                        <button
                          key={eff.val}
                          type="button"
                          onClick={() => setFormData({ ...formData, animation: eff.val as AnimationEffect })}
                          className={`
                            p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all
                            ${
                              formData.animation === eff.val
                                ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }
                          `}
                        >
                          <span>{eff.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Real-time Live Button Preview */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    Preview Tombol Real-time
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 font-mono border border-slate-200">
                    Ukuran: {formData.size.toUpperCase()}
                  </span>
                </div>

                <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center min-h-[180px]">
                  <div className="w-full max-w-sm">
                    <DirectMenuButton
                      menu={formData}
                      theme={currentTheme}
                      isPreviewMode={true}
                      showClickBadge={true}
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1 text-slate-500 shadow-xs">
                  <div className="flex justify-between">
                    <span>Tipe URL:</span>
                    <span className="text-slate-800 font-mono">{formData.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Animasi:</span>
                    <span className="text-slate-800 font-mono">{formData.animation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={formData.isActive ? 'text-green-600 font-medium' : 'text-rose-600 font-medium'}>
                      {formData.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="pt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
