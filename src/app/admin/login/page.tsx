import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/auth';
import { getNavData } from '@/lib/store';
import { SiteLogo } from '@/components/site-logo';

import LoginForm from './login-form';

export const metadata: Metadata = {
  title: '后台登录',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [authed, params, data] = await Promise.all([isAuthenticated(), searchParams, getNavData()]);

  const rawNext = params.next;
  const next = typeof rawNext === 'string' && rawNext.startsWith('/') && !rawNext.startsWith('//')
    ? rawNext
    : '/admin';

  // 已登录用户无需再次登录，直接回到目标页面
  if (authed) {
    redirect(next === '/admin/login' ? '/admin' : next);
  }

  return (
    <main className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-indigo-500/25 blur-[100px] animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-[110px] animate-float-slower" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <SiteLogo
            name={data.settings.siteName}
            subtitle={data.settings.siteSubtitle}
            size="lg"
            showText={false}
          />
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              欢迎回来，登录
              <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                后台管理
              </span>
            </h1>
            <p className="text-sm text-muted">管理分类、链接与站点信息</p>
          </div>
        </div>

        <LoginForm nextPath={next} />

        <p className="mt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} {data.settings.siteName}
          {data.settings.icpText ? ` · ${data.settings.icpText}` : ''}
        </p>
      </div>
    </main>
  );
}
