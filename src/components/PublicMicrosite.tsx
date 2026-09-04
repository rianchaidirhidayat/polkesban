import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { MenuItem, MicrositeProfile, ThemeConfig } from '../types';
import { DirectMenuButton } from './DirectMenuButton';
import { MenuPinModal } from './MenuPinModal';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Share2,
  QrCode,
  Search,
  Sparkles,
  Phone,
  Instagram,
  MessageCircle,
  Video,
  Globe,
  Mail,
  ShieldCheck,
  ExternalLink,
  Lock
} from 'lucide-react';

interface PublicMicrositeProps {
  profile: MicrositeProfile;
  menus: MenuItem[];
  onMenuClick: (menu: MenuItem) => void;
  onOpenQR: () => void;
  onOpenAdmin?: () => void;
  isStandalone?: boolean;
  lastPublishedAt?: string | null;
}

export const PublicMicrosite: React.FC<PublicMicrositeProps> = ({
  profile,
  menus,
  onMenuClick,
  onOpenQR,
  onOpenAdmin,
  isStandalone = false,
  lastPublishedAt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pinModalMenu, setPinModalMenu] = useState<MenuItem | null>(null);

  const theme = profile.theme;

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('Semua');
    menus.forEach((m) => {
      if (m.category && m.category.trim() !== '') {
        set.add(m.category.trim());
      }
    });
    return Array.from(set);
  }, [menus]);

  // Filtered active menus
  const filteredMenus = useMemo(() => {
    return menus
      .filter((m) => m.isActive)
      .filter((m) => {
        const matchesCategory =
          selectedCategory === 'Semua' || m.category === selectedCategory;
        const matchesSearch =
          searchQuery.trim() === '' ||
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.subtitle && m.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (m.badgeText && m.badgeText.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [menus, selectedCategory, searchQuery]);

  // Execute menu click action (confetti, tracking, and open link)
  const executeMenuAction = (menu: MenuItem) => {
    if (menu.type === 'whatsapp' || menu.badgeText?.toLowerCase().includes('promo') || menu.size === 'featured') {
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#6366f1', '#f59e0b'],
        });
      } catch {
        // fallback silently
      }
    }
    onMenuClick(menu);
  };

  // Handle menu click - intercepts PIN protected menus
  const handleButtonClick = (menu: MenuItem) => {
    if (menu.isProtected && menu.pinCode && menu.pinCode.trim() !== '') {
      setPinModalMenu(menu);
      return;
    }
    executeMenuAction(menu);
  };

  // Called when employee enters correct PIN
  const handlePinSuccess = (verifiedMenu: MenuItem) => {
    executeMenuAction(verifiedMenu);
    if (verifiedMenu.url) {
      window.open(verifiedMenu.url, verifiedMenu.openInNewTab ? '_blank' : '_self', 'noopener,noreferrer');
    }
  };

  // Get background styles
  const getPageBackgroundStyle = (): React.CSSProperties => {
    if (theme.bgType === 'custom-image' && theme.customBgImage) {
      return {
        backgroundColor: theme.primaryBg || '#0f172a',
      };
    }

    switch (theme.bgType) {
      case 'mesh':
        return {
          backgroundColor: theme.primaryBg || '#090d16',
          backgroundImage: `
            radial-gradient(circle at 15% 20%, ${theme.secondaryBg}66 0%, transparent 45%),
            radial-gradient(circle at 85% 80%, ${theme.accentColor}33 0%, transparent 45%)
          `,
        };
      case 'gradient':
        return {
          background: `linear-gradient(160deg, ${theme.primaryBg} 0%, ${theme.secondaryBg} 100%)`,
        };
      case 'dark-neon':
        return {
          backgroundColor: theme.primaryBg || '#0a0a0a',
          backgroundImage: `radial-gradient(circle at 50% 10%, ${theme.accentColor}25 0%, transparent 60%)`,
        };
      case 'warm-paper':
        return {
          backgroundColor: theme.primaryBg || '#1c1917',
          backgroundImage: `radial-gradient(circle at 50% 0%, ${theme.secondaryBg}80 0%, transparent 50%)`,
        };
      case 'solid':
      default:
        return {
          backgroundColor: theme.primaryBg || '#0f172a',
        };
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'tiktok':
      case 'youtube':
        return <Video className="w-4 h-4" />;
      case 'maps':
        return <MapPin className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const isCustomBg = (theme.bgType === 'custom-image' || !!theme.customBgImage) && !!theme.customBgImage;

  return (
    <div
      style={getPageBackgroundStyle()}
      className={`min-h-full w-full relative overflow-hidden transition-colors duration-300 py-6 sm:py-10 px-3 sm:px-6 flex flex-col items-center justify-start font-${theme.fontFamily || 'sans'}`}
    >
      {/* Custom Background Image Layer with Blur & Fit */}
      {isCustomBg && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            style={{
              backgroundImage: `url(${theme.customBgImage})`,
              backgroundSize: theme.bgFit === 'contain' ? 'contain' : theme.bgFit === 'tile' ? 'auto' : 'cover',
              backgroundRepeat: theme.bgFit === 'tile' ? 'repeat' : 'no-repeat',
              backgroundPosition: 'center',
              filter: theme.bgBlur ? `blur(${theme.bgBlur}px)` : 'none',
              transform: theme.bgBlur ? 'scale(1.05)' : 'none', // Prevents edge artifacts when blur is applied
            }}
            className="absolute inset-0 w-full h-full transition-all duration-300"
          />
          {/* Tint Overlay for Text Readability */}
          <div
            style={{
              backgroundColor: theme.bgOverlayColor || '#0f172a',
              opacity: (theme.bgOverlayOpacity ?? 70) / 100,
            }}
            className="absolute inset-0 w-full h-full transition-opacity duration-300"
          />
        </div>
      )}

      <div className="w-full max-w-xl mx-auto flex flex-col items-center relative z-10">
        {/* Floating Share and QR Quick Actions */}
        <div className="w-full flex items-center justify-between gap-2 mb-4 px-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[11px] text-neutral-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-0.5" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
            {profile.footerBadgeText ? profile.footerBadgeText.split('•')[0].trim() : 'Portal Layanan Pegawai'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQR}
              title="Tampilkan QR Code"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shadow-sm hover:scale-105"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: profile.name,
                    text: profile.bio,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  onOpenQR();
                }
              }}
              title="Bagikan Halaman"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all shadow-sm hover:scale-105"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Card Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center text-center mb-6"
        >
          {/* Flexible Logo & Identity Container */}
          {profile.avatarUrl && (
            <div className="relative mb-4 group flex items-center justify-center">
              {(!profile.logoShape || profile.logoShape === 'landscape' || profile.logoShape === 'auto' || profile.logoShape === 'banner') ? (
                // Horizontal / Landscape / Banner Flexible Logo (Preserves full width & aspect ratio)
                <div
                  style={{
                    height: `${profile.logoHeight || 68}px`,
                    borderColor: theme.accentColor ? `${theme.accentColor}40` : '#3b82f640',
                  }}
                  className={`relative z-10 px-4 py-2 rounded-2xl border transition-all duration-300 flex items-center justify-center max-w-[90vw] sm:max-w-sm ${
                    profile.logoBackground === 'white'
                      ? 'bg-white shadow-md'
                      : profile.logoBackground === 'dark'
                      ? 'bg-slate-900/90 border-slate-700/80 shadow-lg backdrop-blur-sm'
                      : profile.logoBackground === 'transparent'
                      ? 'bg-transparent border-transparent'
                      : 'bg-white/10 border-white/15 backdrop-blur-md shadow-lg'
                  }`}
                >
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    style={{ maxHeight: `${(profile.logoHeight || 68) - 12}px` }}
                    className="w-auto h-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  {profile.isVerified && (
                    <div
                      title="Portal Resmi Terverifikasi"
                      style={{ backgroundColor: theme.accentColor || '#3b82f6' }}
                      className="absolute -top-1.5 -right-1.5 z-20 p-1 rounded-full text-white shadow-md border-2 border-slate-900"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 fill-white text-slate-900" />
                    </div>
                  )}
                </div>
              ) : profile.logoShape === 'rounded-square' ? (
                // Rounded Square App-Icon Style
                <div
                  style={{
                    width: `${profile.logoHeight || 72}px`,
                    height: `${profile.logoHeight || 72}px`,
                    borderColor: theme.accentColor || '#3b82f6',
                  }}
                  className={`p-2 rounded-2xl border-2 shadow-xl relative z-10 overflow-hidden flex items-center justify-center ${
                    profile.logoBackground === 'white'
                      ? 'bg-white'
                      : profile.logoBackground === 'dark'
                      ? 'bg-slate-900'
                      : profile.logoBackground === 'transparent'
                      ? 'bg-transparent border-transparent'
                      : 'bg-white/10 backdrop-blur-md'
                  }`}
                >
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                  />
                  {profile.isVerified && (
                    <div
                      title="Portal Resmi Terverifikasi"
                      style={{ backgroundColor: theme.accentColor || '#3b82f6' }}
                      className="absolute -bottom-1 -right-1 z-20 p-0.5 rounded-full text-white shadow-md border-2 border-slate-950"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 fill-white text-slate-900" />
                    </div>
                  )}
                </div>
              ) : (
                // Classic Circular Avatar
                <div
                  style={{
                    width: `${profile.logoHeight || 80}px`,
                    height: `${profile.logoHeight || 80}px`,
                    borderColor: theme.accentColor || '#3b82f6',
                  }}
                  className={`rounded-full p-1.5 border-2 shadow-xl relative z-10 overflow-hidden flex items-center justify-center ${
                    profile.logoBackground === 'white'
                      ? 'bg-white'
                      : profile.logoBackground === 'dark'
                      ? 'bg-slate-900'
                      : profile.logoBackground === 'transparent'
                      ? 'bg-transparent border-transparent'
                      : 'bg-white/10 backdrop-blur-md'
                  }`}
                >
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                  />
                  {profile.isVerified && (
                    <div
                      title="Portal Resmi Terverifikasi"
                      style={{ backgroundColor: theme.accentColor || '#3b82f6' }}
                      className="absolute bottom-0 right-0 z-20 p-1 rounded-full text-white shadow-md border-2 border-slate-950"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 fill-white text-slate-900" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile Name & Tagline */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h1
              style={{ color: theme.textColor || '#ffffff' }}
              className="text-xl sm:text-2xl font-extrabold tracking-tight"
            >
              {profile.name}
            </h1>
          </div>

          {profile.tagline && (
            <p
              style={{ color: theme.accentColor || '#10b981' }}
              className="text-xs sm:text-sm font-semibold tracking-wide mt-1 uppercase"
            >
              {profile.tagline}
            </p>
          )}

          {profile.bio && (
            <p
              style={{ color: theme.subtextColor || '#94a3b8' }}
              className="text-xs sm:text-sm max-w-md mt-2 leading-relaxed px-2"
            >
              {profile.bio}
            </p>
          )}

          {/* Info Badges (Location & Hours) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
            {profile.location && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[280px]">{profile.location}</span>
              </div>
            )}
            {profile.openingHours && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{profile.openingHours}</span>
              </div>
            )}
          </div>

          {/* Social Quick Icons */}
          {profile.socialLinks && profile.socialLinks.filter(s => s.isActive).length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {profile.socialLinks.filter(s => s.isActive).map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white border border-white/10 transition-all hover:scale-110 active:scale-95 shadow-sm"
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          )}
        </motion.div>

        {/* Search Bar */}
        <div className="w-full relative mb-3">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari layanan pegawai, presensi, slip gaji, SOP, form cuti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-black/40 border border-white/10 rounded-2xl text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500/80 backdrop-blur-md transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor:
                    selectedCategory === cat
                      ? theme.accentColor || '#10b981'
                      : 'rgba(255, 255, 255, 0.07)',
                  color: selectedCategory === cat ? '#ffffff' : '#cbd5e1',
                  borderColor: selectedCategory === cat ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                }}
                className={`
                  px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border
                  hover:scale-105 active:scale-95 shrink-0
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Direct Menus List */}
        <div
          className={`w-full ${
            theme.layoutStyle === 'bento'
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-3.5'
              : 'flex flex-col gap-3'
          }`}
        >
          {filteredMenus.length > 0 ? (
            filteredMenus.map((menu) => (
              <DirectMenuButton
                key={menu.id}
                menu={menu}
                theme={theme}
                onMenuClick={handleButtonClick}
                isPreviewMode={false}
              />
            ))
          ) : (
            <div className="w-full p-8 text-center bg-black/20 rounded-2xl border border-white/10 text-neutral-400 text-xs">
              Tidak ada layanan pegawai yang sesuai dengan filter &quot;{searchQuery || selectedCategory}&quot;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-10 mb-6 text-center space-y-2">
          {profile.footerBadgeText !== '' && (
            <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{profile.footerBadgeText || 'Portal Resmi Pegawai • Akses Terenkripsi & Terverifikasi'}</span>
            </div>
          )}

          {profile.footerText && (
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {profile.footerText}
            </p>
          )}

          {onOpenAdmin && (
            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-neutral-400 hover:text-indigo-300 border border-white/5 hover:border-indigo-500/20 transition-all opacity-60 hover:opacity-100"
                title="Akses Pengelola Menu (Khusus Administrator & HRD)"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Akses Pengelola</span>
              </button>
            </div>
          )}

          <p className="text-[10px] text-neutral-400">
            {profile.name} © {new Date().getFullYear()} • {profile.footerCopyright || 'Portal Layanan Internal Pegawai'}
          </p>
        </div>
      </div>

      {/* PIN Verification Modal for Protected Menus */}
      <MenuPinModal
        isOpen={!!pinModalMenu}
        menu={pinModalMenu}
        onClose={() => setPinModalMenu(null)}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
};
