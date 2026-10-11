'use client';

import { useActionState, useState } from 'react';

import { loginAction } from '@/lib/auth-actions';
import type { LoginState } from '@/lib/types';
import { Button, Field, Input, ToastProvider } from '@/components/admin/ui';

const INITIAL_STATE: LoginState = { error: null, password: '' };

/** 登录卡片内容（ToastProvider 只包裹自身，避免影响整页） */
function LoginCard({ nextPath }: { nextPath: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    INITIAL_STATE,
  );
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="surface rounded-2xl p-6 shadow-xl shadow-slate-900/10 sm:p-8">
      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={nextPath} />

        <Field label="管理密码" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={revealed ? 'text' : 'password'}
              placeholder="请输入后台管理密码"
              autoComplete="current-password"
              required
              autoFocus
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setRevealed((prev) => !prev)}
              aria-label={revealed ? '隐藏密码' : '显示密码'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:text-[color:var(--fg)]"
            >
              {revealed ? (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l14 14M8.2 8.3a2.4 2.4 0 003.4 3.4M6.3 6.4C4.5 7.6 3.2 9.3 2.5 10c1.1 1.9 3.6 5 7.5 5 1.4 0 2.7-.4 3.8-1M11.5 5.2c.4-.1.8-.2 1.2-.2 3.9 0 6.4 3.1 7.5 5-.4.7-1 1.6-1.8 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 10S5 5 10 5s7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </button>
          </div>
        </Field>

        {state.error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-300"
          >
            <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 6.2v4.4M10 13.6v.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>{state.error}</span>
          </div>
        ) : null}

        <Button type="submit" size="lg" loading={isPending} className="w-full">
          {isPending ? '正在登录…' : '登录后台'}
        </Button>

        <p className="text-center text-xs text-muted">
          登录状态有效期为 7 天，Cookie 以 HttpOnly 方式存储
        </p>
      </form>
    </div>
  );
}

/** 登录表单（客户端） */
export default function LoginForm({ nextPath }: { nextPath: string }) {
  return (
    <ToastProvider>
      <LoginCard nextPath={nextPath} />
    </ToastProvider>
  );
}
