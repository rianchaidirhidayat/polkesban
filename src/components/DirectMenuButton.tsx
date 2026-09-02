import React from 'react';
import { motion } from 'motion/react';
import { MenuItem, ThemeConfig } from '../types';
import { getIconComponent } from '../utils/iconMap';
import { ExternalLink, ChevronRight, Zap, Sparkles } from 'lucide-react';

interface DirectMenuButtonProps {
  menu: MenuItem;
  theme: ThemeConfig;
  onMenuClick?: (menu: MenuItem) => void;
  isPreviewMode?: boolean;
  showClickBadge?: boolean;
}

export const DirectMenuButton: React.FC<DirectMenuButtonProps> = ({
  menu,
  theme,
  onMenuClick,
  isPreviewMode = false,
  showClickBadge = false,
}) => {
  if (!menu.isActive && !isPreviewMode) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (onMenuClick) {
      onMenuClick(menu);
    }
  };

  // Determine size classes
  const getSizeStyles = () => {
    switch (menu.size) {
      case 'compact':
        return {
          container: 'py-2.5 px-3.5 min-h-[46px] text-sm',
          iconBox: 'w-7 h-7 min-w-[28px] text-base',
          title: 'text-sm font-semibold',
          subtitle: 'text-xs opacity-80',
          badge: 'text-[10px] px-1.5 py-0.5',
        };
      case 'large':
        return {
          container: 'py-4 px-5 min-h-[72px]',
          iconBox: 'w-11 h-11 min-w-[44px] text-xl',
          title: 'text-base sm:text-lg font-bold tracking-tight',
          subtitle: 'text-xs sm:text-sm opacity-85 mt-0.5',
          badge: 'text-xs px-2.5 py-1 font-bold',
        };
      case 'featured':
        return {
          container: 'py-5 px-6 min-h-[88px] ring-2 ring-offset-2 ring-offset-neutral-950',
          iconBox: 'w-13 h-13 min-w-[52px] text-2xl shadow-lg',
          title: 'text-lg sm:text-xl font-extrabold tracking-tight',
          subtitle: 'text-xs sm:text-sm font-medium opacity-90 mt-1',
          badge: 'text-xs px-3 py-1 font-extrabold uppercase tracking-wider shadow-sm',
        };
      case 'bento-square':
        return {
          container: 'p-4 min-h-[130px] flex-col justify-between items-start text-left col-span-1',
          iconBox: 'w-10 h-10 text-xl mb-2',
          title: 'text-sm sm:text-base font-bold line-clamp-2',
          subtitle: 'text-xs opacity-80 line-clamp-1 mt-0.5',
          badge: 'text-[10px] px-2 py-0.5 self-start mb-1',
        };
      case 'bento-wide':
        return {
          container: 'p-4 sm:p-5 min-h-[110px] col-span-2 flex-row justify-between items-center',
          iconBox: 'w-11 h-11 min-w-[44px] text-xl',
          title: 'text-base sm:text-lg font-bold',
          subtitle: 'text-xs sm:text-sm opacity-85 mt-0.5',
          badge: 'text-xs px-2.5 py-0.5 font-bold',
        };
      case 'medium':
      default:
        return {
          container: 'py-3.5 px-4.5 min-h-[58px]',
          iconBox: 'w-9 h-9 min-w-[36px] text-lg',
          title: 'text-sm sm:text-base font-semibold',
          subtitle: 'text-xs opacity-85 mt-0.5',
          badge: 'text-[11px] px-2 py-0.5 font-semibold',
        };
    }
  };

  const sizeStyle = getSizeStyles();

  // Background styling
  const getBackgroundStyle = (): React.CSSProperties => {
    const isGrad = menu.isGradient;
    const fromColor = menu.bgColor || '#1e293b';
    const toColor = menu.gradientTo || fromColor;
    const angle = menu.gradientAngle || 135;

    let background = fromColor;
    if (isGrad) {
      background = `linear-gradient(${angle}deg, ${fromColor} 0%, ${toColor} 100%)`;
    }

    return {
      background,
      color: menu.textColor || '#ffffff',
      borderColor: menu.borderColor || 'transparent',
    };
  };

  // Animation variants
  const getAnimationClass = () => {
    switch (menu.animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      case 'glow':
        return 'shadow-[0_0_25px_rgba(255,255,255,0.25)]';
      case 'shimmer':
        return 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent';
      default:
        return '';
    }
  };

  const isBentoSquare = menu.size === 'bento-square';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.015, translateY: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18 }}
      className={`group w-full relative select-none ${menu.size === 'bento-wide' ? 'sm:col-span-2' : ''} ${menu.size === 'bento-square' ? 'col-span-1' : ''}`}
    >
      <a
        href={menu.url || '#'}
        target={menu.openInNewTab ? '_blank' : '_self'}
        rel="noopener noreferrer"
        onClick={handleClick}
        style={getBackgroundStyle()}
        className={`
          flex items-center justify-between gap-3.5 w-full text-left
          ${theme.cardRadius || 'rounded-2xl'}
          ${theme.cardGlassEffect ? 'backdrop-blur-md shadow-md' : 'shadow-sm'}
          ${sizeStyle.container}
          ${getAnimationClass()}
          border transition-all duration-200 cursor-pointer
          hover:shadow-lg hover:brightness-105 active:brightness-95
          ${!menu.isActive ? 'opacity-50 border-dashed border-red-500/50' : ''}
        `}
      >
        {/* Main Content Area */}
        <div className={`flex ${isBentoSquare ? 'flex-col items-start gap-2 w-full' : 'items-center gap-3.5 flex-1 min-w-0'}`}>
          {/* Icon Box */}
          <div
            className={`
              ${sizeStyle.iconBox}
              flex items-center justify-center rounded-xl bg-black/20 backdrop-blur-xs
              border border-white/10 transition-transform group-hover:scale-110 shrink-0
            `}
          >
            {getIconComponent(menu.iconName, 'w-5 h-5')}
          </div>

          {/* Text Details */}
          <div className="flex-1 min-w-0">
            {/* Optional Badge */}
            {menu.badgeText && (
              <div className="mb-1 flex items-center gap-1">
                <span
                  style={{
                    backgroundColor: menu.badgeBgColor || '#f59e0b',
                    color: menu.badgeTextColor || '#000000',
                  }}
                  className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider ${sizeStyle.badge}`}
                >
                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                  {menu.badgeText}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <h3 className={`${sizeStyle.title} truncate leading-snug`}>
                {menu.title}
              </h3>
              {menu.priceTag && (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono font-bold">
                  {menu.priceTag}
                </span>
              )}
            </div>

            {menu.subtitle && (
              <p className={`${sizeStyle.subtitle} leading-relaxed line-clamp-2`}>
                {menu.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Action Indicator */}
        {!isBentoSquare && (
          <div className="flex items-center gap-2 shrink-0 pl-1">
            {showClickBadge && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/90">
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                {menu.clickCount} klik
              </span>
            )}
            <div className="w-7 h-7 rounded-full bg-black/15 flex items-center justify-center group-hover:translate-x-1 transition-transform border border-white/10">
              <ChevronRight className="w-4 h-4 opacity-80" />
            </div>
          </div>
        )}
      </a>

      {/* Admin quick inactive indicator */}
      {!menu.isActive && (
        <span className="absolute -top-2 -right-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold shadow-md">
          Nonaktif
        </span>
      )}
    </motion.div>
  );
};
