'use client';

/**
 * 日夜主题切换按钮
 *
 * - 主题值统一存放在 localStorage 的 `nav-theme` 键（与根布局中的防闪烁脚本一致）；
 * - 未显式设置过时，跟随 `prefers-color-scheme`；
 * - 通过 document.documentElement.classList 切换 `dark`；
 * - SSR 水合安全：mounted 之前不渲染图标，避免服务端 / 客户端标记不一致；
 * - 切换瞬间播放一次光晕扩散动画。
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MoonIcon, SunIcon } from '@/components/icons';

/** 与 src/app/layout.tsx 中的防闪烁脚本保持一致的存储键 */
const THEME_STORAGE_KEY = 'nav-theme';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [pulseKey, setPulseKey] = useState(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  /** 应用主题到 <html> 与 localStorage */
  const applyTheme = useCallback((next: Theme, persist: boolean): void => {
    setTheme(next);

    const root = document.documentElement;
    if (next === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (persist) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // 隐私模式下 localStorage 可能不可写，忽略即可
      }
    }
  }, []);

  // 首次挂载后读取真实主题（避免 SSR 阶段访问 window）
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;

    let initial: Theme = prefersDark ? 'dark' : 'light';
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        initial = stored;
      }
    } catch {
      // 读取失败时退回系统偏好
    }

    // 与防闪烁脚本结果对齐，避免闪烁
    applyTheme(initial, false);
    setMounted(true);

    // 用户未手动选择过时，跟随系统主题变化
    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const handleSystemChange = (event: MediaQueryListEvent): void => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        stored = null;
      }
      if (stored === 'dark' || stored === 'light') {
        return;
      }
      applyTheme(event.matches ? 'dark' : 'light', false);
    };

    if (media && typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleSystemChange);
      return () => media.removeEventListener('change', handleSystemChange);
    }

    return undefined;
  }, [applyTheme]);

  const handleToggle = (): void => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    setPulseKey((key) => key + 1);

    // 切换后把焦点还给按钮，保证键盘可达性
    buttonRef.current?.focus();
  };

  const isDark = theme === 'dark';
  const label = isDark ? '切换到浅色模式' : '切换到深色模式';

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      aria-pressed={mounted ? isDark : undefined}
      className="surface relative isolate inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[color:var(--fg)] transition-[transform,box-shadow] duration-300 hover:scale-105 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_10px_30px_-12px_rgba(99,102,241,0.55)] active:scale-95"
    >
      {/* 光晕扩散层 */}
      <AnimatePresence>
        {pulseKey > 0 ? (
          <motion.span
            key={pulseKey}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.85),rgba(99,102,241,0.55)_45%,transparent_70%)]"
            initial={{ scale: 0.2, opacity: 0.85 }}
            animate={{ scale: 3.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        ) : null}
      </AnimatePresence>

      {/* 图标交叉淡入 + 旋转（spring） */}
      {mounted ? (
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={theme}
            aria-hidden="true"
            className="relative inline-flex items-center justify-center"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 0.7 }}
          >
            {isDark ? <MoonIcon size={19} /> : <SunIcon size={19} />}
          </motion.span>
        </AnimatePresence>
      ) : (
        <span aria-hidden="true" className="relative inline-flex h-[19px] w-[19px]" />
      )}
    </button>
  );
}