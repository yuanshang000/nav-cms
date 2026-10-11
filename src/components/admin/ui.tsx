'use client';

/**
 * 后台通用 UI 组件库
 *
 * 全部为客户端组件，供 `src/app/admin/**` 下的交互组件复用。
 * 设计基调：玻璃拟态卡片、圆角-xl、柔和阴影、indigo/violet 主色、明暗双主题。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

/* -------------------------------------------------------------------------- */
/*                                  工具函数                                   */
/* -------------------------------------------------------------------------- */

/** 拼接 className，过滤掉 false / null / undefined */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

/* -------------------------------------------------------------------------- */
/*                                    Button                                   */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BUTTON_BASE =
  'inline-flex select-none items-center justify-center gap-1.5 rounded-xl font-medium ' +
  'transition-all duration-200 ease-out active:scale-[0.97] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ' +
  'focus-visible:ring-offset-1 focus-visible:ring-offset-transparent ' +
  'disabled:pointer-events-none disabled:opacity-50';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 ' +
    'hover:from-indigo-400 hover:to-violet-400 hover:shadow-xl hover:shadow-indigo-500/35',
  secondary:
    'surface text-[color:var(--fg)] hover:border-indigo-400/50 hover:text-indigo-600 ' +
    'dark:hover:text-indigo-300',
  ghost:
    'text-muted hover:bg-black/[0.04] hover:text-[color:var(--fg)] dark:hover:bg-white/[0.06]',
  subtle:
    'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-400/15',
  danger:
    'bg-rose-500/90 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-500 ' +
    'hover:shadow-xl hover:shadow-rose-500/35',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
  icon: 'h-9 w-9',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...rest}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}

/** 加载指示器 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className ?? 'h-4 w-4')}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Field                                    */
/* -------------------------------------------------------------------------- */

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** 表单字段容器：标签 + 控件 + 提示/错误 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-xs font-medium tracking-wide text-muted"
      >
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Input / Textarea / Select                         */
/* -------------------------------------------------------------------------- */

const CONTROL_BASE =
  'w-full rounded-xl border border-[color:var(--border)] bg-white/60 px-3 text-sm text-[color:var(--fg)] ' +
  'placeholder:text-[color:var(--fg-muted)]/70 shadow-inner shadow-black/[0.02] ' +
  'transition-all duration-200 outline-none ' +
  'focus:border-indigo-400/70 focus:bg-white/85 focus:ring-4 focus:ring-indigo-500/12 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const CONTROL_DARK =
  'dark:bg-white/[0.04] dark:focus:bg-white/[0.07]';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        CONTROL_DARK,
        'h-10',
        invalid && 'border-rose-400/80 focus:border-rose-400 focus:ring-rose-500/15',
        className,
      )}
      {...rest}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL_BASE,
        CONTROL_DARK,
        'min-h-[84px] resize-y py-2 leading-relaxed',
        invalid && 'border-rose-400/80 focus:border-rose-400 focus:ring-rose-500/15',
        className,
      )}
      {...rest}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ className, invalid, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          CONTROL_BASE,
          CONTROL_DARK,
          'h-10 cursor-pointer appearance-none pr-9',
          invalid && 'border-rose-400/80 focus:border-rose-400 focus:ring-rose-500/15',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 8l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  ColorPicker                                */
/* -------------------------------------------------------------------------- */

/** 预设色板（indigo / violet 为主，兼容明暗主题） */
export const COLOR_PRESETS: string[] = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#64748b',
];

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/** 颜色选择器：预设色板 + 原生取色器 + hex 输入 */
export function ColorPicker({ value, onChange, label = '主题色' }: ColorPickerProps) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const normalized = HEX_PATTERN.test(value.trim()) ? value.trim() : '#6366f1';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted">{label}</span>
        <span className="font-mono text-[11px] uppercase text-muted">{normalized}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((color) => {
          const active = normalized.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={`选择颜色 ${color}`}
              aria-pressed={active}
              onClick={() => {
                setInvalid(false);
                onChange(color);
              }}
              style={{ backgroundColor: color }}
              className={cn(
                'h-6 w-6 rounded-lg transition-all duration-200 hover:scale-110',
                active
                  ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[color:var(--bg)]'
                  : 'ring-1 ring-black/10 dark:ring-white/10',
              )}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[color:var(--border)] shadow-inner shadow-black/5">
          <input
            type="color"
            value={normalized}
            onChange={(event) => {
              setInvalid(false);
              onChange(event.target.value);
            }}
            className="absolute -left-2 -top-2 h-14 w-14 cursor-pointer border-0 bg-transparent p-0"
            aria-label="自定义颜色"
          />
        </label>
        <Input
          value={draft}
          spellCheck={false}
          placeholder="#6366f1"
          invalid={invalid}
          onChange={(event) => {
            setDraft(event.target.value);
            const next = event.target.value.trim();
            if (HEX_PATTERN.test(next)) {
              setInvalid(false);
              onChange(next);
            } else {
              setInvalid(true);
            }
          }}
          onBlur={() => {
            if (!HEX_PATTERN.test(draft.trim())) {
              setInvalid(false);
              setDraft(value);
            }
          }}
          className="font-mono uppercase"
        />
      </div>
      {invalid ? (
        <p className="text-xs font-medium text-rose-500">请输入合法的十六进制颜色，如 #6366f1</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  IconPicker                                 */
/* -------------------------------------------------------------------------- */

/** 常用 emoji 快选 */
export const EMOJI_PRESETS: string[] = [
  '📁', '🚀', '🎨', '🛠️', '📚', '🎓', '💻', '🌐', '🔧', '⚙️',
  '🎬', '🎵', '📷', '💬', '💡', '🔥', '⭐', '🧩', '🛒', '💰',
  '📊', '📈', '🗂️', '🧠', '🔍', '📦', '☁️', '🔒', '🧪', '🗺️',
  '🎯', '🏆', '🍀', '🌱', '⏱️', '📅', '✉️', '📞', '🧭', '🪄',
];

export interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/** emoji 图标选择器：快选网格 + 自由输入 */
export function IconPicker({ value, onChange, label = '图标' }: IconPickerProps) {
  const id = useId();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const keyword = query.trim();
    if (!keyword) {
      return EMOJI_PRESETS;
    }
    return EMOJI_PRESETS.filter((emoji) => emoji.includes(keyword));
  }, [query]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-muted">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white/60 text-xl dark:bg-white/[0.04]">
          {value || '🔗'}
        </span>
        <Input
          id={id}
          value={query}
          placeholder="输入 emoji 或关键词筛选"
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            if (next.trim()) {
              onChange(next.trim());
            }
          }}
        />
      </div>

      <div className="grid max-h-32 grid-cols-10 gap-1 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-white/40 p-2 dark:bg-white/[0.03]">
        {filtered.length === 0 ? (
          <p className="col-span-10 py-3 text-center text-xs text-muted">没有匹配的 emoji</p>
        ) : (
          filtered.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`选择图标 ${emoji}`}
              onClick={() => {
                onChange(emoji);
                setQuery('');
              }}
              className={cn(
                'flex h-7 w-full items-center justify-center rounded-lg text-base transition-all duration-150 hover:scale-110 hover:bg-black/5 dark:hover:bg-white/10',
                value === emoji && 'bg-indigo-500/15 ring-1 ring-indigo-500/50',
              )}
            >
              {emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Modal                                    */
/* -------------------------------------------------------------------------- */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const MODAL_SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/** 通用弹窗（居中卡片，支持 ESC 关闭与背景滚动锁定） */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6">
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm animate-fade-up"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'surface relative z-10 my-auto w-full rounded-t-2xl shadow-2xl shadow-slate-900/20',
          'sm:rounded-2xl',
          MODAL_SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-[color:var(--fg)] dark:hover:bg-white/10"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {children ? <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div> : null}

        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 ConfirmDialog                               */
/* -------------------------------------------------------------------------- */

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 二次确认弹窗（危险操作用红色确认按钮） */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确认删除',
  cancelText = '取消',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/12 text-2xl">
          ⚠️
        </div>
        <div className="space-y-1.5 text-center text-sm leading-relaxed text-muted">
          {typeof description === 'string' ? <p>{description}</p> : description}
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Toast                                    */
/* -------------------------------------------------------------------------- */

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastApi {
  push: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_TONES: Record<ToastTone, { ring: string; icon: ReactNode }> = {
  success: {
    ring: 'ring-emerald-500/30',
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-emerald-500" fill="none" aria-hidden="true">
        <path
          d="M4.5 10.5l3.5 3.5 7.5-8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  error: {
    ring: 'ring-rose-500/30',
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-rose-500" fill="none" aria-hidden="true">
        <path
          d="M10 5.5v5.5M10 14.2v.3"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  info: {
    ring: 'ring-indigo-500/30',
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-indigo-500" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 9v5M10 6.4v.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
};

let toastSeed = 0;

/** 全局 Toast 容器，需包裹在使用 `useToast` 的子树外层 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      toastSeed += 1;
      const id = toastSeed;
      setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              'surface pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl px-4 py-3',
              'shadow-xl shadow-slate-900/10 ring-1 animate-fade-up',
              TOAST_TONES[item.tone].ring,
            )}
          >
            {TOAST_TONES[item.tone].icon}
            <p className="flex-1 text-sm leading-snug">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="关闭提示"
              className="rounded-md p-1 text-muted transition-colors hover:text-[color:var(--fg)]"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** 获取 Toast API；未包裹 ToastProvider 时返回一个降级实现 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  const fallback = useMemo<ToastApi>(
    () => ({
      push: (message: string) => {
        console.info('[toast]', message);
      },
    }),
    [],
  );
  return ctx ?? fallback;
}

/* -------------------------------------------------------------------------- */
/*                                  EmptyState                                 */
/* -------------------------------------------------------------------------- */

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** 空状态占位 */
export function EmptyState({ icon = '🗂️', title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'surface flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-2xl">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mx-auto max-w-sm text-xs text-muted">{description}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Switch                                   */
/* -------------------------------------------------------------------------- */

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

/** 开关 */
export function Switch({ checked, onChange, label, description, disabled, id }: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className="flex items-center justify-between gap-4">
      {label ? (
        <div className="min-w-0">
          <label htmlFor={switchId} className="block text-sm font-medium">
            {label}
          </label>
          {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
        </div>
      ) : null}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? '开关'}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked
            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/30'
            : 'bg-black/15 dark:bg-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 其它小部件                                  */
/* -------------------------------------------------------------------------- */

/** 标签徽章 */
export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-medium text-muted',
        'dark:bg-white/[0.08]',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 玻璃拟态卡片容器 */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('surface rounded-xl shadow-sm', className)}>{children}</section>
  );
}

/** 区块标题 */
export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
