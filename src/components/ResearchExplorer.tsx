import Fuse from 'fuse.js';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CategoryName } from '../lib/site';
import { CATEGORIES } from '../lib/site';
import type { ResearchItem } from '../lib/articles';

const PAGE_SIZE = 6;
const TAG_PREVIEW_LIMIT = 16;

type SortKey = 'newest' | 'oldest' | 'shortest';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: '最新发布' },
  { value: 'oldest', label: '最早发布' },
  { value: 'shortest', label: '阅读时长（短→长）' },
];

interface ResearchExplorerProps {
  articles: ResearchItem[];
}

function ResearchCard({ article }: { article: ResearchItem }) {
  return (
    <article className="group flex h-full flex-col">
      <a href={`/research/${article.slug}/`} tabIndex={-1} aria-hidden="true">
        <div className="overflow-hidden border border-line bg-paper-deep">
          <img
            src={article.cover}
            alt=""
            width="1600"
            height="1000"
            loading="lazy"
            decoding="async"
            className="card-image aspect-[8/5] w-full object-cover"
          />
        </div>
      </a>
      <div className="flex flex-1 flex-col pt-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.67rem] tracking-[0.08em] text-muted">
          <span className="font-medium text-accent-deep">{article.category}</span>
          <span aria-hidden="true">/</span>
          <time dateTime={article.date}>{article.dateShort}</time>
          <span aria-hidden="true">/</span>
          <span>{article.readingTime} 分钟阅读</span>
        </div>
        <h3 className="headline-keep mt-3 font-serif text-[1.35rem] font-semibold leading-[1.45] tracking-[-0.015em] text-ink">
          <a
            href={`/research/${article.slug}/`}
            className="transition-colors duration-200 hover:text-accent-deep"
            aria-label={`阅读《${article.title}》`}
          >
            {article.title}
          </a>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted">{article.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          {article.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="border border-line px-2 py-1 text-[0.62rem] tracking-wide text-muted"
            >
              #{tag}
            </span>
          ))}
          <a
            href={`/research/${article.slug}/`}
            className="ml-auto inline-flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-wide text-ink transition-colors hover:text-accent-deep"
            aria-label={`阅读《${article.title}》`}
          >
            阅读
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ResearchExplorer({ articles }: ResearchExplorerProps) {
  const searchId = useId();
  const sortId = useId();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState<'全部' | CategoryName>('全部');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of articles) {
      for (const item of article.tags) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'),
    );
  }, [articles]);

  const fuse = useMemo(
    () =>
      new Fuse(articles, {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'description', weight: 0.28 },
          { name: 'tags', weight: 0.14 },
          { name: 'category', weight: 0.08 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
        minMatchCharLength: 1,
        includeScore: false,
      }),
    [articles],
  );

  // 从 URL 恢复筛选状态，保证分享链接可以还原同一视图。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q') ?? '';
    const urlTag = params.get('tag') ?? '';
    const urlCategory = params.get('category') ?? '';
    const urlSort = params.get('sort');
    const urlPage = Number(params.get('page') ?? '1');

    setQuery(urlQuery);
    setTag(urlTag);
    if (CATEGORIES.some((item) => item.name === urlCategory)) {
      setCategory(urlCategory as CategoryName);
    }
    if (urlSort === 'newest' || urlSort === 'oldest' || urlSort === 'shortest') {
      setSort(urlSort);
    }
    if (Number.isInteger(urlPage) && urlPage > 0) {
      setPage(urlPage);
    }
    setHydrated(true);
  }, []);

  // 只在完成 URL 初始化后回写，避免首屏把已有参数清空。
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category !== '全部') params.set('category', category);
    if (tag) params.set('tag', tag);
    if (sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [query, tag, category, sort, page, hydrated]);

  const filtered = useMemo(() => {
    const searchResults = query.trim()
      ? fuse.search(query.trim()).map((result) => result.item)
      : articles;

    const result = searchResults.filter((article) => {
      const categoryMatch = category === '全部' || article.category === category;
      const tagMatch = !tag || article.tags.includes(tag);
      return categoryMatch && tagMatch;
    });

    // 复制后再排序，避免原地修改 props 中的文章数组。
    return [...result].sort((a, b) => {
      if (sort === 'oldest') return a.date.localeCompare(b.date);
      if (sort === 'shortest') {
        return a.readingTime - b.readingTime || b.date.localeCompare(a.date);
      }
      return b.date.localeCompare(a.date);
    });
  }, [articles, category, fuse, query, sort, tag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleArticles = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(query.trim() || tag || category !== '全部');
  const availableTags = useMemo(() => {
    if (category === '全部') return tags;
    const allowed = new Set(
      articles.filter((article) => article.category === category).flatMap((article) => article.tags),
    );
    return tags.filter(([name]) => allowed.has(name));
  }, [articles, category, tags]);

  // 首次只显示高频标签，避免几十个标签把结果推到首屏以下。
  // 若当前 URL 选中的标签不在预览集合中，则强制加入，保证筛选可见。
  const visibleTags = useMemo(() => {
    if (showAllTags) return availableTags;
    const preview = availableTags.slice(0, TAG_PREVIEW_LIMIT);
    if (tag && !preview.some(([name]) => name === tag)) {
      const selected = availableTags.find(([name]) => name === tag);
      if (selected) return [...preview, selected];
    }
    return preview;
  }, [availableTags, showAllTags, tag]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function clearFilters() {
    setQuery('');
    setTag('');
    setCategory('全部');
    setShowAllTags(false);
    setPage(1);
  }

  function selectCategory(nextCategory: '全部' | CategoryName) {
    setCategory(nextCategory);
    setShowAllTags(false);
    // 切换分类时清除不属于新分类的标签，避免产生空结果。
    if (
      nextCategory !== '全部' &&
      tag &&
      !articles.some(
        (article) => article.category === nextCategory && article.tags.includes(tag),
      )
    ) {
      setTag('');
    }
    setPage(1);
  }

  function toggleTag(nextTag: string) {
    setTag((current) => (current === nextTag ? '' : nextTag));
    setPage(1);
  }

  function goToPage(nextPage: number) {
    setPage(nextPage);
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  return (
    <section aria-label="研究筛选与结果">
      <div className="border border-line bg-paper-soft">
        <div className="border-b border-line p-5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-[1fr_15rem] md:items-end">
            <div>
              <label
                htmlFor={searchId}
                className="rule-label mb-2 block text-muted"
              >
                Search / 搜索研究
              </label>
              <div className="relative">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <circle cx="10.8" cy="10.8" r="6.3" />
                  <path d="m16 16 4.3 4.3" />
                </svg>
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="搜索主题、标签或关键词，例如：黄金、再平衡、估值"
                  className="tool-input h-12 pl-11 pr-12 text-sm"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted transition-colors hover:text-ink"
                    aria-label="清除搜索关键词"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={sortId} className="rule-label mb-2 block text-muted">
                Sort / 排序
              </label>
              <select
                id={sortId}
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortKey);
                  setPage(1);
                }}
                className="tool-input select-arrow h-12 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <p className="rule-label mb-2.5 text-muted">Theme / 主题</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="按主题分类筛选">
              <button
                type="button"
                aria-pressed={category === '全部'}
                onClick={() => selectCategory('全部')}
                className={`border px-3.5 py-2 text-xs transition-colors ${
                  category === '全部'
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line-dark text-muted hover:border-ink hover:text-ink'
                }`}
              >
                全部
              </button>
              {CATEGORIES.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  aria-pressed={category === item.name}
                  onClick={() => selectCategory(item.name)}
                  className={`border px-3.5 py-2 text-xs transition-colors ${
                    category === item.name
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line-dark text-muted hover:border-ink hover:text-ink'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-center justify-between gap-4">
              <p className="rule-label text-muted">Tags / 标签</p>
              {tag && (
                <button
                  type="button"
                  onClick={() => setTag('')}
                  className="text-[0.68rem] text-accent-deep underline underline-offset-4"
                >
                  清除标签
                </button>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="按标签筛选">
              {visibleTags.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={tag === name}
                  onClick={() => toggleTag(name)}
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[0.68rem] transition-colors ${
                    tag === name
                      ? 'border-accent-deep bg-accent-soft text-accent-deep'
                      : 'border-transparent bg-paper-deep/60 text-muted hover:border-line-dark hover:text-ink'
                  }`}
                >
                  <span>#{name}</span>
                  <span className="font-mono text-[0.58rem] opacity-55">{count}</span>
                </button>
              ))}
            </div>
            {availableTags.length > TAG_PREVIEW_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllTags((current) => !current)}
                aria-expanded={showAllTags}
                className="mt-3 inline-flex items-center gap-2 text-[0.66rem] font-medium text-accent-deep transition-colors hover:text-ink"
              >
                {showAllTags ? '收起标签' : `展开全部标签（${availableTags.length}）`}
                <span
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${showAllTags ? 'rotate-180' : ''}`}
                >
                  ↓
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-muted" aria-live="polite" aria-atomic="true">
            共 <span className="font-semibold text-ink">{filtered.length}</span> 篇研究
            {tag && <span> · 标签 #{tag}</span>}
            {category !== '全部' && <span> · {category}</span>}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-[0.68rem] font-medium text-accent-deep underline decoration-accent/40 underline-offset-4 transition-colors hover:text-ink sm:self-auto"
            >
              清除全部筛选
            </button>
          )}
        </div>
      </div>

      <div ref={resultsRef} className="scroll-mt-28 pt-8" id="research-results">
        {visibleArticles.length > 0 ? (
          <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {visibleArticles.map((article) => (
              <ResearchCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-line-dark px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line-dark text-muted">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="10.8" cy="10.8" r="6.3" />
                <path d="m16 16 4.3 4.3" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mt-5 font-serif text-2xl text-ink">没有找到匹配的研究</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
              试试更短的关键词，或减少标签与主题条件。研究档案仍在持续更新。
            </p>
            <button type="button" onClick={clearFilters} className="btn btn-primary mt-7">
              清除筛选条件
            </button>
          </div>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <nav
          className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"
          aria-label="研究分页"
        >
          <p className="text-xs text-muted">
            第 <span className="font-semibold text-ink">{safePage}</span> / {totalPages} 页
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="flex h-9 w-9 items-center justify-center border border-line-dark text-sm text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="上一页"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => goToPage(pageNumber)}
                aria-current={pageNumber === safePage ? 'page' : undefined}
                aria-label={`第 ${pageNumber} 页`}
                className={`flex h-9 min-w-9 items-center justify-center border px-2 text-xs transition-colors ${
                  pageNumber === safePage
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line-dark text-muted hover:border-ink hover:text-ink'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="flex h-9 w-9 items-center justify-center border border-line-dark text-sm text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="下一页"
            >
              →
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
