import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Palette,
  LayoutGrid,
  BarChart3,
  Download,
  Settings,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Smartphone,
  Check,
  Maximize2,
  FileSpreadsheet,
  FileText,
  Save,
  RotateCcw,
  ExternalLink,
  Layers,
  Zap,
  HelpCircle,
  Tag,
  Upload,
  Image as ImageIcon,
  X,
  Sliders,
  FileImage,
  Lock,
  KeyRound,
  ShieldAlert,
  Key,
  LogOut,
  Send,
  CheckCheck,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  MapPin,
  AlignLeft,
  FileSignature,
  Share2,
  RefreshCw,
} from 'lucide-react';
import { MenuItem, MicrositeProfile, ClickLog, ButtonSize, ThemeConfig, WfaSubmission, WfaValidationStatus } from '../types';
import { THEME_PRESETS, CATEGORIES_PRESET } from '../data/initialData';
import { getIconComponent } from '../utils/iconMap';
import { AdminMenuEditorModal } from './AdminMenuEditorModal';
import { AnalyticsView } from './AnalyticsView';
import { WfaMonitoringView } from './WfaMonitoringView';
import { PublicMicrosite } from './PublicMicrosite';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { optimizeImageForStorage } from '../utils/imageOptimizer';

interface AdminDashboardProps {
  menus: MenuItem[];
  setMenus: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  profile: MicrositeProfile;
  setProfile: React.Dispatch<React.SetStateAction<MicrositeProfile>>;
  liveMenus?: MenuItem[];
  liveProfile?: MicrositeProfile;
  logs: ClickLog[];
  setLogs: React.Dispatch<React.SetStateAction<ClickLog[]>>;
  onOpenPublicPreview: () => void;
  onOpenQR: () => void;
  onSimulateClick: () => void;
  onClearLogs: () => void;
  adminPin?: string;
  setAdminPin?: (newPin: string) => void;
  onLogout?: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  lastPublishedAt?: string | null;
  wfaSubmissions?: WfaSubmission[];
  onUpdateWfaStatus?: (id: string, status: WfaValidationStatus, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteWfaSubmission?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onRefreshWfa?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  menus,
  setMenus,
  profile,
  setProfile,
  liveMenus,
  liveProfile,
  logs,
  setLogs,
  onOpenPublicPreview,
  onOpenQR,
  onSimulateClick,
  onClearLogs,
  adminPin = 'admin123',
  setAdminPin,
  onLogout,
  onPublish,
  isPublishing = false,
  lastPublishedAt,
  wfaSubmissions = [],
  onUpdateWfaStatus,
  onDeleteWfaSubmission,
  onRefreshWfa,
}) => {
  const [activeTab, setActiveTab] = useState<'menus' | 'theme' | 'analytics' | 'wfa_monitoring' | 'export' | 'security'>('menus');
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showLiveSidePreview, setShowLiveSidePreview] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [isBgDragging, setIsBgDragging] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [isFaviconDragging, setIsFaviconDragging] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Auto publish toggle (defaults to true for zero-friction employee sync)
  const [autoPublishEnabled, setAutoPublishEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('direct_menu_auto_publish');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleAutoPublish = () => {
    const next = !autoPublishEnabled;
    setAutoPublishEnabled(next);
    try {
      localStorage.setItem('direct_menu_auto_publish', String(next));
    } catch {}
  };

  // Compare draft vs live to see if there are unpublished changes
  const hasUnpublishedChanges = React.useMemo(() => {
    if (!liveMenus || !liveProfile) return false;
    try {
      return (
        JSON.stringify(menus) !== JSON.stringify(liveMenus) ||
        JSON.stringify(profile) !== JSON.stringify(liveProfile)
      );
    } catch {
      return false;
    }
  }, [menus, profile, liveMenus, liveProfile]);

  // Debounced auto-publish effect when autoPublishEnabled is true
  React.useEffect(() => {
    if (!autoPublishEnabled || !onPublish || isPublishing) return;
    if (!hasUnpublishedChanges) return;

    const timer = setTimeout(() => {
      onPublish();
    }, 1800);

    return () => clearTimeout(timer);
  }, [autoPublishEnabled, hasUnpublishedChanges, onPublish, isPublishing]);

  const handleCopyShareLink = () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?mode=public`;
      navigator.clipboard.writeText(url);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    } catch (e) {
      console.warn('Copy link error:', e);
    }
  };

  // Security tab local state
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [pinChangeError, setPinChangeError] = useState('');

  const availableCategories = CATEGORIES_PRESET;

  // File Upload Helper
  const handleLocalImageUpload = async (
    file: File,
    onSuccess: (dataUrl: string) => void,
    maxWidth = 280,
    maxHeight = 280
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap unggah file gambar (PNG, JPG, WebP, SVG)');
      return;
    }
    try {
      const optimized = await optimizeImageForStorage(file, maxWidth, maxHeight, 0.85);
      if (optimized) {
        onSuccess(optimized);
        triggerSaveFeedback();
      }
    } catch (err) {
      console.warn('Image optimization error:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onSuccess(e.target.result as string);
          triggerSaveFeedback();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers for Menu Management
  const handleAddNewMenu = () => {
    setEditingMenu(null);
    setIsEditorOpen(true);
  };

  const handleEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu);
    setIsEditorOpen(true);
  };

  const handleDuplicateMenu = (menu: MenuItem) => {
    const duplicated: MenuItem = {
      ...menu,
      id: `menu-${Date.now()}`,
      title: `${menu.title} (Salinan)`,
      order: menus.length + 1,
      clickCount: 0,
    };
    setMenus((prev) => [...prev, duplicated]);
    triggerSaveFeedback();
  };

  const handleDeleteMenu = (id: string) => {
    if (window.confirm('Yakin ingin menghapus tombol menu ini?')) {
      setMenus((prev) => prev.filter((m) => m.id !== id));
      triggerSaveFeedback();
    }
  };

  const handleToggleActive = (id: string) => {
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
    triggerSaveFeedback();
  };

  const handleQuickSizeChange = (id: string, newSize: ButtonSize) => {
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, size: newSize } : m))
    );
    triggerSaveFeedback();
  };

  const handleSaveMenu = (savedMenu: MenuItem) => {
    setMenus((prev) => {
      const exists = prev.some((m) => m.id === savedMenu.id);
      if (exists) {
        return prev.map((m) => (m.id === savedMenu.id ? savedMenu : m));
      } else {
        return [...prev, savedMenu];
      }
    });
    triggerSaveFeedback();
  };

  // Reorder Handlers
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= menus.length) return;

    const updated = [...menus];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // update orders
    const reordered = updated.map((m, idx) => ({ ...m, order: idx + 1 }));
    setMenus(reordered);
    triggerSaveFeedback();
  };

  // HTML5 Drag and Drop Reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...menus];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setMenus(updated.map((m, idx) => ({ ...m, order: idx + 1 })));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Admin Sub-Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          <button
            onClick={() => setActiveTab('menus')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'menus'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kelola Menu ({menus.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'theme'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tema & Profil</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analitik Klik</span>
          </button>

          <button
            onClick={() => setActiveTab('wfa_monitoring')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all relative ${
              activeTab === 'wfa_monitoring'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Monitoring WFA</span>
            {wfaSubmissions.filter(s => s.status === 'Menunggu Validasi').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                {wfaSubmissions.filter(s => s.status === 'Menunggu Validasi').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Data</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Keamanan & PIN</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLiveSidePreview(!showLiveSidePreview)}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
              showLiveSidePreview
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Live Preview HP</span>
          </button>

          <button
            onClick={onOpenPublicPreview}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Buka Microsite Utama</span>
          </button>

          <button
            onClick={handleAddNewMenu}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace with Optional Live Preview Frame */}
      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Status & Quick Publish Alert Banner */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
            hasUnpublishedChanges
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-950'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-3.5 h-3.5 rounded-full mt-1 sm:mt-0 shrink-0 ${
                  hasUnpublishedChanges
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-emerald-500 shadow-xs'
                }`}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base">
                    {hasUnpublishedChanges
                      ? '⚠️ Ada Perubahan Kustom Yang Belum Diposting ke Pegawai!'
                      : '✅ Tampilan Pegawai Sudah Tersinkronisasi (Live di Cloud)'}
                  </h3>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      hasUnpublishedChanges
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {lastPublishedAt
                      ? `Terakhir Diposting: ${new Date(lastPublishedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}`
                      : 'Belum pernah diposting'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  {hasUnpublishedChanges
                    ? 'Terdapat perubahan yang belum diposting. Tekan tombol "Posting / Update Portal" pada bilah atas untuk langsung mempublikasikannya ke seluruh pegawai.'
                    : 'Semua perubahan menu dan profil kustom Anda sudah aktif di Cloud Firestore. Setiap pegawai yang membuka link akan langsung melihat tampilan ini.'}
                </p>
              </div>
            </div>

            {/* Actions & Auto-publish switch */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
              <label
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-700 cursor-pointer hover:bg-white shadow-2xs transition-colors"
                title="Jika aktif, setiap perubahan yang Anda lakukan otomatis langsung tersimpan ke Cloud untuk pegawai"
              >
                <input
                  type="checkbox"
                  checked={autoPublishEnabled}
                  onChange={handleToggleAutoPublish}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="font-medium">⚡ Auto-Posting Otomatis</span>
              </label>

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 shadow-xs transition-colors"
                title="Salin tautan resmi yang dapat langsung dibagikan ke seluruh pegawai"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{copiedShareLink ? 'Link Tersalin!' : 'Salin Link Pegawai'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${showLiveSidePreview ? 'xl:grid-cols-12' : ''} gap-8 items-start`}>
          {/* Main Editing Column */}
          <div className={showLiveSidePreview ? 'xl:col-span-8' : 'w-full'}>
            {/* TAB 1: KELOLA MENU (Drag and Drop, Size, Color, CRUD) */}
            {activeTab === 'menus' && (
              <div className="space-y-6">
                {/* Header info banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Daftar Tombol Direct Menu</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tarik & geser (drag-and-drop) untuk mengatur urutan tombol menu yang tampil di microsite.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                      {menus.filter((m) => m.isActive).length} Aktif / {menus.length} Total
                    </span>
                    <button
                      onClick={handleAddNewMenu}
                      className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                    >
                      + Tambah Menu
                    </button>
                  </div>
                </div>

                {/* Draggable Menu List */}
                <div className="space-y-3">
                  {menus.length > 0 ? (
                    menus.map((menu, index) => {
                      const isDragging = draggedIndex === index;

                      return (
                        <div
                          key={menu.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`
                            group p-3.5 bg-white border rounded-xl transition-all duration-150
                            ${
                              isDragging
                                ? 'opacity-40 border-dashed border-indigo-500 scale-95 shadow-lg bg-indigo-50/50'
                                : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                            }
                            ${!menu.isActive ? 'bg-slate-50/80 border-slate-200 opacity-60' : ''}
                          `}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Drag Handle, Icon, Title, Subtitle, Badges */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Drag Handle */}
                              <div
                                title="Tahan dan geser untuk memindahkan posisi"
                                className="cursor-grab active:cursor-grabbing p-1.5 rounded-md text-slate-300 group-hover:text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>

                              {/* Icon Box with Button Color Accent */}
                              <div
                                style={{
                                  background: menu.isGradient
                                    ? `linear-gradient(135deg, ${menu.bgColor}, ${menu.gradientTo || menu.bgColor})`
                                    : menu.bgColor,
                                  color: menu.textColor || '#ffffff',
                                }}
                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-1.5"
                              >
                                {getIconComponent(menu.iconName, 'w-full h-full max-w-[24px] max-h-[24px]')}
                              </div>

                              {/* Title & Metadata */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                                    {menu.title}
                                  </h3>
                                  {menu.badgeText && (
                                    <span
                                      style={{
                                        backgroundColor: menu.badgeBgColor || '#f59e0b',
                                        color: menu.badgeTextColor || '#000',
                                      }}
                                      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                                    >
                                      {menu.badgeText}
                                    </span>
                                  )}
                                  {menu.category && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                      {menu.category}
                                    </span>
                                  )}
                                  {menu.isProtected && (
                                    <span
                                      title={`Menu terproteksi PIN: ${menu.pinCode || 'Aktif'}`}
                                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1"
                                    >
                                      <Lock className="w-2.5 h-2.5 text-amber-600" />
                                      <span>PIN: {menu.pinCode || 'Aktif'}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                                  <span className="truncate max-w-[220px] font-mono text-[11px] text-slate-500">
                                    {menu.url}
                                  </span>
                                  <span className="font-mono text-indigo-600 text-[11px] font-semibold flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-500" />
                                    {menu.clickCount} klik
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Real-time Quick Size Selector & Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                              {/* Quick Size Switcher */}
                              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5">
                                {(
                                  [
                                    { size: 'compact', label: 'C' },
                                    { size: 'medium', label: 'M' },
                                    { size: 'large', label: 'L' },
                                    { size: 'featured', label: 'Hero' },
                                  ] as const
                                ).map((s) => (
                                  <button
                                    key={s.size}
                                    onClick={() => handleQuickSizeChange(menu.id, s.size)}
                                    title={`Ubah ukuran ke: ${s.size.toUpperCase()}`}
                                    className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all ${
                                      menu.size === s.size
                                        ? 'bg-white text-indigo-600 shadow-xs font-bold border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>

                              {/* Up / Down Reorder Arrows */}
                              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5">
                                <button
                                  onClick={() => handleMove(index, 'up')}
                                  disabled={index === 0}
                                  title="Pindah ke Atas"
                                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-white"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMove(index, 'down')}
                                  disabled={index === menus.length - 1}
                                  title="Pindah ke Bawah"
                                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-white"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Active Status Toggle */}
                              <button
                                onClick={() => handleToggleActive(menu.id)}
                                title={menu.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                className={`p-1.5 rounded-md border transition-colors ${
                                  menu.isActive
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {menu.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>

                              {/* Edit Modal Button */}
                              <button
                                onClick={() => handleEditMenu(menu)}
                                title="Edit Detail, Warna & Ukuran"
                                className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors hover:text-indigo-600 shadow-xs"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Duplicate Button */}
                              <button
                                onClick={() => handleDuplicateMenu(menu)}
                                title="Duplikat Tombol"
                                className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors hover:text-slate-900 shadow-xs"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteMenu(menu.id)}
                                title="Hapus Menu"
                                className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-10 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                      <p className="text-slate-500 text-sm">Belum ada tombol menu direct yang dibuat.</p>
                      <button
                        onClick={handleAddNewMenu}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 shadow-xs"
                      >
                        + Tambah Menu Pertama
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: KUSTOMISASI TEMA & PROFIL */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Identitas Portal & Instansi / Perusahaan</h3>
                      <p className="text-xs text-slate-400">
                        Atur nama portal pegawai, logo organisasi, deskripsi panduan, dan kontak layanan internal
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nama Portal Pegawai / Perusahaan
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tagline / Subjudul Portal
                      </label>
                      <input
                        type="text"
                        value={profile.tagline}
                        onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Deskripsi / Panduan Singkat untuk Pegawai
                      </label>
                      <textarea
                        rows={2}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Enhanced Flexible Logo Section */}
                    <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-slate-800">
                            🖼️ Logo & Ikon Portal (Upload dari Komputer atau URL)
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Upload file logo dari komputer atau masukkan URL. Format landscape/panjang akan terlihat utuh.
                          </p>
                        </div>
                        {profile.avatarUrl && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Tinggi: {profile.logoHeight || 70}px
                          </span>
                        )}
                      </div>

                      {/* File Upload Drop Zone & URL Input */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          <div className="flex-1 w-full space-y-2">
                            {/* Drag & Drop / Click Upload Box */}
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsLogoDragging(true);
                              }}
                              onDragLeave={() => setIsLogoDragging(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsLogoDragging(false);
                                if (e.dataTransfer.files?.[0]) {
                                  handleLocalImageUpload(e.dataTransfer.files[0], (dataUrl) => {
                                    setProfile({
                                      ...profile,
                                      avatarUrl: dataUrl,
                                      logoShape: profile.logoShape || 'landscape',
                                    });
                                  });
                                }
                              }}
                              className={`relative border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
                                isLogoDragging
                                  ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                                  : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50'
                              }`}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleLocalImageUpload(e.target.files[0], (dataUrl) => {
                                      setProfile({
                                        ...profile,
                                        avatarUrl: dataUrl,
                                        logoShape: profile.logoShape || 'landscape',
                                      });
                                    });
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              />
                              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
                                <Upload className="w-4 h-4" />
                                <span>Klik untuk Pilih File Logo dari Komputer atau Drag & Drop</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Mendukung PNG (Transparan), JPG, WebP, SVG
                              </p>
                            </div>

                            {/* Or Manual URL */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">atau URL:</span>
                              <input
                                type="text"
                                placeholder="https://.../logo-perusahaan.png"
                                value={profile.avatarUrl}
                                onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-400">Contoh Cepat:</span>
                              <button
                                type="button"
                                onClick={() => setProfile({
                                  ...profile,
                                  avatarUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
                                  logoShape: 'landscape',
                                  logoHeight: 68
                                })}
                                className="text-[10px] px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition-colors"
                              >
                                Gedung Korporat
                              </button>
                              <button
                                type="button"
                                onClick={() => setProfile({
                                  ...profile,
                                  avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/375px-Google_2015_logo.svg.png',
                                  logoShape: 'landscape',
                                  logoHeight: 56,
                                  logoBackground: 'white'
                                })}
                                className="text-[10px] px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-200 transition-colors"
                              >
                                Logo Teks Lebar (Google)
                              </button>
                              {profile.avatarUrl && (
                                <button
                                  type="button"
                                  onClick={() => setProfile({ ...profile, avatarUrl: '' })}
                                  className="text-[10px] px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-colors"
                                >
                                  Hapus Logo
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Live Mini Preview */}
                          <div className="shrink-0 flex flex-col items-center">
                            <div
                              style={{ height: `${Math.min(profile.logoHeight || 70, 85)}px` }}
                              className={`min-w-[110px] max-w-[180px] px-3 py-1.5 rounded-xl border border-slate-200 flex items-center justify-center transition-all ${
                                profile.logoBackground === 'white'
                                  ? 'bg-white shadow-xs'
                                  : profile.logoBackground === 'dark'
                                  ? 'bg-slate-900'
                                  : profile.logoBackground === 'transparent'
                                  ? 'bg-transparent border-dashed'
                                  : 'bg-slate-800 text-white'
                              }`}
                            >
                              {profile.avatarUrl ? (
                                <img
                                  src={profile.avatarUrl}
                                  alt="Preview Logo"
                                  style={{ maxHeight: `${Math.min((profile.logoHeight || 70) - 10, 75)}px` }}
                                  className="w-auto h-auto max-w-full object-contain"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400">Tanpa Logo</span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1">Live Mini Preview</span>
                          </div>
                        </div>
                      </div>

                      {/* Shape & Height Settings */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                        {/* Format / Bentuk */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Bentuk Tampilan Logo
                          </label>
                          <select
                            value={profile.logoShape || 'landscape'}
                            onChange={(e) => setProfile({ ...profile, logoShape: e.target.value as any })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="landscape">🏞️ Horizontal / Panjang (Landscape)</option>
                            <option value="banner">🏷️ Banner Lebar</option>
                            <option value="rounded-square">🔲 Kotak Rounded (App Icon)</option>
                            <option value="circle">🔘 Lingkaran (Avatar Bulat)</option>
                          </select>
                        </div>

                        {/* Tinggi Logo Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-slate-700">
                              Tinggi Logo: <span className="text-indigo-600 font-bold">{profile.logoHeight || 70}px</span>
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="36"
                              max="130"
                              step="2"
                              value={profile.logoHeight || 70}
                              onChange={(e) => setProfile({ ...profile, logoHeight: parseInt(e.target.value) })}
                              className="w-full accent-indigo-600 cursor-pointer"
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                            <span>36px (Kecil)</span>
                            <span>70px (Standar)</span>
                            <span>130px (Besar)</span>
                          </div>
                        </div>

                        {/* Latar Belakang Wadah Logo */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Latar Belakang Wadah
                          </label>
                          <select
                            value={profile.logoBackground || 'glass'}
                            onChange={(e) => setProfile({ ...profile, logoBackground: e.target.value as any })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="glass">✨ Glass / Transparan Halus</option>
                            <option value="white">⚪ Putih Bersih (Cocok utk Logo Gelap)</option>
                            <option value="dark">⚫ Gelap / Slate Dark</option>
                            <option value="transparent">🚫 Tanpa Wadah (Transparan Penuh)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Lokasi Kantor / Wilayah Kerja
                      </label>
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Jam Layanan Helpdesk & Sistem
                      </label>
                      <input
                        type="text"
                        value={profile.openingHours || ''}
                        onChange={(e) => setProfile({ ...profile, openingHours: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={profile.isVerified}
                          onChange={(e) => setProfile({ ...profile, isVerified: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span>Tampilkan Lencana Terverifikasi (Portal Resmi Internal)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* PENGATURAN FAVICON & JUDUL TAB BROWSER */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                          🌐 Pengaturan Favicon & Judul Tab Browser
                        </h3>
                        <p className="text-xs text-slate-400">
                          Ubah ikon favicon pada tab browser dan nama aplikasi yang tertera di tab browser (Document Title)
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-time Browser Sync
                    </span>
                  </div>

                  {/* Browser Window Mockup Preview */}
                  <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                    {/* Browser Title Bar & Window Controls */}
                    <div className="bg-slate-800/90 px-3 py-2 flex items-center gap-3 border-b border-slate-700/60">
                      {/* Red / Yellow / Green Window Dots */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                      </div>

                      {/* Mock Browser Tab */}
                      <div className="flex items-center gap-2 bg-slate-900 text-slate-100 px-3 py-1.5 rounded-t-lg border-t border-x border-slate-700/80 max-w-xs shadow-xs">
                        {/* Favicon in Tab Preview */}
                        <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center overflow-hidden bg-slate-800">
                          {profile.faviconUrl ? (
                            <img
                              src={profile.faviconUrl}
                              alt="Favicon"
                              className="w-full h-full object-contain"
                            />
                          ) : profile.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt="Favicon"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs">🏢</span>
                          )}
                        </div>
                        <span className="text-xs font-medium truncate">
                          {profile.tabTitle?.trim() || profile.name?.trim() || 'Portal Layanan Pegawai'}
                        </span>
                        <X className="w-3 h-3 text-slate-400 ml-auto shrink-0 hover:text-white" />
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono hidden md:block">
                        + Tab Baru
                      </div>
                    </div>

                    {/* Browser Address Bar Mockup */}
                    <div className="px-4 py-2 bg-slate-900/95 flex items-center gap-2 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1 w-full max-w-md font-mono text-[11px] text-slate-300">
                        <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-semibold">https://</span>
                        <span className="text-slate-200">portal.perusahaan.internal</span>
                      </div>
                      <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                        Pratinjau tampilan tab browser pengguna
                      </span>
                    </div>
                  </div>

                  {/* Settings Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
                    {/* Left Column: Tab Title */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Aplikasi pada Tab Browser (Tab Title)
                        </label>
                        <p className="text-[11px] text-slate-400 mb-1.5">
                          Teks ini akan langsung muncul pada tab browser dan judul saat di-bookmark pengguna.
                        </p>
                        <input
                          type="text"
                          placeholder="Contoh: Portal Layanan Pegawai • PT Nusantara"
                          value={profile.tabTitle || ''}
                          onChange={(e) => setProfile({ ...profile, tabTitle: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      {/* Quick Title Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold">Opsi Cepat:</span>
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, tabTitle: profile.name || 'Portal Layanan Pegawai' })}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
                        >
                          Samakan dgn Nama Portal
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setProfile({
                              ...profile,
                              tabTitle: `${profile.name || 'Portal Pegawai'} | Direct Menu`,
                            })
                          }
                          className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
                        >
                          + Slogan Direct Menu
                        </button>
                        {profile.tabTitle && (
                          <button
                            type="button"
                            onClick={() => setProfile({ ...profile, tabTitle: '' })}
                            className="text-[10px] px-2 py-0.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                          >
                            Reset ke Bawaan
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Favicon Settings */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Ikon Favicon pada Tab Browser
                          </label>
                          {profile.faviconUrl && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                              Favicon Kustom Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2">
                          Upload file ikon dari komputer (.ico, .png, .svg, .jpg) atau gunakan simbol emoji cepat.
                        </p>

                        {/* Favicon Upload Dropzone */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsFaviconDragging(true);
                          }}
                          onDragLeave={() => setIsFaviconDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsFaviconDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                              handleLocalImageUpload(file, (url) => {
                                setProfile({ ...profile, faviconUrl: url });
                              });
                            }
                          }}
                          className={`
                            border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer flex items-center justify-center gap-3
                            ${
                              isFaviconDragging
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/20'
                            }
                          `}
                        >
                          <input
                            id="favicon-upload-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleLocalImageUpload(file, (url) => {
                                  setProfile({ ...profile, faviconUrl: url });
                                });
                              }
                            }}
                          />
                          <label
                            htmlFor="favicon-upload-input"
                            className="cursor-pointer flex items-center gap-2.5 w-full justify-center"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700 block">
                                Upload Favicon dari Komputer
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Format .ico, .png, atau .svg (32x32 / 64x64)
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Favicon URL input & Action buttons */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            placeholder="Atau tempel URL gambar Favicon (https://...)"
                            value={profile.faviconUrl || ''}
                            onChange={(e) => setProfile({ ...profile, faviconUrl: e.target.value })}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                          {profile.avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setProfile({ ...profile, faviconUrl: profile.avatarUrl })}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors shrink-0"
                              title="Gunakan Logo Portal yang telah diupload sebagai Favicon"
                            >
                              Gunakan Logo Portal
                            </button>
                          )}
                          {profile.faviconUrl && (
                            <button
                              type="button"
                              onClick={() => setProfile({ ...profile, faviconUrl: '' })}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors shrink-0"
                              title="Hapus Favicon Kustom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Quick Favicon Emojis / Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 font-semibold">Simbol Cepat:</span>
                          {[
                            { label: '🏢 Kantor', emoji: '🏢' },
                            { label: '🏛️ Instansi', emoji: '🏛️' },
                            { label: '💼 Kerja', emoji: '💼' },
                            { label: '📋 HR', emoji: '📋' },
                            { label: '⚡ Kilat', emoji: '⚡' },
                            { label: '🛡️ Aman', emoji: '🛡️' },
                            { label: '🌟 Bintang', emoji: '🌟' },
                            { label: '🌐 Web', emoji: '🌐' },
                          ].map((item) => (
                            <button
                              key={item.emoji}
                              type="button"
                              onClick={() => {
                                const svgFavicon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${item.emoji}</text></svg>`;
                                setProfile({ ...profile, faviconUrl: svgFavicon });
                              }}
                              className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
                              title={`Gunakan emoji ${item.emoji} sebagai favicon`}
                            >
                              {item.emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Presets */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Preset Tema Microsite</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setProfile({ ...profile, theme: { ...preset } });
                          triggerSaveFeedback();
                        }}
                        className={`
                          p-4 rounded-xl border text-left transition-all
                          ${
                            profile.theme.id === preset.id
                              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500 text-slate-900 shadow-xs'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                          {profile.theme.id === preset.id && (
                            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 h-6 rounded-lg overflow-hidden border border-slate-200 p-0.5 bg-white">
                          <div style={{ backgroundColor: preset.primaryBg }} className="flex-1 h-full rounded" />
                          <div style={{ backgroundColor: preset.secondaryBg }} className="flex-1 h-full rounded" />
                          <div style={{ backgroundColor: preset.accentColor }} className="w-6 h-full rounded" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Background Upload Card */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Upload className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Background Kustom (Upload dari Komputer)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Ganti latar belakang portal dengan foto kantor, banner perusahaan, atau gambar desain sendiri
                      </p>
                    </div>

                    {profile.theme.customBgImage && (
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          profile.theme.bgType === 'custom-image'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {profile.theme.bgType === 'custom-image' ? '● Background Aktif' : '○ Background Tersimpan'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Drag & Drop Upload Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsBgDragging(true);
                    }}
                    onDragLeave={() => setIsBgDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsBgDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        handleLocalImageUpload(e.dataTransfer.files[0], (dataUrl) => {
                          setProfile({
                            ...profile,
                            theme: {
                              ...profile.theme,
                              customBgImage: dataUrl,
                              bgType: 'custom-image',
                              bgOverlayOpacity: profile.theme.bgOverlayOpacity ?? 70,
                              bgBlur: profile.theme.bgBlur ?? 2,
                              bgFit: profile.theme.bgFit ?? 'cover',
                              bgOverlayColor: profile.theme.bgOverlayColor ?? '#0f172a',
                            },
                          });
                        });
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isBgDragging
                        ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                        : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleLocalImageUpload(e.target.files[0], (dataUrl) => {
                            setProfile({
                              ...profile,
                              theme: {
                                ...profile.theme,
                                customBgImage: dataUrl,
                                bgType: 'custom-image',
                                bgOverlayOpacity: profile.theme.bgOverlayOpacity ?? 70,
                                bgBlur: profile.theme.bgBlur ?? 2,
                                bgFit: profile.theme.bgFit ?? 'cover',
                                bgOverlayColor: profile.theme.bgOverlayColor ?? '#0f172a',
                              },
                            });
                          });
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />

                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200 text-indigo-600">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        Klik untuk Memilih File Background dari Komputer atau Drag & Drop ke Sini
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Mendukung format gambar resolusi tinggi (PNG, JPG, JPEG, WebP)
                      </p>
                    </div>
                  </div>

                  {/* Preset Background Cepat & URL Input */}
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">Preset Wallpaper Kantor & Tekstur:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          {
                            name: '🏢 Gedung Modern',
                            url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80',
                          },
                          {
                            name: '💻 Ruang Rapat Tech',
                            url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80',
                          },
                          {
                            name: '🌿 Kantor Hijau Eco',
                            url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1600&auto=format&fit=crop&q=80',
                          },
                          {
                            name: '🌌 Dark Sleek Grid',
                            url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=80',
                          },
                        ].map((bgItem) => (
                          <button
                            key={bgItem.name}
                            type="button"
                            onClick={() => {
                              setProfile({
                                ...profile,
                                theme: {
                                  ...profile.theme,
                                  customBgImage: bgItem.url,
                                  bgType: 'custom-image',
                                  bgOverlayOpacity: profile.theme.bgOverlayOpacity ?? 70,
                                  bgBlur: profile.theme.bgBlur ?? 2,
                                  bgFit: 'cover',
                                },
                              });
                              triggerSaveFeedback();
                            }}
                            className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors"
                          >
                            {bgItem.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">atau URL Langsung:</span>
                      <input
                        type="text"
                        placeholder="https://.../gambar-background.jpg"
                        value={profile.theme.customBgImage || ''}
                        onChange={(e) => {
                          setProfile({
                            ...profile,
                            theme: {
                              ...profile.theme,
                              customBgImage: e.target.value,
                              bgType: e.target.value ? 'custom-image' : profile.theme.bgType,
                            },
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Active Custom Background Preview & Fine-tune Controls */}
                  {profile.theme.customBgImage && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      {/* Image Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 rounded-lg border border-slate-200 overflow-hidden relative shadow-xs bg-slate-900 shrink-0">
                            <img
                              src={profile.theme.customBgImage}
                              alt="Background Preview"
                              className="w-full h-full object-cover"
                            />
                            <div
                              style={{
                                backgroundColor: profile.theme.bgOverlayColor || '#0f172a',
                                opacity: (profile.theme.bgOverlayOpacity ?? 70) / 100,
                              }}
                              className="absolute inset-0"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              Preview Background & Efek Overlay
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Sesuaikan transparansi dan blur agar teks & tombol tetap kontras
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setProfile({
                                ...profile,
                                theme: {
                                  ...profile.theme,
                                  bgType: profile.theme.bgType === 'custom-image' ? 'mesh' : 'custom-image',
                                },
                              });
                              triggerSaveFeedback();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              profile.theme.bgType === 'custom-image'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {profile.theme.bgType === 'custom-image' ? '✓ Sedang Digunakan' : 'Terapkan Background Ini'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProfile({
                                ...profile,
                                theme: {
                                  ...profile.theme,
                                  customBgImage: undefined,
                                  bgType: 'mesh',
                                },
                              });
                              triggerSaveFeedback();
                            }}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition-colors"
                            title="Hapus Background Kustom"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      {/* Fine-Tuning Sliders & Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-200">
                        {/* Overlay Darkness Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-slate-700">
                              Kegelapan Overlay: <span className="text-indigo-600 font-bold">{profile.theme.bgOverlayOpacity ?? 70}%</span>
                            </label>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="95"
                            step="5"
                            value={profile.theme.bgOverlayOpacity ?? 70}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                theme: {
                                  ...profile.theme,
                                  bgOverlayOpacity: parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                            <span>0% (Terang)</span>
                            <span>70% (Standar)</span>
                            <span>95% (Gelap)</span>
                          </div>
                        </div>

                        {/* Blur Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-slate-700">
                              Efek Blur Latar: <span className="text-indigo-600 font-bold">{profile.theme.bgBlur ?? 2}px</span>
                            </label>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={profile.theme.bgBlur ?? 2}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                theme: {
                                  ...profile.theme,
                                  bgBlur: parseInt(e.target.value),
                                },
                              })
                            }
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                            <span>0px (Tajam)</span>
                            <span>2px (Halus)</span>
                            <span>20px (Glassy)</span>
                          </div>
                        </div>

                        {/* Background Fit */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Gaya Tampilan (Fit)
                          </label>
                          <select
                            value={profile.theme.bgFit || 'cover'}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                theme: {
                                  ...profile.theme,
                                  bgFit: e.target.value as any,
                                },
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="cover">🖼️ Cover (Penuh Layar)</option>
                            <option value="contain">🔍 Contain (Proporsional)</option>
                            <option value="tile">🔲 Tile (Ulang Pola)</option>
                          </select>
                        </div>

                        {/* Tint Color */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Warna Lapisan Tint
                          </label>
                          <select
                            value={profile.theme.bgOverlayColor || '#0f172a'}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                theme: {
                                  ...profile.theme,
                                  bgOverlayColor: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="#0f172a">🌑 Slate Navy (Default)</option>
                            <option value="#000000">⬛ Hitam Pekat (True Black)</option>
                            <option value="#0c1b33">🔷 Navy Korporat</option>
                            <option value="#06281e">🌲 Emerald Forest</option>
                            <option value="#1e1b4b">🟣 Deep Indigo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Layout & Card Styling */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Tata Letak & Gaya Kartu</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Format Tata Letak Tombol
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, theme: { ...profile.theme, layoutStyle: 'stacked' } })}
                          className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                            profile.theme.layoutStyle === 'stacked'
                              ? 'border-2 border-indigo-600 bg-indigo-50 font-bold text-indigo-600'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          📜 Kolom Stacked
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, theme: { ...profile.theme, layoutStyle: 'bento' } })}
                          className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                            profile.theme.layoutStyle === 'bento'
                              ? 'border-2 border-indigo-600 bg-indigo-50 font-bold text-indigo-600'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          🍱 Grid Bento
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Kelengkungan Sudut Tombol (Radius)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 'rounded-none', label: 'None' },
                          { value: 'rounded-lg', label: 'Soft' },
                          { value: 'rounded-2xl', label: 'Medium' },
                          { value: 'rounded-full', label: 'Full' },
                        ].map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() =>
                              setProfile({
                                ...profile,
                                theme: { ...profile.theme, cardRadius: r.value as any },
                              })
                            }
                            className={`py-2 px-1 border text-xs rounded transition-all text-center ${
                              profile.theme.cardRadius === r.value
                                ? 'border-2 border-indigo-600 bg-indigo-50 font-bold text-indigo-600'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Customization */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 shadow-xs">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        Pengaturan Teks & Lencana Footer
                      </h3>
                      <p className="text-xs text-slate-500">
                        Sesuaikan tulisan keamanan, hak cipta, dan catatan resmi yang tampil di bagian bawah portal
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Teks Lencana Keamanan / Status (Badge Atas Footer)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Kosongkan jika ingin disembunyikan</span>
                      </label>
                      <input
                        type="text"
                        value={profile.footerBadgeText || ''}
                        placeholder="Contoh: Portal Resmi Pegawai • Akses Terenkripsi & Terverifikasi"
                        onChange={(e) => {
                          setProfile({ ...profile, footerBadgeText: e.target.value });
                          triggerSaveFeedback();
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Catatan Tambahan Footer (Deskripsi / SOP Singkat)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                      </label>
                      <textarea
                        rows={2}
                        value={profile.footerText || ''}
                        placeholder="Contoh: Gunakan jaringan intranet kantor atau VPN perusahaan saat mengakses database sensitif."
                        onChange={(e) => {
                          setProfile({ ...profile, footerText: e.target.value });
                          triggerSaveFeedback();
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Teks Hak Cipta & Kepemilikan (Copyright)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium px-2 py-2 bg-slate-100 rounded-lg border border-slate-200 whitespace-nowrap">
                          {profile.name} © {new Date().getFullYear()} •
                        </span>
                        <input
                          type="text"
                          value={profile.footerCopyright || ''}
                          placeholder="Contoh: Portal Layanan Internal Pegawai"
                          onChange={(e) => {
                            setProfile({ ...profile, footerCopyright: e.target.value });
                            triggerSaveFeedback();
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social & Contact Links Management */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Globe className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Kontak Cepat & Media Sosial (Pesan, Email, Telepon, Internet, Lokasi)
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Atur ikon tombol pintas kontak cepat yang tampil di header profil publik. Anda dapat menambah, mengubah, mengaktifkan/menonaktifkan, atau menghapus tautan kontak.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newId = `social-${Date.now()}`;
                        const newSocial = {
                          id: newId,
                          platform: 'whatsapp' as const,
                          label: 'WhatsApp Admin',
                          url: 'https://wa.me/6281234567890',
                          isActive: true,
                        };
                        setProfile({
                          ...profile,
                          socialLinks: [...(profile.socialLinks || []), newSocial],
                        });
                        triggerSaveFeedback();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kontak</span>
                    </button>
                  </div>

                  {(!profile.socialLinks || profile.socialLinks.length === 0) ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Belum ada ikon kontak cepat.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol &quot;Tambah Kontak&quot; di atas untuk menambahkan pesan WhatsApp, email, telepon, internet/website, atau Google Maps.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profile.socialLinks.map((social, index) => (
                        <div
                          key={social.id || index}
                          className={`p-3.5 rounded-xl border transition-all ${
                            social.isActive
                              ? 'bg-slate-50/80 border-slate-200'
                              : 'bg-slate-100/50 border-slate-200/60 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Platform selector with icon preview */}
                            <div className="w-full sm:w-44 shrink-0">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Jenis / Tipe Kontak
                              </label>
                              <select
                                value={social.platform}
                                onChange={(e) => {
                                  const updated = (profile.socialLinks || []).map((s, i) =>
                                    i === index ? { ...s, platform: e.target.value as any } : s
                                  );
                                  setProfile({ ...profile, socialLinks: updated });
                                  triggerSaveFeedback();
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="whatsapp">💬 Pesan (WhatsApp / Chat)</option>
                                <option value="email">✉️ Email (Surel)</option>
                                <option value="phone">📞 Telepon / Hotline</option>
                                <option value="website">🌐 Internet / Website</option>
                                <option value="maps">📍 Lokasi (Google Maps)</option>
                                <option value="instagram">📸 Instagram</option>
                                <option value="youtube">🎥 YouTube</option>
                                <option value="tiktok">🎵 TikTok</option>
                                <option value="facebook">👥 Facebook</option>
                                <option value="twitter">🐦 Twitter / X</option>
                              </select>
                            </div>

                            {/* Label */}
                            <div className="w-full sm:w-44 shrink-0">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Label / Judul
                              </label>
                              <input
                                type="text"
                                value={social.label}
                                placeholder="Contoh: WhatsApp HRD"
                                onChange={(e) => {
                                  const updated = (profile.socialLinks || []).map((s, i) =>
                                    i === index ? { ...s, label: e.target.value } : s
                                  );
                                  setProfile({ ...profile, socialLinks: updated });
                                  triggerSaveFeedback();
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* URL */}
                            <div className="flex-1">
                              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Tautan URL / Nomor / Alamat
                              </label>
                              <input
                                type="text"
                                value={social.url}
                                placeholder={
                                  social.platform === 'whatsapp'
                                    ? 'https://wa.me/6281234567890'
                                    : social.platform === 'email'
                                    ? 'mailto:helpdesk@perusahaan.co.id'
                                    : social.platform === 'phone'
                                    ? 'tel:0211234567'
                                    : social.platform === 'maps'
                                    ? 'https://maps.google.com/...'
                                    : 'https://...'
                                }
                                onChange={(e) => {
                                  const updated = (profile.socialLinks || []).map((s, i) =>
                                    i === index ? { ...s, url: e.target.value } : s
                                  );
                                  setProfile({ ...profile, socialLinks: updated });
                                  triggerSaveFeedback();
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* Action Buttons: Toggle Active & Delete */}
                            <div className="flex items-center gap-1.5 pt-4 sm:pt-4 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                title={social.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                onClick={() => {
                                  const updated = (profile.socialLinks || []).map((s, i) =>
                                    i === index ? { ...s, isActive: !s.isActive } : s
                                  );
                                  setProfile({ ...profile, socialLinks: updated });
                                  triggerSaveFeedback();
                                }}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  social.isActive
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300'
                                }`}
                              >
                                {social.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                title="Hapus Kontak"
                                onClick={() => {
                                  if (window.confirm(`Hapus kontak "${social.label}"?`)) {
                                    const updated = (profile.socialLinks || []).filter((_, i) => i !== index);
                                    setProfile({ ...profile, socialLinks: updated });
                                    triggerSaveFeedback();
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ANALITIK KLIK */}
            {activeTab === 'analytics' && (
              <AnalyticsView
                menus={menus}
                logs={logs}
                profile={profile}
                onSimulateClick={onSimulateClick}
                onClearLogs={onClearLogs}
              />
            )}

            {/* TAB: MONITORING WFA BIMBINGAN */}
            {activeTab === 'wfa_monitoring' && (
              <WfaMonitoringView
                submissions={wfaSubmissions}
                onUpdateStatus={onUpdateWfaStatus || (async () => ({ success: true }))}
                onDeleteSubmission={onDeleteWfaSubmission}
                onRefresh={onRefreshWfa}
              />
            )}

            {/* TAB 4: EKSPOR LAPORAN */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">Modul Ekspor Laporan & Data</h2>
                      <p className="text-xs text-slate-500">
                        Unduh rekap performa tombol direct menu dan histori log pengunjung
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* CSV Card */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                          <FileSpreadsheet className="w-5 h-5" />
                          <span>Format CSV (Excel / Spreadsheet)</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Berisi ringkasan performa setiap tombol menu (judul, status, ukuran, persentase konversi) dan seluruh log riwayat klik pengunjung dengan UTF-8 BOM yang kompatibel langsung dengan Microsoft Excel & Google Sheets.
                        </p>
                      </div>
                      <button
                        onClick={() => exportToCSV(menus, logs, profile)}
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        Unduh Laporan CSV (.csv)
                      </button>
                    </div>

                    {/* PDF Card */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                          <FileText className="w-5 h-5" />
                          <span>Format PDF (Dokumen Cetak Siap Presentasi)</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Menghasilkan dokumen PDF profesional siap cetak berstandar A4 yang dilengkapi kartu KPI, peringkat menu teratas, analisis distribusi perangkat, serta footer hak cipta usaha Anda.
                        </p>
                      </div>
                      <button
                        onClick={() => exportToPDF(menus, logs, profile)}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Unduh Dokumen PDF (.pdf)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Backup & Restore Config */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>💾 Sinkronisasi Kode Bawaan & Cadangan Data</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Kompatibel Multi-Device</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Saat Anda menekan <strong>Posting / Update Portal</strong>, data langsung tayang di portal pegawai pada browser Anda. Untuk memperbarui data bawaan agar tayang ke seluruh perangkat pegawai tanpa perlu login admin, Anda dapat mengunduh file kode data berikut.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Unduh File Kode Data (initialData.ts)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Unduh file TypeScript untuk menggantikan <code>src/data/initialData.ts</code> di repositori GitHub Anda.
                      </p>
                      <button
                        onClick={() => {
                          const fileContent = `import { MenuItem, MicrositeProfile, ClickLog, ThemeConfig } from '../types';\n\nexport const THEME_PRESETS: ThemeConfig[] = ${JSON.stringify(THEME_PRESETS, null, 2)};\n\nexport const CATEGORIES_PRESET: string[] = ${JSON.stringify(CATEGORIES_PRESET, null, 2)};\n\nexport const INITIAL_MENUS: MenuItem[] = ${JSON.stringify(menus, null, 2)};\n\nexport const INITIAL_PROFILE: MicrositeProfile = ${JSON.stringify(profile, null, 2)};\n\nexport const INITIAL_CLICK_LOGS: ClickLog[] = [];\n`;
                          const blob = new Blob([fileContent], { type: 'text/typescript' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `initialData.ts`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh initialData.ts</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Cadangkan, Salin & Pulihkan Konfigurasi</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Simpan seluruh konfigurasi ke file JSON atau salin teksnya langsung untuk disinkronkan ke kode aplikasi.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const dataStr = JSON.stringify({ menus, profile }, null, 2);
                            const blob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Backup_DirectMenu_${Date.now()}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex-1 min-w-[120px] py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>Unduh JSON</span>
                        </button>
                        <button
                          onClick={() => {
                            const dataStr = JSON.stringify({ menus, profile }, null, 2);
                            navigator.clipboard.writeText(dataStr);
                            alert('Teks Konfigurasi JSON berhasil disalin ke clipboard! Anda bisa mengirimkannya ke chat AI agar langsung dimasukkan ke initialData.ts');
                          }}
                          className="flex-1 min-w-[120px] py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Salin Teks JSON</span>
                        </button>
                        <label className="flex-1 min-w-[120px] py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>Impor File JSON</span>
                          <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                try {
                                  const parsed = JSON.parse(event.target?.result as string);
                                  if (parsed.menus) setMenus(parsed.menus);
                                  if (parsed.profile) setProfile(parsed.profile);
                                  alert('Konfigurasi berhasil dipulihkan!');
                                } catch {
                                  alert('Format file tidak valid');
                                }
                              };
                              reader.readAsText(file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SECURITY & ADMIN PIN SETTINGS */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        Pemisahan Akses Pegawai & Keamanan Admin
                      </h2>
                      <p className="text-xs text-slate-500">
                        Atur kata sandi (PIN) pengelola agar pegawai umum hanya dapat melihat menu tanpa bisa mengubah konfigurasi.
                      </p>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Halaman Pegawai (Publik): Terisolasi Aman</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-relaxed">
                        Saat tautan portal dibuka oleh pegawai biasa, mereka hanya melihat katalog menu layanan tanpa bilah navigasi admin atau kontrol pengeditan.
                      </p>
                    </div>

                    <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5 text-xs text-indigo-900">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-800">
                        <Key className="w-3.5 h-3.5" />
                        <span>Akses Admin: Dilindungi PIN</span>
                      </div>
                      <p className="text-[11px] text-indigo-700 leading-relaxed">
                        Pengelola portal dapat masuk melalui tombol kunci tersembunyi di footer, pintasan keyboard <code className="bg-indigo-100/80 px-1 py-0.5 rounded font-mono font-bold">Alt + A</code>, atau URL <code className="bg-indigo-100/80 px-1 py-0.5 rounded font-mono font-bold">#admin</code>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Change PIN Form */}
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Ubah PIN / Password Admin</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ganti PIN pengelola portal dengan PIN rahasia baru (dikelola oleh Tim OSDM / Administrator).
                    </p>
                  </div>

                  {/* Current PIN Alert */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-700">
                    <span className="text-slate-500">PIN Admin Saat Ini:</span>
                    <span className="font-mono font-bold bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-900">
                      {adminPin}
                    </span>
                  </div>

                  {/* New PIN Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setPinChangeError('');
                      setPinChangeSuccess(false);

                      if (!newPinInput.trim()) {
                        setPinChangeError('PIN baru tidak boleh kosong.');
                        return;
                      }
                      if (newPinInput.length < 4) {
                        setPinChangeError('PIN minimal 4 karakter demi keamanan.');
                        return;
                      }
                      if (newPinInput !== confirmPinInput) {
                        setPinChangeError('Konfirmasi PIN tidak cocok dengan PIN baru.');
                        return;
                      }

                      if (setAdminPin) {
                        setAdminPin(newPinInput.trim());
                      }
                      setNewPinInput('');
                      setConfirmPinInput('');
                      setPinChangeSuccess(true);
                      triggerSaveFeedback();
                      setTimeout(() => setPinChangeSuccess(false), 4000);
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          PIN / Password Baru
                        </label>
                        <input
                          type="password"
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          placeholder="Masukkan PIN baru..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ulangi PIN Baru
                        </label>
                        <input
                          type="password"
                          value={confirmPinInput}
                          onChange={(e) => setConfirmPinInput(e.target.value)}
                          placeholder="Ketik ulang PIN baru..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {pinChangeError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
                        {pinChangeError}
                      </div>
                    )}

                    {pinChangeSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>PIN Admin berhasil diperbarui dan disinkronkan ke Cloud Database Firebase! Berlaku otomatis di semua perangkat dan browser.</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Simpan PIN Baru</span>
                      </button>

                      {onLogout && (
                        <button
                          type="button"
                          onClick={onLogout}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5 text-slate-500" />
                          <span>Kunci & Keluar ke Tampilan Pegawai</span>
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sleek Live Mobile Phone Mockup */}
          {showLiveSidePreview && (
            <div className="xl:col-span-4 sticky top-20 hidden xl:block">
              <div className="bg-slate-200/70 rounded-3xl p-6 border border-slate-300/80 relative overflow-hidden flex flex-col items-center">
                {/* Subtle dot matrix grid background from sleek design */}
                <div className="absolute inset-0 bg-dot-pattern-light opacity-35 pointer-events-none" />

                {/* Floating Top Header */}
                <div className="w-full flex items-center justify-between mb-4 z-10">
                  <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-slate-600 shadow-xs uppercase tracking-tight">
                    Live Mobile Preview
                  </div>
                  <button
                    onClick={onOpenPublicPreview}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md"
                  >
                    Buka Penuh <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Smartphone Device Frame Mockup with Sleek Bezel */}
                <div className="relative w-[300px] h-[580px] bg-white rounded-[40px] border-[8px] border-slate-900 shadow-2xl flex flex-col overflow-hidden z-10">
                  {/* Dynamic Island / Notch */}
                  <div className="h-6 w-32 bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20" />

                  {/* Screen Content */}
                  <div className="flex-1 w-full overflow-y-auto no-scrollbar scrollbar-none pt-4">
                    <PublicMicrosite
                      profile={profile}
                      menus={menus}
                      onMenuClick={(m) => {
                        // In live simulator preview, record simulation click
                        onSimulateClick();
                      }}
                      onOpenQR={onOpenQR}
                      isStandalone={false}
                    />
                  </div>

                  {/* Home Indicator Bar */}
                  <div className="w-24 h-1 bg-slate-400/40 rounded-full mx-auto my-1.5 shrink-0" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save feedback toast */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg shadow-xl font-medium text-xs border border-slate-800"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Perubahan tersimpan otomatis!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Editor Modal */}
      <AdminMenuEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveMenu}
        initialMenu={editingMenu}
        currentTheme={profile.theme}
        availableCategories={availableCategories}
      />
    </div>
  );
};
