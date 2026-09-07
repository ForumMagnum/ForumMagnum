import { forumTitleSetting } from '../../instanceSettings';
import { filterNonnull } from '../../utils/typeGuardUtils';
import { postGetPageUrl, PostsMinimumForGetPageUrl } from './helpers';

/**
 * The subset of post fields needed to build a citation. Satisfied by any post
 * fragment that includes PostsListBase (or by a DbPost with its author joined
 * in), so the same helpers can be used from the client, from page metadata,
 * and from API routes.
 */
export interface PostCitationSource extends PostsMinimumForGetPageUrl {
  title: string | null
  postedAt?: Date | string | null
  hideAuthor?: boolean | null
  user?: { displayName: string | null } | null
  coauthors?: Array<{ displayName: string | null }> | null
}

export interface PostCitation {
  title: string
  /** Display names of the author and coauthors, in order. Empty if the author is hidden. */
  authors: string[]
  /** When the post was published. Null for posts that have never been published. */
  publishedAt: Date | null
  /** Absolute URL of the post page. */
  url: string
  /** Name of the site the post was published on (e.g. "LessWrong"). */
  siteName: string
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BIBTEX_MONTH_MACROS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** YYYY-MM-DD, in UTC. */
export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getPostCitation(post: PostCitationSource): PostCitation {
  const authors = post.hideAuthor
    ? []
    : filterNonnull([
      post.user?.displayName ?? null,
      ...(post.coauthors ?? []).map(coauthor => coauthor.displayName),
    ]);
  return {
    title: post.title ?? "",
    authors,
    publishedAt: toDate(post.postedAt),
    url: postGetPageUrl(post, true),
    siteName: forumTitleSetting.get(),
  };
}

/**
 * Escape the characters that are special in BibTeX/LaTeX so that arbitrary
 * post titles and display names can be embedded in a field value.
 */
const BIBTEX_ESCAPES: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "&": "\\&",
  "%": "\\%",
  "$": "\\$",
  "#": "\\#",
  "_": "\\_",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

export function escapeBibtex(text: string): string {
  // Single pass, so that the braces in replacements like \textbackslash{} are
  // not themselves escaped.
  return text.replace(/[\\{}&%$#_~^]/g, (character) => BIBTEX_ESCAPES[character]);
}

/** Lowercase ASCII letters and digits only, for use in a BibTeX citation key. */
function toKeyFragment(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]/g, "")
    .toLowerCase();
}

const KEY_STOPWORDS = new Set(["a", "an", "the", "on", "of", "in", "to", "and", "for", "is", "are", "why", "how", "what"]);

function getFirstSignificantTitleWord(title: string): string {
  const words = title.split(/\s+/).map(toKeyFragment).filter(word => word.length > 0);
  return words.find(word => !KEY_STOPWORDS.has(word)) ?? words[0] ?? "";
}

/**
 * A citation key like `yudkowsky2007affect`: the first author's last name (or
 * the site name if the author is hidden), the year, and the first significant
 * word of the title. Falls back to the post ID if that would be empty.
 */
export function getBibtexKey(citation: PostCitation, postId: string): string {
  const firstAuthor = citation.authors[0] ?? citation.siteName;
  const authorWords = firstAuthor.split(/\s+/).map(toKeyFragment).filter(word => word.length > 0);
  const authorFragment = authorWords[authorWords.length - 1] ?? "";
  const year = citation.publishedAt ? String(citation.publishedAt.getUTCFullYear()) : "";
  const key = `${authorFragment}${year}${getFirstSignificantTitleWord(citation.title)}`;
  return key.length > 0 ? key : toKeyFragment(postId);
}

/**
 * Render a citation as a BibTeX `@misc` entry. Each author is wrapped in
 * braces so that BibTeX treats display names (which are often usernames rather
 * than "First Last" names) as a single literal name rather than trying to split
 * them into name parts.
 */
export function getPostBibtex(citation: PostCitation, postId: string, accessedAt: Date): string {
  const fields: Array<[string, string]> = [];
  if (citation.authors.length > 0) {
    fields.push(["author", citation.authors.map(author => `{${escapeBibtex(author)}}`).join(" and ")]);
  }
  fields.push(["title", `{${escapeBibtex(citation.title)}}`]);
  if (citation.publishedAt) {
    fields.push(["year", String(citation.publishedAt.getUTCFullYear())]);
    fields.push(["month", BIBTEX_MONTH_MACROS[citation.publishedAt.getUTCMonth()]]);
  }
  fields.push(["publisher", escapeBibtex(citation.siteName)]);
  fields.push(["howpublished", `\\url{${citation.url}}`]);
  fields.push(["urldate", formatIsoDate(accessedAt)]);
  fields.push(["note", `Accessed ${formatIsoDate(accessedAt)}`]);

  const renderedFields = fields.map(([name, value]) => {
    // Month macros (jan, feb, ...) are conventionally written without braces.
    const wrapped = name === "month" ? value : `{${value}}`;
    return `  ${name} = ${wrapped}`;
  });
  return `@misc{${getBibtexKey(citation, postId)},\n${renderedFields.join(",\n")}\n}\n`;
}

function formatAuthorList(authors: string[]): string {
  if (authors.length <= 1) return authors.join("");
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors.slice(0, -1).join(", ")}, & ${authors[authors.length - 1]}`;
}

/**
 * An APA-style plain-text citation, e.g.
 * `Eliezer Yudkowsky. (2007, November 27). The Affect Heuristic. LessWrong. https://www.lesswrong.com/posts/...`
 * Display names are kept as-is rather than inverted to "Last, F." because they
 * are frequently not real names.
 */
export function getPostPlainTextCitation(citation: PostCitation): string {
  const authorPart = citation.authors.length > 0
    ? formatAuthorList(citation.authors)
    : citation.siteName;
  const datePart = citation.publishedAt
    ? `${citation.publishedAt.getUTCFullYear()}, ${MONTH_NAMES[citation.publishedAt.getUTCMonth()]} ${citation.publishedAt.getUTCDate()}`
    : "n.d.";
  const publisherPart = citation.authors.length > 0 ? ` ${citation.siteName}.` : "";
  return `${authorPart}. (${datePart}). ${citation.title}.${publisherPart} ${citation.url}`;
}

/** The Internet Archive's most recent snapshot of the page (or its "save this page" prompt if there is none). */
export function getWaybackArchiveUrl(url: string): string {
  return `https://web.archive.org/web/${url}`;
}

/** Asks the Internet Archive to take a fresh snapshot of the page. */
export function getWaybackSaveUrl(url: string): string {
  return `https://web.archive.org/save/${url}`;
}

/** A Google Scholar search for the post by exact title. */
export function getGoogleScholarSearchUrl(citation: PostCitation): string {
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${citation.title}"`)}`;
}
