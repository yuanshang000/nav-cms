'use client';

/**
 * 后台外壳（客户端）
 *
 * - 桌面端：左侧固定侧边栏（图标 + 文字）；
 * - 移动端：顶部横向滚动 Tab；
 * - 通过 usePathname 高亮当前导航项；
 * - 内置 ToastProvider，供各页面子组件使用 useToast。
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { logoutAction } from '@/lib/auth-actions';
import { cn, ToastProvider } from '@/components/admin/ui';
import { SiteLogo } from '@/components/site-logo';

interface NavEntry {
  href: string;
  label: string;
  icon: ReactNode;
  description: string;
}

function icon(path: string): ReactNode {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ENTRIES: NavEntry[] = [
  {
    href: '/admin',
    label: '仪表盘',
    description: '总览站点数据',
    icon: icon('M3 10.5L10 4l7 6.5M5 9.5V16h10V9.5'),
  },
  {
    href: '/admin/categories',
    label: '分类管理',
    description: '维护导航分类',
    icon: icon('M3 6.5A1.5 1.5 0 014.5 5h3.2l1.4 1.6H15.5A1.5 1.5 0 0117 8.1v6.4A1.5 1.5 0 0115.5 16h-11A1.5 1.5 0 013 14.5z'),
  },
  {
    href: '/admin/links',
    label: '链接管理',
    description: '增删改网站链接',
    icon: icon('M8.2 11.8a3 3 0 004.4.3l2.4-2.4a3 3 0 10-4.2-4.2l-1.3 1.3M11.8 8.2a3 3 0 00-4.4-.3L5 10.3a3 3 0 104.2 4.2l1.3-1.3'),
  },
  {
    href: '/admin/settings',
    label: '站点设置',
    description: '名称、页脚与备案',
    icon: icon('M10 12.6a2.6 2.6 0 100-5.2 2.6 2.6 0 000 5.2zM10 2.8l1.1 1.7 2-.4.5 2 1.9.8-.9 1.8.9 1.8-1.9.8-.5 2-2-.4L10 17.2l-1.1-1.7-2 .4-.5-2-1.9-.8.9-1.8-.9-1.8 1.9-.8.5-2 2 .4z'),
  },
];

/** 判断是否为当前激活项（/admin 需精确匹配） */
function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 明暗主题切换 */
function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      window.localStorage.setItem('nav-theme', next ? 'dark' : 'light');
    } catch {
      // 忽略隐私模式下的写入失败
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition-all duration-200 hover:bg-black/[0.04] hover:text-[color:var(--fg)] dark:hover:bg-white/[0.06]"
      aria-label={dark ? '切换为浅色主题' : '切换为深色主题'}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04] text-base dark:bg-white/[0.08]">
        {dark ? '🌙' : '☀️'}
      </span>
      <span className="flex-1 text-left">{dark ? '深色模式' : '浅色模式'}</span>
    </button>
  );
}

function Shell({ children, siteName, siteSubtitle }: {
  children: ReactNode;
  siteName: string;
  siteSubtitle: string;
}) {
  const pathname = usePathname();
  const current = NAV_ENTRIES.find((entry) => isActive(pathname, entry.href));

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ------------------------------ 移动端顶部 Tab ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--header-bg)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <SiteLogo name={siteName} size="sm" />
          <Link
            href="/"
            className="ml-auto rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-[color:var(--fg)]"
          >
            返回前台
          </Link>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
          {NAV_ENTRIES.map((entry) => {
            const active = isActive(pathname, entry.href);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25'
                    : 'text-muted hover:bg-black/[0.04] hover:text-[color:var(--fg)] dark:hover:bg-white/[0.06]',
                )}
              >
                {entry.icon}
                {entry.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ------------------------------ 桌面端侧边栏 ------------------------------ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[color:var(--border)] bg-[color:var(--header-bg)] backdrop-blur-xl lg:flex">
        <div className="px-5 py-6">
          <SiteLogo name={siteName} subtitle={siteSubtitle} size="md" />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ENTRIES.map((entry) => {
            const active = isActive(pathname, entry.href);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-600 ring-1 ring-indigo-500/25 dark:text-indigo-300'
                    : 'text-muted hover:bg-black/[0.04] hover:text-[color:var(--fg)] dark:hover:bg-white/[0.06]',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                    active
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-black/[0.04] group-hover:bg-black/[0.07] dark:bg-white/[0.06] dark:group-hover:bg-white/[0.1]',
                  )}
                >
                  {entry.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">{entry.label}</span>
                  <span className="block truncate text-[11px] opacity-70">{entry.description}</span>
                </span>
                {active ? (
                  <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-[color:var(--border)] p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition-all duration-200 hover:bg-black/[0.04] hover:text-[color:var(--fg)] dark:hover:bg-white/[0.06]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M8.5 4.5H5.2A1.2 1.2 0 004 5.7v9.1A1.2 1.2 0 005.2 16h9.1a1.2 1.2 0 001.2-1.2v-3.3M11.5 3.5h5v5M16 3.8l-6.6 6.6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            返回前台
          </Link>

          <ThemeToggle />

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M8 16H5.2A1.2 1.2 0 014 14.8V5.2A1.2 1.2 0 015.2 4H8M12.8 13.2L16 10l-3.2-3.2M16 10H7.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              退出登录
            </button>
          </form>
        </div>
      </aside>

      {/* --------------------------------- 主内容区 --------------------------------- */}
      <div className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <div className="mb-6 hidden lg:block">
            <h1 className="text-xl font-semibold tracking-tight">{current?.label ?? '后台管理'}</h1>
            <p className="mt-1 text-sm text-muted">{current?.description ?? ''}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** 后台外壳导出（带 ToastProvider） */
export default function AdminShell(props: {
  children: ReactNode;
  siteName: string;
  siteSubtitle: string;
}) {
  return (
    <ToastProvider>
      <Shell {...props} />
    </ToastProvider>
  );
}
