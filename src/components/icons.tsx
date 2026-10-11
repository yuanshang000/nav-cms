/**
 * 内联 SVG 图标库
 *
 * 说明：
 * - 不引入任何第三方图标依赖（项目约束：禁止新增 npm 依赖）；
 * - 全部使用 `stroke="currentColor"` + `fill="none"` 的线性风格，
 *   通过 `currentColor` 继承父级文字颜色，便于跟随日夜主题；
 * - 统一 24x24 viewBox，默认 24px 尺寸，可通过 className 覆盖。
 */

import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** 图标尺寸（px），默认 24 */
  size?: number | string;
  /** 无障碍标签；不传则视为装饰性图标（aria-hidden） */
  title?: string;
}

/** 通用 svg 外壳：统一 stroke / viewBox / 默认尺寸 */
function Svg({
  size = 24,
  title,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   功能图标                                   */
/* -------------------------------------------------------------------------- */

/** 放大镜（搜索） */
export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

/** 关闭 / 清除 */
export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

/** 汉堡菜单 */
export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Svg>
  );
}

/** 太阳（浅色模式） */
export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </Svg>
  );
}

/** 月亮（深色模式） */
export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
    </Svg>
  );
}

/** 向上箭头（回到顶部） */
export function ArrowUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20V5" />
      <path d="m5 12 7-7 7 7" />
    </Svg>
  );
}

/** 右上箭头（外链） */
export function ExternalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </Svg>
  );
}

/** GitHub 官方标识（品牌图形需 fill） */
export function GithubIcon(props: IconProps) {
  const { size = 24, title, className, ...rest } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58l-.01-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   语义图标                                   */
/* -------------------------------------------------------------------------- */

/** 链接（空状态 / 通用） */
export function LinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.6 13.4a4 4 0 0 0 5.66 0l2.34-2.34a4 4 0 1 0-5.66-5.66L11.6 6.7" />
      <path d="M13.4 10.6a4 4 0 0 0-5.66 0L5.4 12.94a4 4 0 1 0 5.66 5.66l1.3-1.3" />
    </Svg>
  );
}

/** 星标（收藏 / 精选） */
export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 3.6 2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.88l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85L12 3.6Z" />
    </Svg>
  );
}

/** 星光（Hero 装饰 / 智能） */
export function SparklesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 13.6 8 18 9.5 13.6 11 12 15.5 10.4 11 6 9.5 10.4 8 12 3.5Z" />
      <path d="M18.5 15.5 19.3 17.7 21.5 18.5 19.3 19.3 18.5 21.5 17.7 19.3 15.5 18.5 17.7 17.7 18.5 15.5Z" />
      <path d="M6 3 6.6 4.6 8.2 5.2 6.6 5.8 6 7.4 5.4 5.8 3.8 5.2 5.4 4.6 6 3Z" />
    </Svg>
  );
}

/** 网格（分类） */
export function GridIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </Svg>
  );
}

/** 设置（后台管理入口） */
export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </Svg>
  );
}

/** 勾选（后台入口强调） */
export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Svg>
  );
}