// Pure functions describing the chapter/post structure of a sequence being
// edited. The editor applies these to its local state optimistically, then
// saves the matching change to the server.

import { htmlToTextDefault } from "@/lib/htmlToText";

/** A chapter description, in the form the editor loads and saves. */
export interface ChapterDescription {
  originalContents: { type: string; data: string };
}

export interface EditableChapter {
  _id: string;
  title: string | null;
  description: ChapterDescription | null;
  postIds: string[];
}

/**
 * Tags that only hold or format text, so they show nothing when there's no
 * text in them. Any other element (an image, an embed's iframe, a diagram, a
 * table) is something to show.
 */
const TEXT_ONLY_TAGS = new Set([
  "p", "br", "span", "div", "a", "b", "strong", "i", "em", "u", "s", "code", "sub", "sup",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "li",
]);

/**
 * Whether a tag has nothing to show without text: a text-only tag that isn't
 * a Lexical node's export (some, like polls, are a span or div whose
 * `data-lexical-` attributes hold the content).
 */
function isEmptyWithoutText(tag: string): boolean {
  const tagName = /^<([a-z][a-z0-9]*)/i.exec(tag)?.[1].toLowerCase();
  return !!tagName && TEXT_ONLY_TAGS.has(tagName) && !/\sdata-lexical-/i.test(tag);
}

/** Whether a description's HTML has nothing to show: no text, and no images, embeds or other content. */
export function isBlankDescriptionHtml(html: string): boolean {
  if (htmlToTextDefault(html).trim()) {
    return false;
  }
  const openingTags = html.match(/<[a-z][^>]*>/gi) ?? [];
  return openingTags.every(isEmptyWithoutText);
}

function hasTitle(chapter: EditableChapter): boolean {
  return !!chapter.title?.trim();
}

/**
 * A sequence is shown as having no chapters (a single flat list of posts) when
 * its only chapter has neither a title nor a description.
 */
export function isChapterless(chapters: EditableChapter[]): boolean {
  return chapters.length === 1 && !hasTitle(chapters[0]) && !chapters[0].description;
}

function updateChapter(
  chapters: EditableChapter[],
  chapterId: string,
  update: (chapter: EditableChapter) => EditableChapter,
): EditableChapter[] {
  return chapters.map((chapter) => chapter._id === chapterId ? update(chapter) : chapter);
}

export function addPost(chapters: EditableChapter[], chapterId: string, postId: string): EditableChapter[] {
  return updateChapter(chapters, chapterId, (chapter) => ({ ...chapter, postIds: [...chapter.postIds, postId] }));
}

export function removePost(chapters: EditableChapter[], chapterId: string, postId: string): EditableChapter[] {
  return updateChapter(chapters, chapterId, (chapter) => ({
    ...chapter,
    postIds: chapter.postIds.filter((id) => id !== postId),
  }));
}

function insertAt<T>(items: T[], index: number, item: T): T[] {
  const clampedIndex = Math.max(0, Math.min(index, items.length));
  return [...items.slice(0, clampedIndex), item, ...items.slice(clampedIndex)];
}

export function movePost(
  chapters: EditableChapter[],
  postId: string,
  fromChapterId: string,
  toChapterId: string,
  toIndex: number,
): EditableChapter[] {
  const withoutPost = removePost(chapters, fromChapterId, postId);
  return updateChapter(withoutPost, toChapterId, (chapter) => ({
    ...chapter,
    postIds: insertAt(chapter.postIds, toIndex, postId),
  }));
}

/**
 * With several chapters, only an empty one can be deleted. The last remaining
 * chapter can always be "deleted": that turns the sequence back into a flat
 * list and keeps its posts.
 */
export function canDeleteChapter(chapters: EditableChapter[], chapterId: string): boolean {
  if (chapters.length === 1) {
    return chapters[0]._id === chapterId;
  }
  const chapter = chapters.find((c) => c._id === chapterId);
  return !!chapter && chapter.postIds.length === 0;
}

export function moveChapter(chapters: EditableChapter[], chapterId: string, direction: "up" | "down"): EditableChapter[] {
  const index = chapters.findIndex((chapter) => chapter._id === chapterId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= chapters.length) {
    return chapters;
  }
  const reordered = [...chapters];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  return reordered;
}

export function findPostChapter(chapters: EditableChapter[], postId: string): EditableChapter | undefined {
  return chapters.find((chapter) => chapter.postIds.includes(postId));
}
