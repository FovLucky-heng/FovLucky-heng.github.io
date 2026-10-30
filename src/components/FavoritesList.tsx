import { clearFavorites, removeFavorite, useFavorites } from '../lib/favorites';
import type { ResearchItem } from '../lib/articles';

interface FavoritesListProps {
  articles: ResearchItem[];
}

export default function FavoritesList({ articles }: FavoritesListProps) {
  const { slugs, ready } = useFavorites();
  const saved = articles.filter((article) => slugs.includes(article.slug));

  if (!ready) {
    return (
      <div className="min-h-[22rem] animate-pulse border-y border-line py-12" aria-hidden="true">
        <div className="h-4 w-40 bg-paper-deep" />
        <div className="mt-8 h-24 w-full bg-paper-deep/60" />
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <section className="border-y border-line py-16 text-center sm:py-24" aria-labelledby="empty-title">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-line-dark text-accent-deep">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          >
            <path d="M6.5 4.25h11v16l-5.5-3.9-5.5 3.9v-16Z" />
          </svg>
        </div>
        <p className="eyebrow mt-7 justify-center">Reading list</p>
        <h2 id="empty-title" className="display-title mt-3 text-2xl sm:text-3xl">
          你的研究书架还是空的
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">
          在任意研究文章旁点击「收藏」，文章就会保存在当前浏览器中。无需登录，也不会上传任何数据。
        </p>
        <a href="/research/" className="btn btn-primary mt-8">
          浏览全部研究
          <span aria-hidden="true">↗</span>
        </a>
      </section>
    );
  }

  function handleClear() {
    if (window.confirm('确定清空全部收藏吗？此操作只影响当前浏览器。')) {
      clearFavorites();
    }
  }

  return (
    <section aria-labelledby="favorites-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="rule-label text-muted">Saved locally</p>
          <h2 id="favorites-title" className="mt-1 font-serif text-2xl text-ink">
            {saved.length} 篇研究
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-muted underline decoration-line-dark underline-offset-4 transition-colors hover:text-ink"
        >
          清空收藏
        </button>
      </div>

      <div className="border-b border-line">
        {saved.map((article, index) => (
          <article
            key={article.slug}
            className="grid gap-5 border-t border-line py-7 first:border-t-0 sm:grid-cols-[13rem_1fr_auto] sm:items-center sm:gap-7"
          >
            <a
              href={`/research/${article.slug}/`}
              className="group block overflow-hidden bg-paper-deep"
              aria-label={`阅读《${article.title}》`}
            >
              <img
                src={article.cover}
                alt=""
                width="1600"
                height="1000"
                loading={index === 0 ? 'eager' : 'lazy'}
                className="card-image aspect-[8/5] w-full object-cover"
              />
            </a>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] tracking-wider text-muted">
                <span className="text-accent-deep">{article.category}</span>
                <span aria-hidden="true">/</span>
                <time dateTime={article.date}>{article.dateShort}</time>
                <span aria-hidden="true">/</span>
                <span>{article.readingTime} 分钟</span>
              </div>
              <h3 className="headline-keep mt-2 font-serif text-xl leading-snug text-ink">
                <a
                  href={`/research/${article.slug}/`}
                  className="transition-colors hover:text-accent-deep"
                >
                  {article.title}
                </a>
              </h3>
              <p className="mt-2 line-clamp-1 text-sm text-muted">{article.description}</p>
            </div>
            <div className="flex items-center gap-5 sm:flex-col sm:items-end">
              <a
                href={`/research/${article.slug}/`}
                className="text-link whitespace-nowrap text-xs"
                aria-label={`阅读《${article.title}》`}
              >
                阅读
                <span aria-hidden="true">↗</span>
              </a>
              <button
                type="button"
                onClick={() => removeFavorite(article.slug)}
                className="whitespace-nowrap text-[0.7rem] text-muted transition-colors hover:text-[#8f3524]"
                aria-label={`从收藏中移除《${article.title}》`}
              >
                取消收藏
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col justify-between gap-4 bg-paper-deep/60 p-5 text-xs leading-6 text-muted sm:flex-row sm:items-center">
        <p>收藏仅保存在当前浏览器的 localStorage 中，不会上传，也不跨设备同步。</p>
        <a href="/research/" className="text-link shrink-0 whitespace-nowrap text-xs">
          继续浏览
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
