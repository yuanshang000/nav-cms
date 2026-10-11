'use client';

/**
 * 全局动态背景（极光光晕 + 网格线 + Canvas 粒子）
 *
 * 层级说明（自下而上）：
 * 1. 极光光晕：3~4 个彩色 radial-gradient 大圆，animate-aurora / animate-float-slow 缓慢漂移；
 * 2. 网格线层：.grid-bg 复用全局样式，外加 mask-image 径向渐变淡出；
 * 3. 粒子层：Canvas 绘制，深色模式为闪烁星点，浅色模式为漂浮微粒，支持鼠标视差。
 *
 * 约束：
 * - 整个组件 fixed inset-0 -z-10 pointer-events-none，不参与布局也不拦截交互；
 * - Canvas 只在 useEffect 中初始化（SSR 安全），渲染期绝不访问 window / document；
 * - 卸载时清理 rAF / 事件监听 / resize 观察；
 * - 完整支持 prefers-reduced-motion：命中时只绘制一帧静态画面。
 */

import { useEffect, useRef } from 'react';

/* -------------------------------------------------------------------------- */
/*                                   静态配置                                   */
/* -------------------------------------------------------------------------- */

interface Particle {
  /** 归一化坐标（0 ~ 1），渲染时乘以实际宽高 */
  x: number;
  y: number;
  /** 半径（px） */
  r: number;
  /** 归一化速度（每秒位移比例） */
  vx: number;
  vy: number;
  /** 基础透明度 */
  alpha: number;
  /** 闪烁相位（秒） */
  phase: number;
  /** 闪烁频率 */
  speed: number;
}

interface PointerState {
  /** 归一化鼠标位置，范围 -1 ~ 1 */
  x: number;
  y: number;
}

/** 视差跟随系数（越小越"轻"） */
const PARALLAX = 14;

/** 单个粒子的视差深度系数（星点更靠前，微粒更靠后） */
const PARALLAX_DEPTH = 0.55;

/** 判断系统是否要求减少动效 */
function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** 读取当前是否为深色模式（依赖 <html class="dark">） */
function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

/** 根据视口面积估算粒子数量（移动端自动减少） */
function resolveParticleCount(width: number, height: number): number {
  const area = width * height;
  const isMobile = width < 768;
  const base = Math.round(area / 16000);
  const scaled = isMobile ? Math.round(base * 0.4) : base;
  return Math.max(24, Math.min(140, scaled));
}

/** 生成粒子集合 */
function createParticles(count: number, dark: boolean): Particle[] {
  const list: Particle[] = [];

  for (let i = 0; i < count; i += 1) {
    const star = dark;
    list.push({
      x: Math.random(),
      y: Math.random(),
      // 深色：细小星点；浅色：稍大的柔和微粒
      r: star ? 0.5 + Math.random() * 1.1 : 1.4 + Math.random() * 3.2,
      vx: (Math.random() - 0.5) * (star ? 0.006 : 0.016),
      vy: star ? -(0.004 + Math.random() * 0.012) : -(0.008 + Math.random() * 0.022),
      alpha: star ? 0.25 + Math.random() * 0.65 : 0.1 + Math.random() * 0.28,
      phase: Math.random() * Math.PI * 2,
      speed: star ? 0.6 + Math.random() * 1.8 : 0.25 + Math.random() * 0.7,
    });
  }

  return list;
}

/**
 * 预渲染一张径向渐变精灵图。
 * 用 drawImage 代替 shadowBlur，可显著降低全屏 Canvas 的绘制开销。
 */
function createGlowSprite(color: string): HTMLCanvasElement {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;

  const ctx = sprite.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.35, color);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  return sprite;
}

/* -------------------------------------------------------------------------- */
/*                                粒子 Canvas 绘制                              */
/* -------------------------------------------------------------------------- */

function drawParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: Particle[],
  dark: boolean,
  sprite: HTMLCanvasElement,
  elapsed: number,
  pointer: PointerState
): void {
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    // 归一化坐标 -> 像素坐标，并叠加视差偏移
    const px = p.x * width + pointer.x * PARALLAX * PARALLAX_DEPTH;
    const py = p.y * height + pointer.y * PARALLAX * PARALLAX_DEPTH;

    // 呼吸 / 闪烁：星点明显，微粒更柔和
    const wave = dark ? Math.sin(elapsed * p.speed + p.phase) : Math.sin(elapsed * p.speed + p.phase) * 0.35;
    const alpha = Math.max(0.02, Math.min(1, p.alpha * (0.65 + wave * 0.35)));

    const size = p.r * (dark ? 6 : 4.4);
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
  }

  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------------------------- */
/*                                   组件本体                                   */
/* -------------------------------------------------------------------------- */

/** 极光光晕配置：位置 / 尺寸 / 颜色 / 动画 */
const AURORA_BLOBS = [
  {
    className:
      'left-[-18%] top-[-22%] h-[62vmax] w-[62vmax] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.55),transparent_62%)] opacity-60 dark:opacity-45 animate-aurora',
    style: { animationDelay: '0s' },
  },
  {
    className:
      'right-[-20%] top-[-8%] h-[54vmax] w-[54vmax] bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.42),transparent_62%)] opacity-50 dark:opacity-40 animate-float-slow',
    style: { animationDelay: '-6s' },
  },
  {
    className:
      'bottom-[-26%] left-[12%] h-[58vmax] w-[58vmax] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.40),transparent_64%)] opacity-50 dark:opacity-38 animate-float-slower',
    style: { animationDelay: '-12s' },
  },
  {
    className:
      'bottom-[-18%] right-[6%] h-[46vmax] w-[46vmax] bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.34),transparent_64%)] opacity-45 dark:opacity-32 animate-aurora',
    style: { animationDelay: '-18s' },
  },
] as const;

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const reducedMotion = prefersReducedMotion();
    const pointer: PointerState = { x: 0, y: 0 };
    const targetPointer: PointerState = { x: 0, y: 0 };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let dark = isDarkMode();
    let particles: Particle[] = [];
    let sprite = createGlowSprite('rgba(255,255,255,0.95)');
    let raf = 0;
    let disposed = false;
    let startTime = 0;

    const dprCap = 2;

    /** 尺寸同步：适配窗口变化与 DPR */
    const resize = (): void => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /** 主题变化时重建粒子与精灵图（深色星点 / 浅色微粒） */
    const syncTheme = (): void => {
      const nextDark = isDarkMode();
      if (nextDark === dark && particles.length > 0) {
        return;
      }
      dark = nextDark;
      sprite = createGlowSprite(dark ? 'rgba(255,255,255,0.95)' : 'rgba(79,70,229,0.55)');
      particles = createParticles(resolveParticleCount(width, height), dark);

      if (reducedMotion) {
        drawParticles(ctx, width, height, particles, dark, sprite, 0, pointer);
      }
    };

    const handlePointerMove = (event: PointerEvent): void => {
      targetPointer.x = (event.clientX / width) * 2 - 1;
      targetPointer.y = (event.clientY / height) * 2 - 1;
    };

    const handlePointerOut = (event: PointerEvent): void => {
      // relatedTarget 为 null 表示指针已离开视口
      if (event.relatedTarget === null) {
        targetPointer.x = 0;
        targetPointer.y = 0;
      }
    };

    const loop = (timestamp: number): void => {
      if (disposed) {
        return;
      }

      if (startTime === 0) {
        startTime = timestamp;
      }
      const elapsed = (timestamp - startTime) / 1000;

      // 指针缓动跟随，制造轻微的"跟随感"而非生硬位移
      pointer.x += (targetPointer.x - pointer.x) * 0.06;
      pointer.y += (targetPointer.y - pointer.y) * 0.06;

      for (const p of particles) {
        p.x += p.vx * (1 / 60);
        p.y += p.vy * (1 / 60);

        // 循环边界处理
        if (p.y < -0.05) {
          p.y = 1.05;
          p.x = Math.random();
        } else if (p.y > 1.05) {
          p.y = -0.05;
          p.x = Math.random();
        }
        if (p.x < -0.05) {
          p.x = 1.05;
        } else if (p.x > 1.05) {
          p.x = -0.05;
        }
      }

      drawParticles(ctx, width, height, particles, dark, sprite, elapsed, pointer);
      raf = window.requestAnimationFrame(loop);
    };

    // ---------- 初始化 ----------
    resize();
    syncTheme();

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerout', handlePointerOut, { passive: true });

    // 监听 <html> class 变化，实现主题切换时粒子形态同步
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    if (reducedMotion) {
      // 减少动效：只画一帧，不启动 rAF
      drawParticles(ctx, width, height, particles, dark, sprite, 0, pointer);
    } else {
      raf = window.requestAnimationFrame(loop);
    }

    // ---------- 清理 ----------
    return () => {
      disposed = true;
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      ctx.clearRect(0, 0, width, height);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 1. 极光光晕层 */}
      <div className="absolute inset-0 overflow-hidden">
        {AURORA_BLOBS.map((blob, index) => (
          <span
            key={index}
            className={`absolute block rounded-full blur-3xl will-change-transform ${blob.className}`}
            style={blob.style}
          />
        ))}
      </div>

      {/* 2. 网格线层（径向渐变遮罩淡出边缘） */}
      <div
        className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]"
        style={{ opacity: 0.9 }}
      />

      {/* 3. 粒子层 */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}