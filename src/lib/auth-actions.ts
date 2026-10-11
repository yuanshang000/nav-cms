'use server';

/**
 * 后台鉴权相关的 Server Action
 *
 * 说明：Next 16 中 `cookies()` 是异步的，必须 `await`。
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE, verifyPassword } from './auth';
import type { LoginState } from './types';

/** 仅允许站内相对路径，避免开放重定向 */
function safeNextPath(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value.startsWith('/')) {
    return '/admin';
  }
  // 防止 `//evil.com` 形式的协议相对地址
  if (value.startsWith('//')) {
    return '/admin';
  }
  // 登录页自身不再跳转回登录页
  if (value === '/admin/login' || value.startsWith('/admin/login?') || value.startsWith('/admin/login/')) {
    return '/admin';
  }
  return value;
}

/**
 * 登录：校验密码 → 写入 session cookie → 跳转到 next 或 /admin
 *
 * 使用 `useActionState` 时签名为 `(prevState, formData)`。
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  const next = safeNextPath(formData.get('next'));

  if (!password) {
    return { error: '请输入管理密码', password };
  }

  if (!verifyPassword(password)) {
    return { error: '密码不正确，请重新输入', password: '' };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  // redirect 抛出特殊错误，必须放在最后且不包裹 try/catch
  redirect(next);
}

/** 退出登录：清除 session cookie 并跳转登录页 */
export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect('/admin/login');
}
