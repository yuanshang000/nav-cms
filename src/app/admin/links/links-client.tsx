'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';

import {
  createItemAction,
  deleteItemAction,
  reorderItemsAction,
  updateItemAction,
} from '@/lib/actions';
import type { ActionResult, NavItem } from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  IconPicker,
  Input,
  Modal,
  SectionTitle,
  Select,
  Textarea,
  ToastProvider,
  cn,
  useToast,
} from '@/components/admin/ui';

/* --------------------------------- 类型定义 -------------------------------- */

interface CategoryOption {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface FormState {
  title: string;
  description: string;
  url: string;
  icon: string;
  categoryId: string;
  /** 表单中为逗号分隔的原始字符串 */
  tags: string;
}

/** 提交给 Server Action 的载荷（tags 已解析为数组） */
interface ItemPayload {
  title: string;
  description: string;
  url: string;
  icon: string;
  categoryId: string;
  tags: string[];
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  url: '',
  icon: '🔗',
  categoryId: '',
  tags: '',
};

const URL_PATTERN = /^https?:\/\/.+/i;

function toForm(item: NavItem | null, fallbackCategoryId: string): FormState {
  if (!item) {
    return { ...EMPTY_FORM, categoryId: fallbackCategoryId };
  }
  return {
    title: item.title,
    description: item.description,
    url: item.url,
    icon: item.icon || '🔗',
    categoryId: item.categoryId,
    tags: item.tags.join(', '),
  };
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, list) => list.indexOf(tag) === index);
}

/** 从 URL 中提取域名用于 favicon 回退 */
function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** 链接图标：emoji 优先，否则使用站点 favicon */
function ItemIcon({ item }: { item: NavItem }) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const hostname = hostnameOf(item.url);

  if (item.icon) {
    return <span aria-hidden="true">{item.icon}</span>;
  }

  if (hostname && !faviconFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`}
        alt=""
        width={18}
        height={18}
        className="h-[18px] w-[18px] rounded"
        onError={() => setFaviconFailed(true)}
      />
    );
  }

  return <span aria-hidden="true">🔗</span>;
}

/* ------------------------------- 链接表单弹窗 ------------------------------- */

function ItemFormModal({
  open,
  mode,
  initial,
  categories,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial: FormState;
  categories: CategoryOption[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ItemPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<{ title?: string; url?: string; categoryId?: string }>({});

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    const nextErrors: { title?: string; url?: string; categoryId?: string } = {};
    if (!form.title.trim()) nextErrors.title = '请填写站点标题';

    const url = form.url.trim();
    if (!url) {
      nextErrors.url = '请填写站点链接';
    } else if (!URL_PATTERN.test(url)) {
      nextErrors.url = '链接必须以 http:// 或 https:// 开头';
    }

    if (!form.categoryId) nextErrors.categoryId = '请选择所属分类';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      url,
      icon: form.icon.trim(),
      categoryId: form.categoryId,
      tags: parseTags(form.tags),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? '新增链接' : '编辑链接'}
      description="链接会展示在前台导航卡片中"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={() => void submit()} loading={submitting}>
            {submitting ? '保存中…' : mode === 'create' ? '创建链接' : '保存修改'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="站点标题" htmlFor="lnk-title" required error={errors.title}>
          <Input
            id="lnk-title"
            value={form.title}
            placeholder="例如：Figma"
            invalid={Boolean(errors.title)}
            onChange={(event) => update('title', event.target.value)}
          />
        </Field>

        <Field
          label="站点链接"
          htmlFor="lnk-url"
          required
          error={errors.url}
          hint="必须以 http:// 或 https:// 开头"
        >
          <Input
            id="lnk-url"
            value={form.url}
            placeholder="https://example.com"
            inputMode="url"
            invalid={Boolean(errors.url)}
            onChange={(event) => update('url', event.target.value)}
          />
        </Field>

        <Field label="站点描述" htmlFor="lnk-desc">
          <Textarea
            id="lnk-desc"
            value={form.description}
            placeholder="一句话描述这个站点的用途"
            onChange={(event) => update('description', event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="所属分类" htmlFor="lnk-category" required error={errors.categoryId}>
            <Select
              id="lnk-category"
              value={form.categoryId}
              invalid={Boolean(errors.categoryId)}
              onChange={(event) => update('categoryId', event.target.value)}
            >
              <option value="">请选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="标签" htmlFor="lnk-tags" hint="使用英文逗号分隔">
            <Input
              id="lnk-tags"
              value={form.tags}
              placeholder="免费, 设计"
              onChange={(event) => update('tags', event.target.value)}
            />
          </Field>
        </div>

        <IconPicker value={form.icon} onChange={(value) => update('icon', value)} label="图标（留空则使用站点 favicon）" />
      </div>
    </Modal>
  );
}

/* --------------------------------- 主体 --------------------------------- */

function LinksInner({
  categories,
  initialItems,
}: {
  categories: CategoryOption[];
  initialItems: NavItem[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [items, setItems] = useState<NavItem[]>(initialItems);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<NavItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<NavItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const categoryName = useCallback(
    (categoryId: string): CategoryOption | undefined => categoryMap.get(categoryId),
    [categoryMap],
  );

  const applyResult = (result: ActionResult, fallback: string) => {
    if (!result.ok) {
      toast.push(result.message || fallback, 'error');
      return false;
    }
    if (result.data) {
      setItems([...result.data.items]);
    }
    toast.push(result.message || fallback, 'success');
    router.refresh();
    return true;
  };

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item: NavItem) => {
    setMode('edit');
    setEditing(item);
    setModalOpen(true);
  };

  const initialForm = useMemo(
    () => toForm(editing, categoryFilter !== 'all' ? categoryFilter : categories[0]?.id ?? ''),
    [editing, categoryFilter, categories],
  );

  const handleSubmit = async (payload: ItemPayload) => {
    setSubmitting(true);

    const result =
      mode === 'create'
        ? await createItemAction(payload)
        : editing
          ? await updateItemAction(editing.id, payload)
          : null;

    setSubmitting(false);

    if (!result) {
      toast.push('未找到要编辑的链接', 'error');
      return;
    }
    if (applyResult(result, mode === 'create' ? '链接已创建' : '链接已更新')) {
      setModalOpen(false);
      setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    const result = await deleteItemAction(pendingDelete.id);
    setDeleting(false);
    if (applyResult(result, '链接已删除')) {
      setPendingDelete(null);
    }
  };

  /** 上下移动：仅在同分类内调整顺序 */
  const move = async (item: NavItem, direction: -1 | 1) => {
    const siblings = items
      .filter((entry) => entry.categoryId === item.categoryId)
      .sort((a, b) => a.order - b.order);

    const index = siblings.findIndex((entry) => entry.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) {
      return;
    }

    const reordered = [...siblings];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    setMovingId(item.id);
    const result = await reorderItemsAction(reordered.map((entry) => entry.id));
    setMovingId(null);
    applyResult(result, '链接顺序已更新');
  };

  /** 按分类分组 + 关键字过滤 */
  const groups = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) {
        return false;
      }
      if (!keywordLower) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(keywordLower) ||
        item.description.toLowerCase().includes(keywordLower) ||
        item.url.toLowerCase().includes(keywordLower) ||
        item.tags.some((tag) => tag.toLowerCase().includes(keywordLower))
      );
    });

    const bucket = new Map<string, NavItem[]>();
    for (const item of filtered) {
      const list = bucket.get(item.categoryId) ?? [];
      list.push(item);
      bucket.set(item.categoryId, list);
    }

    const orderedCategories =
      categoryFilter === 'all'
        ? categories
        : categories.filter((category) => category.id === categoryFilter);

    return orderedCategories
      .map((category) => ({
        category,
        items: [...(bucket.get(category.id) ?? [])].sort((a, b) => a.order - b.order),
      }))
      .filter((group) => group.items.length > 0);
  }, [items, keyword, categoryFilter, categories]);

  const totalVisible = groups.reduce((sum, group) => sum + group.items.length, 0);
  /** 筛选后的全局序号 */
  const globalIndex = useMemo(() => {
    const map = new Map<string, number>();
    let index = 0;
    for (const group of groups) {
      for (const item of group.items) {
        index += 1;
        map.set(item.id, index);
      }
    }
    return map;
  }, [groups]);

  return (
    <div className="space-y-5">
      {/* 工具栏 */}
      <Card className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[12rem] flex-1">
            <Input
              value={keyword}
              placeholder="搜索标题、描述、链接或标签…"
              onChange={(event) => setKeyword(event.target.value)}
              aria-label="搜索链接"
            />
          </div>

          <div className="w-full sm:w-52">
            <Select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="按分类筛选"
            >
              <option value="all">全部分类（{items.length}）</option>
              {categories.map((category) => {
                const count = items.filter((item) => item.categoryId === category.id).length;
                return (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}（{count}）
                  </option>
                );
              })}
            </Select>
          </div>

          <Button onClick={openCreate} disabled={categories.length === 0}>
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            新增链接
          </Button>
        </div>

        {categories.length === 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            还没有任何分类，请先前往「分类管理」创建分类后再添加链接。
          </p>
        ) : (
          <p className="text-xs text-muted">
            共 {items.length} 条链接，当前显示 {totalVisible} 条
            {groups.length > 1 ? `，分布在 ${groups.length} 个分类中` : ''}
          </p>
        )}
      </Card>

      {groups.length === 0 ? (
        <EmptyState
          icon={keyword || categoryFilter !== 'all' ? '🔍' : '🔗'}
          title={keyword || categoryFilter !== 'all' ? '没有匹配的链接' : '还没有任何链接'}
          description={
            keyword || categoryFilter !== 'all'
              ? '试试更换关键字或切换分类筛选条件。'
              : '点击右上角「新增链接」添加第一条导航。'
          }
          action={
            keyword || categoryFilter !== 'all' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setKeyword('');
                  setCategoryFilter('all');
                }}
              >
                清除筛选
              </Button>
            ) : (
              <Button onClick={openCreate} disabled={categories.length === 0}>
                新增链接
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.category.id} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                  style={{ backgroundColor: `${group.category.color}1f` }}
                >
                  {group.category.icon || '📁'}
                </span>
                <h2 className="text-sm font-semibold">{group.category.name}</h2>
                <Badge>{group.items.length} 条</Badge>
                <span className="h-px flex-1 bg-[color:var(--border)]" />
              </div>

              <div className="space-y-2">
                {group.items.map((item, index) => {
                  const meta = categoryName(item.categoryId);
                  const isFirst = index === 0;
                  const isLast = index === group.items.length - 1;

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        'flex flex-wrap items-center gap-3 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-nowrap',
                        movingId === item.id && 'opacity-60',
                      )}
                    >
                      {/* 序号 */}
                      <span className="w-6 shrink-0 text-center text-xs font-medium text-muted">
                        {globalIndex.get(item.id) ?? index + 1}
                      </span>

                      {/* 排序按钮 */}
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => void move(item, -1)}
                          disabled={isFirst || movingId === item.id}
                          aria-label={`上移 ${item.title}`}
                          className="rounded p-0.5 text-muted transition-colors hover:text-indigo-600 disabled:opacity-25 dark:hover:text-indigo-400"
                        >
                          <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" aria-hidden="true">
                            <path d="M10 14V6M6.5 9.5L10 6l3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => void move(item, 1)}
                          disabled={isLast || movingId === item.id}
                          aria-label={`下移 ${item.title}`}
                          className="rounded p-0.5 text-muted transition-colors hover:text-indigo-600 disabled:opacity-25 dark:hover:text-indigo-400"
                        >
                          <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" aria-hidden="true">
                            <path d="M10 6v8M6.5 10.5L10 14l3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>

                      {/* 图标 */}
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-lg dark:bg-white/[0.06]">
                        <ItemIcon item={item} />
                      </span>

                      {/* 主体信息 */}
                      <div className="min-w-[12rem] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="truncate font-mono text-[11px] text-muted underline-offset-2 hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
                          >
                            {item.url}
                          </a>
                        </div>
                        {item.description ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted">{item.description}</p>
                        ) : null}
                        {item.tags.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <Badge key={tag}>#{tag}</Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {/* 分类标签 + 操作 */}
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className="hidden rounded-md px-2 py-0.5 text-[11px] font-medium sm:inline-block"
                          style={{
                            color: meta?.color ?? '#94a3b8',
                            backgroundColor: `${meta?.color ?? '#94a3b8'}1a`,
                          }}
                        >
                          {meta?.name ?? '未分类'}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingDelete(item)}>
                          <span className="text-rose-500">删除</span>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <ItemFormModal
        open={modalOpen}
        mode={mode}
        initial={initialForm}
        categories={categories}
        submitting={submitting}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`删除链接「${pendingDelete?.title ?? ''}」？`}
        description={<p>删除后无法恢复，该链接会立即从前台消失。</p>}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

export default function LinksClient(props: {
  categories: CategoryOption[];
  initialItems: NavItem[];
}) {
  return (
    <ToastProvider>
      <LinksInner {...props} />
    </ToastProvider>
  );
}
