import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "云梯导航 · 优质资源一站直达",
    template: "%s · 云梯导航",
  },
  description:
    "一个美观、快速、可自定义的导航站点。分类整理优质网站与工具，支持后台管理、日夜主题切换。",
  keywords: ["导航", "导航站", "工具导航", "网址收藏", "CMS"],
  authors: [{ name: "Nav CMS" }],
  openGraph: {
    title: "云梯导航 · 优质资源一站直达",
    description: "分类整理优质网站与工具，支持后台管理、日夜主题切换。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070a16" },
  ],
};

// 主题需在首屏绘制前应用，避免闪白
const themeInitScript = `(function(){try{var t=localStorage.getItem('nav-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
