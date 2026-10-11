'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  updateCategoryAction,
} from '@/lib/actions';
import type { ActionResult, Category } from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  ColorPicker,
  ConfirmDialog,
  EmptyState,
  Field,
  IconPicker,
  Input,
  Modal,
  SectionTitle,
  Textarea,
  ToastProvider,
  cn,
  useToast,
} from '@/components/admin/ui';

type CategoryRow = Category & { itemCount: number };

interface FormState {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  icon: '📁',
  color: '#6366f1',
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 名称转 slug（仅 ASCII 字母数字与连字符） */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function validate(form: FormState): { name?: string; slug?: string } {
  const errors: { name?: string; slug?: string } = {};
  if (!form.name.trim()) {
    errors.name = '请填写分类名称';
  }
  const slug = form.slug.trim();
  if (!slug) {
    errors.slug = '请填写 slug';
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.slug = 'slug 只能包含小写字母、数字与连字符';
  }
  return errors;
}

/* ------------------------------- 分类表单弹窗 ------------------------------- */

function CategoryFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial: FormState;
  onClose: () => void;
  onSubmit: (form: FormState) => Promise<void>;
  submitting: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');

  // 打开弹窗时重置表单
  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
      setSlugTouched(mode === 'edit');
    }
    // 仅在弹窗打开状态变化时重置
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const submit = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    await onSubmit({
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      icon: form.icon || '📁',
      color: form.color,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? '新增分类' : '编辑分类'}
      description="分类会作为前台导航的分组展示"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={() => void submit()} loading={submitting}>
            {submitting ? '保存中…' : mode === 'create' ? '创建分类' : '保存修改'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="分类名称" htmlFor="cat-name" required error={errors.name}>
            <Input
              id="cat-name"
              value={form.name}
              placeholder="例如：设计工具"
              invalid={Boolean(errors.name)}
              onChange={(event) => handleNameChange(event.target.value)}
            />
          </Field>

          <Field
            label="URL Slug"
            htmlFor="cat-slug"
            required
            error={errors.slug}
            hint="用于锚点与筛选，建议小写英文短横线"
          >
            <Input
              id="cat-slug"
              value={form.slug}
              placeholder="design-tools"
              className="font-mono text-xs"
              invalid={Boolean(errors.slug)}
              onChange={(event) => {
                setSlugTouched(true);
                update('slug', slugify(event.target.value));
              }}
            />
          </Field>
        </div>

        <Field label="分类描述" htmlFor="cat-desc">
          <Textarea
            id="cat-desc"
            value={form.description}
            placeholder="一句话说明这个分类收录了什么"
            onChange={(event) => update('description', event.target.value)}
          />
        </Field>

        <IconPicker value={form.icon} onChange={(value) => update('icon', value)} />

        <ColorPicker value={form.color} onChange={(value) => update('color', value)} />
      </form>
    </Modal>
  );
}

/* --------------------------------- 主体 --------------------------------- */

function CategoriesInner({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const router = useRouter();
  const toast = useToast();

  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  /** 用 action 返回的最新数据刷新本地列表 */
  const applyResult = (result: ActionResult, fallback: string) => {
    if (!result.ok) {
      toast.push(result.message || fallback, 'error');
      return false;
    }
    const data = result.data;
    if (data) {
      const counts = new Map<string, number>();
      for (const item of data.items) {
        counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
      }
      setCategories(
        data.categories.map((category) => ({
          ...category,
          itemCount: counts.get(category.id) ?? 0,
        })),
      );
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

  const openEdit = (category: CategoryRow) => {
    setMode('edit');
    setEditing(category);
    setModalOpen(true);
  };

  const initialForm: FormState = useMemo(
    () =>
      editing
        ? {
            name: editing.name,
            slug: editing.slug,
            description: editing.description,
            icon: editing.icon,
            color: editing.color,
          }
        : EMPTY_FORM,
    [editing],
  );

  const handleSubmit = async (form: FormState) => {
    setSubmitting(true);
    const result =
      mode === 'create'
        ? await createCategoryAction({
            name: form.name,
            slug: form.slug,
            description: form.description,
            icon: form.icon,
            color: form.color,
          })
        : editing
          ? await updateCategoryAction(editing.id, form)
          : null;

    setSubmitting(false);

    if (!result) {
      toast.push('未找到要编辑的分类', 'error');
      return;
    }
    if (applyResult(result, mode === 'create' ? '分类已创建' : '分类已更新')) {
      setModalOpen(false);
      setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    const result = await deleteCategoryAction(pendingDelete.id);
    setDeleting(false);

    if (applyResult(result, '分类已删除')) {
      setPendingDelete(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) {
      return;
    }
    const ids = categories.map((category) => category.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(target, 0, moved);

    // 乐观更新，避免等待网络往返
    setCategories((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });

    setMovingId(moved);
    const result = await reorderCategoriesAction(ids);
    setMovingId(null);
    applyResult(result, '分类顺序已更新');
  };

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-sm font-semibold">分类列表</h2>
          <p className="mt-1 text-xs text-muted">
            共 {categories.length} 个分类，拖不动就用箭头调整顺序
          </p>
        </div>
        <Button onClick={openCreate}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          新增分类
        </Button>
      </Card>

      {categories.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="还没有任何分类"
          description="创建第一个分类后，就可以往里面添加导航链接了。"
          action={<Button onClick={openCreate}>新增分类</Button>}
        />
      ) : (
        <>
          {/* 桌面端表格 */}
          <Card className="hidden overflow-hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-xs text-muted">
                  <th className="px-5 py-3 font-medium">排序</th>
                  <th className="px-3 py-3 font-medium">分类</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="px-3 py-3 font-medium">描述</th>
                  <th className="px-3 py-3 font-medium">链接数</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {categories.map((category, index) => (
                  <tr
                    key={category.id}
                    className={cn(
                      'transition-colors duration-200 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]',
                      movingId === category.id && 'opacity-60',
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void move(index, -1)}
                          disabled={index === 0 || movingId === category.id}
                          aria-label={`上移 ${category.name}`}
                          className="rounded-md p-1 text-muted transition-colors hover:bg-black/[0.06] hover:text-[color:var(--fg)] disabled:opacity-30 dark:hover:bg-white/10"
                        >
                          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                            <path d="M10 15V5M5.5 9.5L10 5l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => void move(index, 1)}
                          disabled={index === categories.length - 1 || movingId === category.id}
                          aria-label={`下移 ${category.name}`}
                          className="rounded-md p-1 text-muted transition-colors hover:bg-black/[0.06] hover:text-[color:var(--fg)] disabled:opacity-30 dark:hover:bg-white/10"
                        >
                          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                            <path d="M10 5v10M5.5 10.5L10 15l4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className="ml-1 w-6 text-center text-xs text-muted">{index + 1}</span>
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                          style={{ backgroundColor: `${category.color}1f` }}
                        >
                          {category.icon || '📁'}
                        </span>
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <code className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-muted dark:bg-white/[0.08]">
                        /{category.slug}
                      </code>
                    </td>

                    <td className="max-w-[16rem] px-3 py-3.5">
                      <span className="line-clamp-2 text-xs text-muted">
                        {category.description || '—'}
                      </span>
                    </td>

                    <td className="px-3 py-3.5">
                      <Badge
                        className="border-0"
                      >
                        <span
                          className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.itemCount}
                      </Badge>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingDelete(category)}>
                          <span className="text-rose-500">删除</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* 移动端卡片 */}
          <div className="space-y-3 lg:hidden">
            {categories.map((category, index) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${category.color}1f` }}
                  >
                    {category.icon || '📁'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{category.name}</p>
                      <Badge>#{index + 1}</Badge>
                    </div>
                    <code className="mt-0.5 block truncate font-mono text-[11px] text-muted">
                      /{category.slug}
                    </code>
                    {category.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{category.description}</p>
                    ) : null}
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.itemCount} 条链接
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 border-t border-[color:var(--border)] pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void move(index, -1)}
                    disabled={index === 0}
                  >
                    上移
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void move(index, 1)}
                    disabled={index === categories.length - 1}
                  >
                    下移
                  </Button>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(category)}>
                      编辑
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(category)}>
                      <span className="text-rose-500">删除</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <CategoryFormModal
        open={modalOpen}
        mode={mode}
        initial={initialForm}
        submitting={submitting}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`删除分类「${pendingDelete?.name ?? ''}」？`}
        description={
          pendingDelete && pendingDelete.itemCount > 0 ? (
            <>
              <p>
                该分类下的{' '}
                <strong className="text-rose-500">{pendingDelete.itemCount}</strong> 条链接会
                <strong className="text-rose-500">一并被删除</strong>，且无法恢复。
              </p>
              <p className="mt-1.5">建议先确认这些链接是否还需要保留。</p>
            </>
          ) : (
            <p>该分类下暂无链接，删除后无法恢复。</p>
          )
        }
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

export default function CategoriesClient(props: { initialCategories: CategoryRow[] }) {
  return (
    <ToastProvider>
      <CategoriesInner {...props} />
    </ToastProvider>
  );
}
