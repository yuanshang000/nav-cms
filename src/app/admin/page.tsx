import type { Metadata } from 'next';
import Link from 'next/link';

import { getNavData } from '@/lib/store';

import DashboardClient from './dashboard-client';

export const metadata: Metadata = { title: '仪表盘' };

/** 相对时间格式化 */
function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

export default async function AdminDashboardPage() {
  const { settings, categories, items } = await getNavData();

  const distribution = categories.map((category) => ({
    category,
    count: items.filter((item) => item.categoryId === category.id).length,
  }));

  const maxCount = distribution.reduce((max, row) => Math.max(max, row.count), 0);

  const tagCount = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10);
  const maxTagCount = topTags.reduce((max, row) => Math.max(max, row[1]), 0);

  const recentItems = [...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8)
    .map((item) => ({
      item,
      categoryName:
        categories.find((category) => category.id === item.categoryId)?.name ?? '未分类',
      categoryColor:
        categories.find((category) => category.id === item.categoryId)?.color ?? '#94a3b8',
    }));

  const stats = [
    {
      label: '分类总数',
      value: categories.length,
      unit: '个',
      hint: '用于前台分组展示',
      icon: '🗂️',
      accent: 'from-indigo-500/20 to-indigo-500/5',
    },
    {
      label: '链接总数',
      value: items.length,
      unit: '条',
      hint: `平均每分类 ${categories.length ? Math.round(items.length / categories.length) : 0} 条`,
      icon: '🔗',
      accent: 'from-violet-500/20 to-violet-500/5',
    },
    {
      label: '标签数量',
      value: tagCount.size,
      unit: '个',
      hint: '去重后的标签数',
      icon: '🏷️',
      accent: 'from-fuchsia-500/20 to-fuchsia-500/5',
    },
    {
      label: '站点名称',
      value: settings.siteName,
      unit: '',
      hint: settings.siteSubtitle || '可在站点设置中修改',
      icon: '🌐',
      accent: 'from-sky-500/20 to-sky-500/5',
      text: true,
    },
  ];

  return (
    <DashboardClient
      stats={stats}
      distribution={distribution.map((row) => ({
        id: row.category.id,
        name: row.category.name,
        icon: row.category.icon,
        color: row.category.color,
        count: row.count,
        percent: maxCount ? Math.round((row.count / maxCount) * 100) : 0,
      }))}
      topTags={topTags.map(([tag, count]) => ({
        tag,
        count,
        percent: maxTagCount ? Math.round((count / maxTagCount) * 100) : 0,
      }))}
      recentItems={recentItems.map((row) => ({
        id: row.item.id,
        title: row.item.title,
        url: row.item.url,
        icon: row.item.icon,
        description: row.item.description,
        categoryName: row.categoryName,
        categoryColor: row.categoryColor,
        updatedAt: relativeTime(row.item.createdAt),
      }))}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
      }))}
    >
      <Link
        href="/"
        className="text-xs text-muted underline-offset-4 transition-colors hover:text-indigo-600 hover:underline dark:hover:text-indigo-300"
      >
        前往前台查看效果
      </Link>
    </DashboardClient>
  );
}
