import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/auth';
import { getNavData } from '@/lib/store';

import AdminShell from './admin-shell';

export const metadata: Metadata = {
  title: {
    default: '后台管理',
    template: '%s · 后台管理',
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 登录页由 middleware 打上标记，需放行避免重定向死循环
  const requestHeaders = await headers();
  const isPublicAdmin = requestHeaders.get('x-nav-public-admin') === '1';

  if (isPublicAdmin) {
    return <>{children}</>;
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect('/admin/login');
  }

  // Next 16 中 cookies() 为异步，isAuthenticated 内部已 await
  const { settings } = await getNavData();

  return (
    <AdminShell siteName={settings.siteName} siteSubtitle={settings.siteSubtitle}>
      {children}
    </AdminShell>
  );
}
