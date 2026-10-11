'use client';

/**
 * 前台主应用（客户端组件）
 *
 * 由 Server Component（src/app/page.tsx）传入序列化后的 `NavData`，
 * 内部负责：顶部导航、Hero 入场动画、搜索、分类筛选、链接卡片网格、页脚。
 *
 * 约束：
 * - 渲染期绝不访问 window / document / localStorage，所有浏览器 API 均在 useEffect 中使用；
 * - 不引入任何额外依赖，图标全部来自 @/components/icons；
 * - 使用 framer-motion v11（motion + AnimatePresence + Variants）。
 */

import { AnimatePresence, motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ArrowUpIcon,
  CloseIcon,
  ExternalIcon,
  GithubIcon,
  GridIcon,
  LinkIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  StarIcon,
} from '@/components/icons';
import { SiteLogo } from '@/components/site-logo';
import ThemeToggle from '@/components/theme-toggle';
import type { Category, NavData, NavItem } from '@/lib/types';

/* -------------------------------------------------------------------------- */
/*                                   通用工具                                   */
/* -------------------------------------------------------------------------- */

/** 从 URL 中解析 hostname（去掉 www. 前缀）；非法输入时降级为字符串截取 */
function getHostname(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./i, '');
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] ?? '';
  }
}

/** 数字千分位分隔 */
function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

/* -------------------------------------------------------------------------- */
/*                                   动画变体                                   */
/* -------------------------------------------------------------------------- */

const heroContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

const heroCharVariants: Variants = {
  hidden: { opacity: 0, y: 26, rotate: 8 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { type: 'spring', stiffness: 300, damping: 22 },
  },
};

const heroWordVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const gridContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};

const cardVariants: Variants = {
  enter: { opacity: 0, y: 20, scale: 0.96 },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 26 },
  },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.18, ease: 'easeIn' } },
};

/** 卡片内部元素在 hover 时的反馈 */
const iconHoverVariants: Variants = {
  hover: { scale: 1.14, rotate: -8 },
  center: { scale: 1, rotate: 0 },
};

const arrowHoverVariants: Variants = {
  hover: { x: 4, opacity: 1 },
  center: { x: 0, opacity: 0.7 },
};

/* -------------------------------------------------------------------------- */
/*                                 CountUp 组件                                */
/* -------------------------------------------------------------------------- */

interface CountUpProps {
  /** 目标数值 */
  value: number;
  /** 动画时长（ms） */
  duration?: number;
  className?: string;
}

/** 数字递增动画：进入视口后从 0 缓动到目标值 */
function CountUp({ value, duration = 1400, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const startedRef = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || startedRef.current) {
      return;
    }
    startedRef.current = true;

    const reduced =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    if (reduced) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const startedAt = performance.now();

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(display)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                               站点图标 / favicon                            */
/* -------------------------------------------------------------------------- */

interface SiteGlyphProps {
  item: NavItem;
  hostname: string;
}

/** 卡片图标：emoji 为主，叠加 Google favicon；favicon 加载失败自动降级为纯 emoji */
function SiteGlyph({ item, hostname }: SiteGlyphProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const showFavicon = hostname.length > 0 && !faviconFailed;

  return (
    <motion.span
      variants={iconHoverVariants}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--card-hover)] shadow-sm"
    >
      <span aria-hidden="true" className="text-[26px] leading-none">
        {item.icon}
      </span>

      {showFavicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute -bottom-1 -right-1 h-[18px] w-[18px] rounded-md bg-[color:var(--card-hover)] object-contain"
          onError={() => setFaviconFailed(true)}
        />
      ) : null}
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  链接卡片                                   */
/* -------------------------------------------------------------------------- */

interface NavCardProps {
  item: NavItem;
  category: Category | undefined;
}

function NavCard({ item, category }: NavCardProps) {
  const hostname = useMemo(() => getHostname(item.url), [item.url]);
  const accent = category?.color ?? '#6366f1';

  return (
    <motion.a
      layout
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      title={item.url}
      className="group block h-full rounded-2xl focus-visible:outline-none"
    >
      <motion.div
        whileHover="hover"
        animate="center"
        className="surface relative flex h-full flex-col overflow-hidden rounded-2xl p-4 transition-colors duration-300 group-hover:border-[color:rgba(99,102,241,0.45)] group-hover:shadow-[0_18px_50px_-26px_rgba(99,102,241,0.85)] sm:p-5"
      >
        {/* 边框发光扫过 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-400/12 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
        />

        <div className="relative flex items-start gap-3.5">
          <SiteGlyph item={item} hostname={hostname} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-[color:var(--fg)]">
                {item.title}
              </h3>
              <motion.span
                variants={arrowHoverVariants}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="ml-auto shrink-0 text-muted"
              >
                <ExternalIcon size={15} />
              </motion.span>
            </div>
            <p className="mt-1 truncate text-xs text-muted">{hostname || item.url}</p>
          </div>
        </div>

        <p className="relative mt-3 line-clamp-2 min-h-[2.6rem] text-[13px] leading-5 text-muted">
          {item.description || '暂无描述'}
        </p>

        <div className="relative mt-4 flex items-center justify-between gap-2">
          <span
            className="inline-flex max-w-[62%] items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{
              color: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
            }}
          >
            <span aria-hidden="true">{category?.icon ?? '📁'}</span>
            <span className="truncate">{category?.name ?? '未分类'}</span>
          </span>

          {item.tags.length > 0 ? (
            <span className="truncate text-[11px] text-muted">#{item.tags[0]}</span>
          ) : (
            <span className="text-[11px] text-muted">—</span>
          )}
        </div>
      </motion.div>
    </motion.a>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  空状态                                     */
/* -------------------------------------------------------------------------- */

interface EmptyStateProps {
  keyword: string;
  onReset: () => void;
}

function EmptyState({ keyword, onReset }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="show"
      className="surface flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center"
    >
      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15 text-indigo-500 dark:text-indigo-300">
        <span className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
        <span className="relative">
          <LinkIcon size={26} />
        </span>
      </span>

      <h3 className="mt-5 text-base font-semibold">没有找到匹配的链接</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {keyword ? (
          <>
            关键词 <span className="font-medium text-[color:var(--fg)]">“{keyword}”</span>{' '}
            没有匹配结果，换个关键词或选择其它分类试试。
          </>
        ) : (
          '当前分类下还没有链接，试试切换到其它分类吧。'
        )}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card-hover)] px-4 py-2 text-sm font-medium transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <SparklesIcon size={16} />
        重置筛选条件
      </button>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   头部导航                                   */
/* -------------------------------------------------------------------------- */

interface HeaderProps {
  siteName: string;
  siteSubtitle: string;
  githubUrl: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  scrolled: boolean;
}

function Header({
  siteName,
  siteSubtitle,
  githubUrl,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  scrolled,
}: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`surface border-x-0 border-t-0 transition-shadow duration-300 ${
          scrolled || menuOpen ? 'shadow-[0_10px_40px_-24px_rgba(15,18,34,0.55)]' : ''
        }`}
        style={{ backgroundColor: 'var(--header-bg)' }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label={`${siteName} 首页`}
            className="min-w-0 rounded-xl transition-opacity duration-200 hover:opacity-80"
          >
            <SiteLogo name={siteName} subtitle={siteSubtitle} size="sm" />
          </Link>

          <nav className="flex items-center gap-2" aria-label="站点导航">
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="前往 GitHub 仓库"
                title="GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--fg)] transition-[transform,box-shadow] duration-300 hover:scale-105 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_10px_30px_-12px_rgba(99,102,241,0.55)] active:scale-95"
              >
                <GithubIcon size={18} />
              </a>
            ) : null}

            <ThemeToggle />

            <Link
              href="/admin"
              className="hidden h-10 items-center gap-1.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm font-medium text-[color:var(--fg)] transition-[transform,box-shadow] duration-300 hover:scale-105 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_10px_30px_-12px_rgba(99,102,241,0.55)] active:scale-95 md:inline-flex"
            >
              <SettingsIcon size={16} />
              后台管理
            </Link>

            <button
              type="button"
              onClick={onToggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--fg)] transition-transform duration-200 active:scale-95 md:hidden"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={menuOpen ? 'close' : 'menu'}
                  aria-hidden="true"
                  className="inline-flex"
                  initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                >
                  {menuOpen ? <CloseIcon size={19} /> : <MenuIcon size={19} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </nav>
        </div>
      </div>

      {/* 移动端下拉导航 */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            id="mobile-nav"
            aria-label="移动端导航"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="surface overflow-hidden border-x-0 backdrop-blur-xl md:hidden"
            style={{ backgroundColor: 'var(--header-bg)' }}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 pb-5 pt-3 sm:px-6">
              <Link
                href="/#links"
                onClick={onCloseMenu}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[color:var(--card-hover)]"
              >
                <GridIcon size={17} className="text-muted" />
                全部链接
              </Link>

              {githubUrl ? (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onCloseMenu}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[color:var(--card-hover)]"
                >
                  <GithubIcon size={17} className="text-muted" />
                  GitHub 仓库
                </a>
              ) : null}

              <Link
                href="/admin"
                onClick={onCloseMenu}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[color:var(--card-hover)]"
              >
                <SettingsIcon size={17} className="text-muted" />
                后台管理
              </Link>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   页脚                                       */
/* -------------------------------------------------------------------------- */

interface FooterProps {
  footerText: string;
  icpText: string;
  githubUrl: string;
  siteName: string;
}

function Footer({ footerText, icpText, githubUrl, siteName }: FooterProps) {
  return (
    <footer className="relative mt-20 border-t border-[color:var(--border)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6 lg:px-8">
        <SiteLogo name={siteName} size="sm" showText={false} />

        {footerText ? <p className="text-sm text-muted">{footerText}</p> : null}

        {icpText ? (
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted transition-colors hover:text-[color:var(--fg)]"
          >
            {icpText}
          </a>
        ) : null}

        {githubUrl ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-[color:var(--fg)]"
          >
            <GithubIcon size={15} />
            View on GitHub
          </a>
        ) : null}
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   主组件                                     */
/* -------------------------------------------------------------------------- */

export interface NavAppProps {
  /** 服务端读取的完整导航数据 */
  data: NavData;
}

export default function NavApp({ data }: NavAppProps) {
  const { settings, categories, items } = data;

  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  /* ----------------------------- 派生数据 ----------------------------- */

  /** 各分类条目数量（含未归类） */
  const categoryCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.categoryId, (map.get(item.categoryId) ?? 0) + 1);
    }
    return map;
  }, [items]);

  /** 去重后的标签总数 */
  const tagCount = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const tag of item.tags) {
        const value = tag.trim().toLowerCase();
        if (value) {
          set.add(value);
        }
      }
    }
    return set.size;
  }, [items]);

  /** 分类 id -> 分类对象 */
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) {
      map.set(category.id, category);
    }
    return map;
  }, [categories]);

  /** 关键词拆分为多个 token（空格分隔，需全部命中） */
  const searchTokens = useMemo(
    () =>
      keyword
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length > 0),
    [keyword]
  );

  /** 搜索 + 分类筛选（可叠加） */
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== 'all' && item.categoryId !== activeCategory) {
        return false;
      }
      if (searchTokens.length === 0) {
        return true;
      }

      const hostname = getHostname(item.url);
      // 分类名与分类 emoji 一并纳入检索，避免搜「设计」只命中单条
      const category = categoryMap.get(item.categoryId);
      const haystack = [
        item.title,
        item.description,
        hostname,
        ...item.tags,
        category?.name ?? '',
        category?.icon ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchTokens.every((token) => haystack.includes(token));
    });
  }, [items, activeCategory, searchTokens, categoryMap]);

  /** Hero 副标题按词切分（保留尾部空格以便原样排版） */
  const subtitleTokens = useMemo(
    () => settings.siteSubtitle.match(/\S+\s*/g) ?? [],
    [settings.siteSubtitle]
  );

  const isFiltered = keyword.trim().length > 0 || activeCategory !== 'all';

  /* ------------------------------ 副作用 ------------------------------ */

  // 滚动状态：控制头部阴影与"回到顶部"按钮
  useEffect(() => {
    const handleScroll = (): void => {
      const offset = window.scrollY;
      setScrolled(offset > 8);
      setShowTopButton(offset > 420);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 全局快捷键："/" 或 Ctrl/⌘ + K 聚焦搜索框；Esc 关闭菜单 / 清空
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      const element = target instanceof HTMLElement ? target : null;
      const tagName = element?.tagName;
      const isTyping =
        tagName === 'INPUT' || tagName === 'TEXTAREA' || element?.isContentEditable === true;

      const isSlash = event.key === '/';
      const isCommandK =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

      if ((isSlash && !isTyping) || (isCommandK && !isTyping)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === 'Escape') {
        setMenuOpen(false);
        if (document.activeElement === searchInputRef.current) {
          setKeyword('');
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 移动端菜单展开时锁定页面滚动
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  /* ------------------------------ 交互方法 ----------------------------- */

  const resetFilters = useCallback((): void => {
    setKeyword('');
    setActiveCategory('all');
  }, []);

  const scrollToTop = useCallback((): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleMenu = useCallback((): void => {
    setMenuOpen((open) => !open);
  }, []);

  const closeMenu = useCallback((): void => {
    setMenuOpen(false);
  }, []);

  /* -------------------------------- 渲染 -------------------------------- */

  const statCards = [
    { label: '收录分类', value: categories.length, icon: <GridIcon size={16} /> },
    { label: '优质链接', value: items.length, icon: <LinkIcon size={16} /> },
    { label: '内容标签', value: tagCount, icon: <StarIcon size={16} /> },
  ];

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* ------------------------------ Header ------------------------------ */}
      <Header
        siteName={settings.siteName}
        siteSubtitle={settings.siteSubtitle}
        githubUrl={settings.githubUrl}
        menuOpen={menuOpen}
        onToggleMenu={toggleMenu}
        onCloseMenu={closeMenu}
        scrolled={scrolled}
      />

      <main className="flex-1">
        {/* ------------------------------- Hero ------------------------------ */}
        <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
          <div className="flex flex-col items-center text-center">
            <motion.span
              variants={fadeUpVariants}
              initial="hidden"
              animate="show"
              className="surface inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted"
            >
              <span className="text-brand-500 dark:text-brand-300">
                <SparklesIcon size={14} />
              </span>
              每日精选 · 持续更新
            </motion.span>

            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <motion.span
                variants={heroContainerVariants}
                initial="hidden"
                animate="show"
                aria-label={settings.siteName}
                className="inline-flex flex-wrap justify-center"
              >
                {Array.from(settings.siteName).map((char, index) => (
                  <motion.span
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${char}-${index}`}
                    variants={heroCharVariants}
                    aria-hidden="true"
                    className="inline-block bg-gradient-to-b from-[color:var(--fg)] to-brand-600 bg-clip-text text-transparent dark:to-brand-300"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </motion.span>
            </h1>

            {settings.siteSubtitle ? (
              <p className="mt-4 max-w-2xl text-balance text-base text-muted sm:text-lg">
                <motion.span
                  variants={heroContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="inline-block"
                >
                  {subtitleTokens.map((token, index) => (
                    <motion.span
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${token}-${index}`}
                      variants={heroWordVariants}
                      aria-hidden="true"
                      className="inline-block whitespace-pre"
                    >
                      {token}
                    </motion.span>
                  ))}
                </motion.span>
              </p>
            ) : null}

            {settings.siteDescription ? (
              <motion.p
                variants={fadeUpVariants}
                initial="hidden"
                animate="show"
                className="mt-5 max-w-2xl text-pretty text-sm leading-6 text-muted"
              >
                {settings.siteDescription}
              </motion.p>
            ) : null}

            {/* 统计数据 */}
            <div className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-4">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: 0.12 + index * 0.08 }}
                  className="surface flex flex-col items-center gap-1 rounded-2xl px-3 py-4"
                >
                  <span className="text-brand-500 dark:text-brand-300">{stat.icon}</span>
                  <span className="text-xl font-semibold tracking-tight sm:text-2xl">
                    <CountUp value={stat.value} />
                  </span>
                  <span className="text-[11px] text-muted sm:text-xs">{stat.label}</span>
                </motion.div>
              ))}
            </div>

            {/* 搜索框 */}
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.3 }}
              className="mt-8 w-full max-w-2xl"
            >
              <div className="surface group relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-shadow duration-300 focus-within:border-[color:rgba(99,102,241,0.5)] focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]">
                <span className="shrink-0 text-muted transition-colors group-focus-within:text-brand-500 dark:group-focus-within:text-brand-300">
                  <SearchIcon size={19} />
                </span>

                <input
                  ref={searchInputRef}
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索站点名称、描述、标签或域名…"
                  aria-label="搜索导航链接"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-[color:var(--fg)] outline-none placeholder:text-[color:var(--fg-muted)]"
                />

                {keyword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="清除搜索关键词"
                    className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:text-[color:var(--fg)]"
                  >
                    <CloseIcon size={16} />
                  </button>
                ) : (
                  <kbd className="hidden shrink-0 items-center gap-1 rounded-lg border border-[color:var(--border)] px-1.5 py-0.5 text-[10px] text-muted sm:inline-flex">
                    /
                  </kbd>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted">
                <span aria-live="polite">
                  {isFiltered
                    ? `匹配到 ${formatNumber(filteredItems.length)} 个链接`
                    : `共 ${formatNumber(items.length)} 个链接`}
                </span>
                <span className="hidden sm:inline">
                  按 <kbd className="rounded border border-[color:var(--border)] px-1">/</kbd> 或{' '}
                  <kbd className="rounded border border-[color:var(--border)] px-1">Ctrl</kbd> +{' '}
                  <kbd className="rounded border border-[color:var(--border)] px-1">K</kbd> 快速聚焦
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --------------------------- 分类筛选 --------------------------- */}
        <section id="links" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <GridIcon size={16} className="text-muted" />
              分类筛选
            </h2>

            {isFiltered ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:text-[color:var(--fg)]"
              >
                <CloseIcon size={13} />
                清除筛选
              </button>
            ) : null}
          </div>

          <div
            role="tablist"
            aria-label="分类筛选"
            className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {[{ id: 'all', name: '全部', icon: '✨', color: '#6366f1' }, ...categories].map(
              (category) => {
                const isActive = activeCategory === category.id;
                const count =
                  category.id === 'all' ? items.length : categoryCountMap.get(category.id) ?? 0;

                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(category.id)}
                    className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-white'
                        : 'text-muted hover:bg-[color:var(--card-hover)] hover:text-[color:var(--fg)]'
                    }`}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="category-pill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_8px_24px_-10px_rgba(99,102,241,0.9)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    ) : null}

                    <span className="relative flex items-center gap-1.5 whitespace-nowrap">
                      <span aria-hidden="true">{category.icon}</span>
                      <span>{category.name}</span>
                      <span
                        className={`rounded-full px-1.5 text-[11px] ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[color:var(--border)] text-muted'
                        }`}
                      >
                        {count}
                      </span>
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* --------------------------- 链接卡片网格 --------------------------- */}
        <section className="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredItems.length === 0 ? (
            <EmptyState keyword={keyword.trim()} onReset={resetFilters} />
          ) : (
            <motion.div
              layout
              variants={gridContainerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <NavCard key={item.id} item={item} category={categoryMap.get(item.categoryId)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      {/* ------------------------------- Footer ------------------------------ */}
      <Footer
        footerText={settings.footerText}
        icpText={settings.icpText}
        githubUrl={settings.githubUrl}
        siteName={settings.siteName}
      />

      {/* ----------------------------- 回到顶部 ----------------------------- */}
      <AnimatePresence>
        {showTopButton ? (
          <motion.button
            type="button"
            onClick={scrollToTop}
            aria-label="回到顶部"
            initial={{ opacity: 0, scale: 0.7, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 12 }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="surface fixed bottom-5 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-xl text-[color:var(--fg)] shadow-[0_14px_40px_-20px_rgba(15,18,34,0.7)] sm:right-8"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <ArrowUpIcon size={19} />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}