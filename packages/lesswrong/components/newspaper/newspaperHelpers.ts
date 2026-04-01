import { use, useEffect, useRef } from 'react';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { HideNavigationSidebarContext } from '@/components/layout/HideNavigationSidebarContextProvider';
import { NEWSPAPER_BODY_CLASS } from './newspaperStyles';

export function formatNewspaperDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function getVolumeAndIssue(date: Date): string {
  const yearsSinceFounding = date.getFullYear() - 2009;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return `Vol. ${toRoman(yearsSinceFounding)}, No. ${dayOfYear}`;
}

function toRoman(num: number): string {
  const romanNumeralPairs = [
    { value: 1000, symbol: 'M' },
    { value: 900, symbol: 'CM' },
    { value: 500, symbol: 'D' },
    { value: 400, symbol: 'CD' },
    { value: 100, symbol: 'C' },
    { value: 90, symbol: 'XC' },
    { value: 50, symbol: 'L' },
    { value: 40, symbol: 'XL' },
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },
    { value: 1, symbol: 'I' },
  ];
  let result = '';
  for (const romanNumeralPair of romanNumeralPairs) {
    while (num >= romanNumeralPair.value) {
      result += romanNumeralPair.symbol;
      num -= romanNumeralPair.value;
    }
  }
  return result;
}

function shouldSkipFirstParagraph(innerHtml: string): boolean {
  const textContent = innerHtml.replace(/<[^>]*>/g, '').trim();
  if (textContent.toLowerCase().startsWith('epistemic status')) return true;
  if (/^<(em|i)\b[^>]*>[\s\S]*<\/\1>$/i.test(innerHtml.trim())) return true;
  if (textContent.length > 0 && textContent.length < 25) return true;
  return false;
}

export function getPostExcerptHtml(post: PostsListWithVotes): string {
  const html = post.customHighlight?.html ?? post.contents?.htmlHighlight ?? '';
  const firstParagraphMatch = html.match(/^(\s*<p[^>]*>)([\s\S]*?)(<\/p>)/i);
  if (firstParagraphMatch && shouldSkipFirstParagraph(firstParagraphMatch[2])) {
    return html.slice(firstParagraphMatch[0].length).trim();
  }
  return html;
}

export function formatAuthor(post: PostsListWithVotes): string {
  if (post.hideAuthor) return 'Anonymous';
  return post.user?.displayName ?? 'Unknown';
}

export function formatScore(score: number): string {
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return String(score);
}

export function getCoreTags(post: PostsListWithVotes): { name: string; slug: string }[] {
  return (post.tags ?? []).filter(t => t.core).map(t => ({ name: t.name, slug: t.slug }));
}

export interface CoreTagGroup {
  tagId: string;
  tagName: string;
  tagSlug: string;
  heroPost: PostsListWithVotes;
  otherPosts: PostsListWithVotes[];
}

const MIN_POSTS_PER_TAG = 5;

export function groupPostsByCoreTag(posts: PostsListWithVotes[]): { tagGroups: CoreTagGroup[], ungroupedPosts: PostsListWithVotes[] } {
  const coreTagPostMap = new Map<string, { tag: { _id: string; name: string; slug: string }; posts: PostsListWithVotes[] }>();
  for (const post of posts) {
    const coreTags = post.tags.filter(t => t.core);
    for (const tag of coreTags) {
      if (!coreTagPostMap.has(tag._id)) {
        coreTagPostMap.set(tag._id, { tag: { _id: tag._id, name: tag.name, slug: tag.slug }, posts: [] });
      }
      coreTagPostMap.get(tag._id)!.posts.push(post);
    }
  }
  const qualifyingTagIds = new Set<string>();
  for (const [tagId, entry] of coreTagPostMap) {
    if (entry.posts.length >= MIN_POSTS_PER_TAG) {
      qualifyingTagIds.add(tagId);
    }
  }
  const assignedPostIds = new Set<string>();
  const tagGroups: CoreTagGroup[] = [];
  const qualifyingEntries = [...coreTagPostMap.entries()]
    .filter(([id]) => qualifyingTagIds.has(id))
    .sort((a, b) => b[1].posts.length - a[1].posts.length);
  for (const [, entry] of qualifyingEntries) {
    const availablePosts = entry.posts.filter(p => !assignedPostIds.has(p._id));
    if (availablePosts.length < MIN_POSTS_PER_TAG) continue;
    const sortedByKarma = [...availablePosts].sort((a, b) => (b.baseScore ?? 0) - (a.baseScore ?? 0));
    const heroPost = sortedByKarma[0];
    const otherPosts = sortedByKarma.slice(1);
    for (const p of sortedByKarma) assignedPostIds.add(p._id);
    tagGroups.push({
      tagId: entry.tag._id,
      tagName: entry.tag.name,
      tagSlug: entry.tag.slug,
      heroPost,
      otherPosts,
    });
  }
  const ungroupedPosts = posts.filter(p => !assignedPostIds.has(p._id));
  return { tagGroups, ungroupedPosts };
}

export function useNewspaperFullWidthMode() {
  const context = use(HideNavigationSidebarContext);
  const previousValueRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (context) {
      previousValueRef.current = context.hideNavigationSidebar;
      context.setHideNavigationSidebar(true);
    }
    document.body.classList.add(NEWSPAPER_BODY_CLASS);
    return () => {
      if (context && previousValueRef.current !== null) {
        context.setHideNavigationSidebar(previousValueRef.current);
      }
      document.body.classList.remove(NEWSPAPER_BODY_CLASS);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
