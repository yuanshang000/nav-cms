'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { createItemAction } from '@/lib/actions';
import type { ActionResult } from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconPicker,
  Input,
  SectionTitle,
  Select,
  Textarea,
  cn,
  useToast,
} from '@/components/admin/ui';

/* --------------------------------- 类型定义 -------------------------------- */

interface StatCard {
  label: string;
  value: string | number;
  unit: string;
  hint: string;
  icon: string;
  accent: string;
  text?: boolean;
}

interface DistributionRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
  percent: number;
}

interface TagRow {
  tag: string;
  count: number;
  percent: number;
}

interface RecentRow {
  id: string;
  title: string;
  url: string;
  icon: string;
  description: string;
  categoryName: string;
  categoryColor: string;
  updatedAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

/* ------------------------------- 快速添加表单 ------------------------------- */

const URL_PATTERN = /^https?:\/\/.+/i;

function QuickAddForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🔗');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ url?: string; title?: string }>({});

  const reset = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setIcon('🔗');
    setTags('');
    setError({});
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextError: { url?: string; title?: string } = {};

    if (!title.trim()) nextError.title = '请填写站点标题';
    if (!url.trim()) {
      nextError.url = '请填写站点链接';
    } else if (!URL_PATTERN.test(url.trim())) {
      nextError.url = '链接必须以 http:// 或 https:// 开头';
    }

    setError(nextError);
    if (Object.keys(nextError).length > 0) {
      return;
    }

    setSubmitting(true);
    const result: ActionResult = await createItemAction({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      icon: icon || '🔗',
      categoryId,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setSubmitting(false);

    if (result.ok) {
      toast.push(result.message || '链接已添加', 'success');
      reset();
      router.refresh();
    } else {
      toast.push(result.message || '添加失败，请重试', 'error');
    }
  };

  if (categories.length === 0) {
    return (
      <EmptyState
        icon="🗂️"
        title="还没有分类"
        description="请先在「分类管理」中创建至少一个分类，然后再添加链接。"
        action={
          <Link href="/admin/categories">
            <Button variant="secondary">前往分类管理</Button>
          </Link>
        }
      />
    );
  }

  return (
    <Card className="p-5">
      <SectionTitle title="快速添加" description="新增一条导航链接，稍后可继续完善描述与标签" />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="站点标题" htmlFor="qa-title" required error={error.title}>
            <Input
              id="qa-title"
              value={title}
              placeholder="例如：Vercel"
              invalid={Boolean(error.title)}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>

          <Field label="站点链接" htmlFor="qa-url" required error={error.url}>
            <Input
              id="qa-url"
              value={url}
              placeholder="https://example.com"
              inputMode="url"
              invalid={Boolean(error.url)}
              onChange={(event) => setUrl(event.target.value)}
            />
          </Field>
        </div>

        <Field label="站点描述" htmlFor="qa-desc">
          <Textarea
            id="qa-desc"
            value={description}
            placeholder="一句话描述这个站点是做什么的"
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="所属分类" htmlFor="qa-category" required>
            <Select
              id="qa-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="标签" htmlFor="qa-tags" hint="使用英文逗号分隔，例如：免费, 部署">
            <Input
              id="qa-tags"
              value={tags}
              placeholder="免费, 部署"
              onChange={(event) => setTags(event.target.value)}
            />
          </Field>
        </div>

        <IconPicker value={icon} onChange={setIcon} />

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={reset} disabled={submitting} type="button">
            清空
          </Button>
          <Button type="submit" loading={submitting}>
            {submitting ? '添加中…' : '添加链接'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* --------------------------------- 主体 --------------------------------- */

export default function DashboardClient({
  stats,
  distribution,
  topTags,
  recentItems,
  categories,
  children,
}: {
  stats: StatCard[];
  distribution: DistributionRow[];
  topTags: TagRow[];
  recentItems: RecentRow[];
  categories: CategoryOption[];
  children?: ReactNode;
}) {
  const totalLinks = useMemo(
    () => distribution.reduce((sum, row) => sum + row.count, 0),
    [distribution],
  );

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="surface group relative overflow-hidden rounded-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <div
              className={cn(
                'pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl transition-opacity duration-300 group-hover:opacity-80 max-sm:right-0',
                stat.accent,
              )}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted">{stat.label}</p>
                <p className="mt-2 flex items-baseline gap-1">
                  <span
                    className={cn(
                      'font-semibold tracking-tight',
                      stat.text ? 'truncate text-lg' : 'text-2xl',
                    )}
                  >
                    {stat.value}
                  </span>
                  {stat.unit ? <span className="text-xs text-muted">{stat.unit}</span> : null}
                </p>
                <p className="mt-1.5 truncate text-[11px] text-muted">{stat.hint}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-lg dark:bg-white/[0.06]">
                {stat.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 分布图 + 热门标签 */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <SectionTitle
            title="分类分布"
            description={`共 ${totalLinks} 条链接，按分类统计`}
            action={
              <Link
                href="/admin/categories"
                className="text-xs text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
              >
                管理分类 →
              </Link>
            }
          />

          {distribution.length === 0 ? (
            <EmptyState icon="📊" title="暂无分类数据" description="创建分类后即可查看分布情况。" />
          ) : (
            <ul className="space-y-3.5">
              {distribution.map((row) => (
                <li key={row.id} className="group">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span aria-hidden="true">{row.icon}</span>
                      <span className="truncate font-medium">{row.name}</span>
                    </span>
                    <span className="shrink-0 text-muted">
                      {row.count} 条 · {row.percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                      style={{
                        width: `${Math.max(row.percent, row.count > 0 ? 6 : 0)}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="热门标签" description="出现次数最多的前 10 个标签" />

          {topTags.length === 0 ? (
            <EmptyState icon="🏷️" title="暂无标签" description="给链接添加标签后会在这里统计。" />
          ) : (
            <ul className="space-y-2.5">
              {topTags.map((row, index) => (
                <li key={row.tag} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold',
                      index < 3
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                        : 'bg-black/[0.05] text-muted dark:bg-white/[0.08]',
                    )}
                  >
                    {index + 1}
                  </span>
                  <Badge className="shrink-0">{row.tag}</Badge>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${Math.max(row.percent, 8)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[11px] text-muted">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* 最近更新 + 快速添加 */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle
            title="最近更新"
            description="最新创建的链接"
            action={
              <Link
                href="/admin/links"
                className="text-xs text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
              >
                全部链接 →
              </Link>
            }
          />

          {recentItems.length === 0 ? (
            <EmptyState icon="🔗" title="暂无链接" description="使用右侧表单快速添加第一条链接。" />
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {recentItems.map((row) => (
                <li key={row.id}>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-3 py-3 transition-transform duration-200 hover:translate-x-0.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-base dark:bg-white/[0.06]">
                      {row.icon || '🔗'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{row.title}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {row.description || row.url}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          color: row.categoryColor,
                          backgroundColor: `${row.categoryColor}1a`,
                        }}
                      >
                        {row.categoryName}
                      </span>
                      <span className="text-[10px] text-muted">{row.updatedAt}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-[color:var(--border)] pt-4">{children}</div>
        </Card>

        <div className="lg:col-span-3">
          <QuickAddForm categories={categories} />
        </div>
      </div>
    </div>
  );
}
