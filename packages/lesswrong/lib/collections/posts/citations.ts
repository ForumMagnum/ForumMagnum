import moment from '../../moment-timezone';
import { forumTitleSetting } from '../../instanceSettings';
import { filterNonnull } from '../../utils/typeGuardUtils';
import { postGetPageUrl, PostsMinimumForGetPageUrl } from './helpers';

interface PostCitationAuthor {
  displayName: string | null
  deleted?: boolean | null
}

/**
 * The subset of post fields needed to build a citation. Satisfied by any post
 * fragment that includes PostsListBase, so the same helpers can be used from
 * the client, from page metadata, and from API routes.
 */
export interface PostCitationSource extends PostsMinimumForGetPageUrl {
  title: string | null
  postedAt?: Date | string | null
  hideAuthor?: boolean | null
  user?: PostCitationAuthor | null
  coauthors?: PostCitationAuthor[] | null
}

export interface PostCitation {
  title: string
  /**
   * Display names of the credited authors, in order, matching the byline shown
   * on the post page: the primary author is omitted if the post hides its
   * author, and deleted accounts are omitted.
   */
  authors: string[]
  /** When the post was published. Null for posts that have never been published. */
  publishedAt: Date | null
  /** Absolute URL of the post page. */
  url: string
  /** Name of the site the post was published on (e.g. "LessWrong"). */
  siteName: string
  /**
   * Timezone used to render dates, so that the citation names the same day as
   * the date shown on the page. Defaults to the site default timezone when
   * there is no reader (e.g. in page metadata or API responses).
   */
  timezone: string
}

/**
 * Timezone for citations rendered without a reader (page metadata, the .bib
 * endpoint). Matches DEFAULT_TIMEZONE in lib/utils/timeUtil, which can't be
 * imported here because that module is client-only.
 */
export const DEFAULT_CITATION_TIMEZONE = "GMT";

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

interface DateParts {
  year: number
  /** 0-based, like Date.getMonth() */
  monthIndex: number
  day: number
}

function getDateParts(date: Date, timezone: string): DateParts {
  const localized = moment(date).tz(timezone);
  return {
    year: localized.year(),
    monthIndex: localized.month(),
    day: localized.date(),
  };
}

/** YYYY-MM-DD in the given timezone. */
export function formatIsoDate(date: Date, timezone: string): string {
  return moment(date).tz(timezone).format("YYYY-MM-DD");
}

function getAuthorDisplayName(author: PostCitationAuthor | null | undefined): string | null {
  if (!author || author.deleted) return null;
  return author.displayName;
}

export function getPostCitation(post: PostCitationSource, timezone: string = DEFAULT_CITATION_TIMEZONE): PostCitation {
  const creditedAuthors: Array<PostCitationAuthor | null | undefined> = [
    ...(post.hideAuthor ? [] : [post.user]),
    ...(post.coauthors ?? []),
  ];
  return {
    title: post.title ?? "",
    authors: filterNonnull(creditedAuthors.map(getAuthorDisplayName)),
    publishedAt: toDate(post.postedAt),
    url: postGetPageUrl(post, true),
    siteName: forumTitleSetting.get(),
    timezone,
  };
}

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

/**
 * Escape the characters that are special in BibTeX/LaTeX so that arbitrary
 * post titles and display names can be embedded in a field value.
 */
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
 * the site name if there is no credited author), the year, and the first
 * significant word of the title. Falls back to the post ID if that would be
 * empty.
 */
export function getBibtexKey(citation: PostCitation, postId: string): string {
  const firstAuthor = citation.authors[0] ?? citation.siteName;
  const authorWords = firstAuthor.split(/\s+/).map(toKeyFragment).filter(word => word.length > 0);
  const authorFragment = authorWords[authorWords.length - 1] ?? "";
  const year = citation.publishedAt ? String(getDateParts(citation.publishedAt, citation.timezone).year) : "";
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
    const { year, monthIndex } = getDateParts(citation.publishedAt, citation.timezone);
    fields.push(["year", String(year)]);
    fields.push(["month", BIBTEX_MONTH_MACROS[monthIndex]]);
  }
  const accessedDate = formatIsoDate(accessedAt, citation.timezone);
  fields.push(["publisher", escapeBibtex(citation.siteName)]);
  fields.push(["howpublished", `\\url{${citation.url}}`]);
  fields.push(["urldate", accessedDate]);
  fields.push(["note", `Accessed ${accessedDate}`]);

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
  let datePart = "n.d.";
  if (citation.publishedAt) {
    const { year, monthIndex, day } = getDateParts(citation.publishedAt, citation.timezone);
    datePart = `${year}, ${MONTH_NAMES[monthIndex]} ${day}`;
  }
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
  // Double quotes inside the title would terminate the phrase search early
  const phrase = citation.title.replace(/"/g, "");
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${phrase}"`)}`;
}
