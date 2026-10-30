import { useState } from 'react';
import { toggleFavorite, useFavorites } from '../lib/favorites';

interface FavoriteButtonProps {
  slug: string;
  title: string;
  tone?: 'default' | 'light';
  className?: string;
}

export default function FavoriteButton({
  slug,
  title,
  tone = 'default',
  className = '',
}: FavoriteButtonProps) {
  const { slugs, ready } = useFavorites();
  const active = ready && slugs.includes(slug);
  const [announcement, setAnnouncement] = useState('');

  function handleToggle() {
    const nextActive = toggleFavorite(slug);
    setAnnouncement(nextActive ? `已收藏《${title}》` : `已取消收藏《${title}》`);
  }

  const toneClass =
    tone === 'light'
      ? active
        ? 'border-paper bg-paper text-ink'
        : 'border-paper/35 bg-ink/20 text-paper hover:border-paper/80 hover:bg-white/10'
      : active
        ? 'border-ink bg-ink text-paper-soft'
        : 'border-line-dark bg-transparent text-ink hover:border-ink hover:bg-white/40';

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={active}
        aria-label={active ? `取消收藏《${title}》` : `收藏《${title}》`}
        className={`inline-flex min-h-10 items-center justify-center gap-2 border px-4 py-2 text-xs font-semibold tracking-wide transition-colors ${toneClass} ${className}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <path d="M6.5 4.25h11v16l-5.5-3.9-5.5 3.9v-16Z" />
        </svg>
        <span>{active ? '已收藏' : '收藏'}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
