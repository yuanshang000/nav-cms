import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME, verifySessionTokenEdge } from '@/lib/auth-edge';

/** 登录页路径本身不需要鉴权 */
const PUBLIC_PATHS = ['/admin/login'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * 后台鉴权中间件（Edge Runtime）
 *
 * - 拦截 /admin/*（排除登录页）；
 * - 未携带有效 session 时重定向到 /admin/login?next=<原始路径>；
 * - 这里不能 import node:crypto，因此使用基于 Web Crypto API 的 verifySessionTokenEdge。
 */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    // 打上标记：/admin/layout.tsx 依赖它避免把登录页再次重定向回登录页
    const headers = new Headers(request.headers);
    headers.set('x-nav-public-admin', '1');
    return NextResponse.next({ request: { headers } });
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authenticated = await verifySessionTokenEdge(token);

  if (authenticated) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.search = '';
  loginUrl.hash = '';
  loginUrl.searchParams.set('next', `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

