'use client';

import { useEffect, useState } from 'react';

/** 版本化 key，便于未来迁移结构而不误读旧数据。 */
export const FAVORITES_KEY = 'hengyuan.favorites.v1';
const FAVORITES_EVENT = 'hengyuan:favorites-change';

function safeParse(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    // 去重并过滤非字符串，防止手动改写 localStorage 导致渲染异常。
    return Array.from(
      new Set(parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)),
    );
  } catch {
    return [];
  }
}

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return safeParse(window.localStorage.getItem(FAVORITES_KEY));
  } catch {
    // Safari 隐私模式或浏览器策略可能禁用 localStorage。
    return [];
  }
}

function commit(next: string[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** 返回操作后的收藏状态，便于按钮即时反馈。 */
export function toggleFavorite(slug: string): boolean {
  const current = getFavorites();
  const exists = current.includes(slug);
  const next = exists ? current.filter((item) => item !== slug) : [slug, ...current];
  commit(next);
  return !exists;
}

export function removeFavorite(slug: string): void {
  commit(getFavorites().filter((item) => item !== slug));
}

export function clearFavorites(): void {
  commit([]);
}

/**
 * 订阅当前页与跨标签页的收藏变化。
 * ready 用于区分「尚未读取 localStorage」与「确实没有收藏」，避免空状态闪烁。
 */
export function useFavorites(): { slugs: string[]; ready: boolean } {
  const [state, setState] = useState<{ slugs: string[]; ready: boolean }>({
    slugs: [],
    ready: false,
  });

  useEffect(() => {
    const sync = () => setState({ slugs: getFavorites(), ready: true });
    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_KEY) sync();
    };

    sync();
    window.addEventListener('storage', onStorage);
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(FAVORITES_EVENT, sync);
    };
  }, []);

  return state;
}
