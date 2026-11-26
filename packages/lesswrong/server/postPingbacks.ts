import type { CheerioAPI } from 'cheerio';
import type { DataNode, Element, Node } from 'cheerio/node_modules/domhandler';
import keyBy from 'lodash/keyBy';
import uniq from 'lodash/uniq';
import type { ForumTypeString } from '@/lib/instanceSettings';
import { pingbackExcerptLinkClass } from '@/lib/pingback';
import { userCanDo } from '@/lib/vulcan-users/permissions';
import { getLatestContentsRevision } from '@/server/collections/revisions/helpers';
import { resolvePingbackLinks } from './pingbacks';
import { cheerioParse } from './utils/htmlUtil';
import { performVoteServer } from './voteServer';

const EXCERPT_BLOCK_SELECTOR = "p, li, blockquote, h1, h2, h3, h4, h5, h6, td, th, dt, dd, figcaption, pre";
// Characters of context kept on each side of the link.
const EXCERPT_CONTEXT_CHARS = 300;
const MATH_SELECTOR = "math, mjx-container, .mjpage, .math-tex";
// Elements that are kept or dropped whole, rather than cut partway through.
const ATOMIC_ELEMENT_SELECTOR = `img, svg, iframe, video, audio, ${MATH_SELECTOR}`;
const ATOMIC_ELEMENT_LENGTH = 20;
// The permission performVoteServer checks for the initial vote
const INITIAL_VOTE_PERMISSION = "pingbacks.bigUpvote";

interface ExcerptContentUnit {
  node: Node,
  length: number,
}

/**
 * Brings the post's outgoing pingbacks in line with the post links in its
 * current contents: creates pingbacks for new links, updates excerpts, and
 * marks pingbacks whose links were removed as deleted. New pingbacks still
 * need their initial votes (castInitialPingbackVotes).
 */
export async function syncPostPingbacks(post: DbPost, context: ResolverContext): Promise<void> {
  const { Pingbacks, Posts } = context;
  const html = await getPostContentsHtml(post, context);
  const linkExcerptsByPostId = await htmlToPostLinkExcerpts(html, post._id, context.forumType);
  // Links to posts by ID resolve without checking that the post exists
  const linkedPosts = await Posts.find({ _id: { $in: [...linkExcerptsByPostId.keys()] } }, {}, { _id: 1 }).fetch();
  const linkedPostIds = new Set(linkedPosts.map(linkedPost => linkedPost._id));
  const excerptsByTargetPostId = new Map([...linkExcerptsByPostId].filter(([postId]) => linkedPostIds.has(postId)));
  const existingPingbacks = await Pingbacks.find({ sourcePostId: post._id }).fetch();
  const existingPingbacksByTargetPostId = keyBy(existingPingbacks, pingback => pingback.targetPostId);

  const removedPingbackIds = existingPingbacks
    .filter(pingback => !pingback.deleted && !excerptsByTargetPostId.has(pingback.targetPostId))
    .map(pingback => pingback._id);
  if (removedPingbackIds.length) {
    await Pingbacks.rawUpdateMany({ _id: { $in: removedPingbackIds } }, { $set: { deleted: true } });
  }

  const linkedTargets = [...excerptsByTargetPostId.entries()];
  const changedPingbacks = linkedTargets.flatMap(([targetPostId, excerpt]) => {
    const existingPingback = existingPingbacksByTargetPostId[targetPostId];
    const changed = existingPingback && (existingPingback.deleted || existingPingback.excerpt !== excerpt);
    return changed ? [{ _id: existingPingback._id, excerpt }] : [];
  });
  await Promise.all(changedPingbacks.map(({ _id, excerpt }) =>
    Pingbacks.rawUpdateOne({ _id }, { $set: { deleted: false, excerpt } })
  ));

  const newPingbacks: InsertionRecord<DbPingback>[] = linkedTargets
    .filter(([targetPostId]) => !existingPingbacksByTargetPostId[targetPostId])
    .map(([targetPostId, excerpt]) => ({
      sourcePostId: post._id,
      targetPostId,
      userId: post.userId,
      excerpt,
      deleted: false,
      voteCount: 0,
      baseScore: 0,
      score: 0,
      extendedScore: null,
      afBaseScore: 0,
      afExtendedScore: null,
      afVoteCount: 0,
    }));
  await context.repos.pingbacks.insertNewPingbacks(newPingbacks);
}

/**
 * Casts the author's strong upvote, which is a pingback's starting score, on
 * each of the post's pingbacks that its author has never voted on. Pingbacks
 * whose authors can't vote (eg, banned users) start at zero.
 */
export async function castInitialPingbackVotes(sourcePostId: string, context: ResolverContext): Promise<void> {
  const { Pingbacks, Votes } = context;
  const pingbacks = await Pingbacks.find({ sourcePostId, deleted: false }).fetch();
  if (!pingbacks.length) return;
  const authorVotes = await Votes.find(
    { documentId: { $in: pingbacks.map(pingback => pingback._id) }, userId: { $in: uniq(pingbacks.map(pingback => pingback.userId)) } },
    {},
    { documentId: 1, userId: 1 },
  ).fetch();
  const unvotedPingbacks = pingbacks.filter(pingback =>
    !authorVotes.some(vote => vote.documentId === pingback._id && vote.userId === pingback.userId)
  );
  for (const pingback of unvotedPingbacks) {
    const author = await context.loaders.Users.load(pingback.userId);
    if (!author) {
      throw new Error(`Could not find author ${pingback.userId} of pingback ${pingback._id}`);
    }
    if (!userCanDo(author, INITIAL_VOTE_PERMISSION)) {
      continue;
    }
    await performVoteServer({
      document: pingback,
      voteType: "bigUpvote",
      collection: context.Pingbacks,
      user: author,
      skipRateLimits: true,
      selfVote: true,
      context,
    });
  }
}

async function getPostContentsHtml(post: DbPost, context: ResolverContext): Promise<string> {
  const revision = await getLatestContentsRevision(post, context);
  if (post.contents_latest && !revision) {
    throw new Error(`Post ${post._id} has no revision ${post.contents_latest}`);
  }
  return revision?.html ?? "";
}

/**
 * For each post linked from the given HTML, an excerpt around the first link
 * to it.
 */
async function htmlToPostLinkExcerpts(html: string, sourcePostId: string, forumType: ForumTypeString): Promise<Map<string, string>> {
  const $ = cheerioParse(html);
  const links = await resolvePingbackLinks($, [{ collectionName: "Posts", documentId: sourcePostId }], forumType);
  const excerptsByTargetPostId = new Map<string, string>();
  for (const { pingback, anchor } of links) {
    if (pingback.collectionName === "Posts" && !excerptsByTargetPostId.has(pingback.documentId)) {
      excerptsByTargetPostId.set(pingback.documentId, getLinkExcerpt($, anchor));
    }
  }
  return excerptsByTargetPostId;
}

/**
 * The paragraph (or other block) containing the link, as a paragraph, trimmed
 * to at most EXCERPT_CONTEXT_CHARS on each side of the link, with the link
 * marked by `pingbackExcerptLinkClass`.
 */
function getLinkExcerpt($: CheerioAPI, anchor: Element): string {
  const block = $(anchor).closest(EXCERPT_BLOCK_SELECTOR);
  const container = block.length ? block : $(anchor);
  const anchorIndex = container.find("a").addBack("a").index(anchor);
  const excerpt = container.clone();
  const excerptRoot = excerpt.get(0);
  const excerptAnchor = excerpt.find("a").addBack("a").get(anchorIndex);
  if (!excerptRoot || !isElementNode(excerptRoot) || !excerptAnchor) {
    throw new Error("Failed to copy a link and its block for an excerpt");
  }
  $(excerptAnchor).addClass(pingbackExcerptLinkClass);

  const units = getExcerptContentUnits($, excerptRoot, excerptAnchor);
  const anchorPosition = units.findIndex(unit => unit.node === excerptAnchor);
  trimExcerptContentUnits($, units.slice(0, anchorPosition).reverse(), "start");
  trimExcerptContentUnits($, units.slice(anchorPosition + 1), "end");
  // Math styles are large, and only needed by the math they're bundled with
  if (!excerpt.find(MATH_SELECTOR).length) {
    excerpt.find("style").remove();
  }

  if (!block.length) {
    return `<p>${$.html(excerpt)}</p>`;
  }
  if (excerptRoot.name !== "blockquote") {
    excerptRoot.name = "p";
  }
  excerptRoot.attribs = {};
  return $.html(excerpt);
}

/**
 * The text and atomic elements under `node`, in document order. The link is
 * included as a single zero-length unit.
 */
function getExcerptContentUnits($: CheerioAPI, node: Node, anchor: Node): ExcerptContentUnit[] {
  if (node === anchor) {
    return [{ node, length: 0 }];
  }
  if (isTextNode(node)) {
    return [{ node, length: node.data.length }];
  }
  if (!isElementNode(node)) {
    return [];
  }
  if ($(node).is(ATOMIC_ELEMENT_SELECTOR)) {
    return [{ node, length: ATOMIC_ELEMENT_LENGTH }];
  }
  return node.children.flatMap(child => getExcerptContentUnits($, child, anchor));
}

/**
 * Removes the content beyond EXCERPT_CONTEXT_CHARS from `units`, which are
 * ordered outward from the link, replacing it with an ellipsis.
 */
function trimExcerptContentUnits($: CheerioAPI, units: ExcerptContentUnit[], side: "start"|"end") {
  let remainingChars = EXCERPT_CONTEXT_CHARS;
  for (const [index, unit] of units.entries()) {
    if (unit.length <= remainingChars) {
      remainingChars -= unit.length;
      continue;
    }
    if (isTextNode(unit.node)) {
      unit.node.data = truncateTextAtWordBoundary(unit.node.data, remainingChars, side);
    } else {
      $(unit.node).replaceWith("…");
    }
    for (const outerUnit of units.slice(index + 1)) {
      removeWithEmptiedAncestors($, outerUnit.node);
    }
    return;
  }
}

function removeWithEmptiedAncestors($: CheerioAPI, node: Node) {
  const parent = node.parent;
  $(node).remove();
  if (parent && isElementNode(parent) && parent.children.length === 0) {
    removeWithEmptiedAncestors($, parent);
  }
}

function truncateTextAtWordBoundary(text: string, maxChars: number, side: "start"|"end"): string {
  if (side === "start") {
    const kept = text.slice(text.length - maxChars);
    const firstSpace = kept.search(/\s/);
    return firstSpace >= 0 ? `…${kept.slice(firstSpace + 1)}` : "…";
  } else {
    const kept = text.slice(0, maxChars);
    const lastSpace = kept.search(/\s\S*$/);
    return lastSpace >= 0 ? `${kept.slice(0, lastSpace)}…` : "…";
  }
}

function isTextNode(node: Node): node is DataNode {
  return node.type === "text";
}

function isElementNode(node: Node): node is Element {
  return node.type === "tag";
}
