/**
 * 站点 Logo 视觉组件（纯展示，服务端 / 客户端均可使用）
 */

export interface SiteLogoProps {
  /** 站点名称 */
  name: string;
  /** 站点副标题 */
  subtitle?: string;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示文字 */
  showText?: boolean;
  className?: string;
}

const MARK_SIZE: Record<NonNullable<SiteLogoProps['size']>, string> = {
  sm: 'h-9 w-9 text-base rounded-xl',
  md: 'h-11 w-11 text-lg rounded-2xl',
  lg: 'h-16 w-16 text-3xl rounded-3xl',
};

const TEXT_SIZE: Record<NonNullable<SiteLogoProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
};

export function SiteLogo({
  name,
  subtitle,
  size = 'md',
  showText = true,
  className,
}: SiteLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <span
        className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 font-semibold text-white shadow-lg shadow-indigo-500/30 ${MARK_SIZE[size]}`}
      >
        <span className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_60%)]" />
        <span className="relative">🚀</span>
      </span>

      {showText ? (
        <span className="min-w-0">
          <span
            className={`block truncate bg-gradient-to-r from-[color:var(--fg)] to-indigo-500 bg-clip-text font-semibold tracking-tight text-transparent dark:to-indigo-300 ${TEXT_SIZE[size]}`}
          >
            {name}
          </span>
          {subtitle ? (
            <span className="block truncate text-xs text-muted">{subtitle}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

export default SiteLogo;
