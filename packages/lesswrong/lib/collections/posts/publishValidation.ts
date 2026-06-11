export const DEFAULT_DRAFT_TITLE = "Untitled Draft";

const EMPTY_POST_WORD_COUNT_LIMIT = 5;

interface PostPublishValidationFields {
  title?: string | null;
  draft?: boolean | null;
  isEvent?: boolean | null;
  postCategory?: string | null;
  url?: string | null;
  contents?: {
    wordCount?: number | null;
    [key: string]: unknown;
  } | null;
}

function hasRealTitle(title: string | null | undefined): boolean {
  const normalizedTitle = title?.trim().toLowerCase() ?? "";
  return normalizedTitle.length > 0 && normalizedTitle !== DEFAULT_DRAFT_TITLE.toLowerCase();
}

function isLinkpostWithUrl(post: PostPublishValidationFields): boolean {
  return post.postCategory === "linkpost" && !!post.url?.trim();
}

function hasEnoughBodyText(post: PostPublishValidationFields): boolean {
  return (post.contents?.wordCount ?? 0) > EMPTY_POST_WORD_COUNT_LIMIT;
}

export function getPostPublishValidationError(post: PostPublishValidationFields): string | null {
  if (post.draft !== false) {
    return null;
  }

  if (!hasRealTitle(post.title)) {
    return "Add a real title before publishing.";
  }

  if (!post.isEvent && !isLinkpostWithUrl(post) && !hasEnoughBodyText(post)) {
    return "Add some body text before publishing.";
  }

  return null;
}

export function assertPostCanBePublished(post: PostPublishValidationFields): void {
  const error = getPostPublishValidationError(post);
  if (error) {
    throw new Error(error);
  }
}
