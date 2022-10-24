import cheerio from 'cheerio';
import { cheerioParse, tokenizeHtml } from './utils/htmlUtil';
import { Comments } from '../lib/collections/comments/collection';
import groupBy from 'lodash/groupBy';

export interface QuoteShardSettings {
  minLength: number
}
const defaultQuoteShardSettings: QuoteShardSettings = {
  minLength: 20,
};

const matchableBlockElementSelector = 'p,li,blockquote';


/**
 * Given HTML (probably for a post), make it so every top-level block element
 * (ie, paragraphs, list items, tables, images) has an ID, adding new numeric
 * IDs of the form "block123" if necessary.
 *
 * This is deterministic for a given HTML input, but is not guaranteed to be
 * stable if the post is edited (ie, inserting a paragraph will increment the IDs
 * of subsequent paragraphs). These IDs shouldn't be used for permalinks; for
 * that, instead use the IDs attached to section-heading blocks by the table of
 * contents generation code.
 *
 * These are used for side-comment alignment; that is, if a comment contains a
 * blockquote that matches something in the post, this ID is used for tracking
 * that match and potentially displaying a comment marker in
 * the right margin.
 */
export function addBlockIDsToHTML(html: string): string {
  const parsedPost = cheerioParse(html);
  let markedElements = parsedPost(matchableBlockElementSelector);
  for (let i=0; i<markedElements.length; i++) {
    let markedElement = markedElements[i];
    if (!cheerio(markedElement).attr("id")) {
      cheerio(markedElement).attr("id", `block${i}`)
    }
  }
  return parsedPost.html();
}

/**
 * Given HTML (probably for a comment), find every blockqute and add a unique
 * CSS class to it of the form blockquote_${documentId}_${n}, where n is a
 * counter to distinguish all the blockquotes in the comment.
 */
export function annotateMatchableBlockquotes(html: string, documentId: string): string {
  const parsedDocument = cheerioParse(html);
  let blockquotes = parsedDocument('blockquote');
  for (let i=0; i<blockquotes.length; i++) {
    const blockquote = blockquotes[i];
    const markerClass = `blockquote_${documentId}_${i+1}`;
    const existingClasses = cheerio(blockquote).attr("class");
    if (existingClasses) {
      if (existingClasses.split(' ').indexOf(markerClass) >= 0) {
        // Annotation already present
      } else {
        cheerio(blockquote).attr('class', `${existingClasses} ${markerClass}`);
      }
    } else {
      cheerio(blockquote).attr('class', markerClass);
    }
  }
  return parsedDocument.html();
}


interface MarkedInterval {
  start: number
  end: number
  spanClass: string
}

/**
 * Given HTML (probably for a post) and a list of marked intervals, wrap those
 * intervals in <span> tags with the given class name. The start and end of each
 * interval is given as an offset in characters into the HTML, and is guaranteed
 * to be in a place where text insertion is valid.
 *
 * If an interval crosses an open tag and doesn't cross the corresponding close
 * tag, it results in multiple spans.
 *
 * For example:
 *            |start       |end
 *   <p>Lorem ipsum <em>dolor</em> sit amet adipiscing
 * becomes
 *   <p>Lorem <span ...>ipsum </span><em><span ...>dol</span>or</em> sit amet adipiscing
 *
 * Whereas
 *            |start                  |end
 *   <p>Lorem ipsum <em>dolor</em> sit amet adipiscing
 * would need only one span:
 *   <p>Lorem <span ...>ipsum <em>dolor</em> sit</span> amet adipiscing
 */
export function annotateMatchedSpans(html: string, intervals: MarkedInterval[]): string {
  let intervalsByStart = groupBy(intervals, interval=>interval.start);
  let intervalsByEnd = groupBy(intervals, interval=>interval.end);
  let sb: string[] = [];
  let pos = 0;
  
  let activeSpan: string|null = null;
  let activeClasses = new Set<string>();
  
  function setActiveSpan(classes: string|null) {
    if (classes) {
      if (activeSpan) {
        if (activeSpan !== classes) {
          sb.push(`</span><span class="${classes}">`);
        }
      } else {
        sb.push(`<span class="${classes}">`);
      }
    } else {
      if (activeSpan) {
        sb.push('</span>');
      }
    }
    activeSpan = classes;
  }
  
  for (let [tokenType,tokenStr] of tokenizeHtml(html)) {
    switch(tokenType) {
      case 'startTagStart':
      case 'endTagStart':
        setActiveSpan(null);
        sb.push(tokenStr);
        pos += tokenStr.length;
        break;
      case 'data':
      case 'space':
        let lastSplit = 0;
        
        for (let i=0; i<tokenStr.length; i++) {
          if (intervalsByStart[i+pos] || intervalsByEnd[i+pos]) {
            if (i>lastSplit) {
              const activeClassStrs = [...(activeClasses.values())];
              setActiveSpan(activeClassStrs.join(" "));
              
              sb.push(tokenStr.substr(lastSplit, i-lastSplit));
              lastSplit = i;
            }
            
            //let oldActiveClassesCount = activeSpans.size;
            let closedHere = intervalsByEnd[i+pos]
            if (closedHere) {
              for (let interval of closedHere) {
                activeClasses.delete(interval.spanClass);
              }
            }
            let startedHere = intervalsByStart[i+pos]
            if (intervalsByStart[i+pos]) {
              for (let interval of startedHere) {
                activeClasses.add(interval.spanClass);
              }
            }
          }
        }
        
        const activeClassStrs = [...(activeClasses.values())];
        setActiveSpan(activeClassStrs.join(" "));
        
        sb.push(tokenStr.substr(lastSplit, tokenStr.length-lastSplit));
        pos += tokenStr.length;
        break;
      default:
        sb.push(tokenStr);
        pos += tokenStr.length;
        break;
    }
  }
  
  return sb.join('');
}


/**
 * Given the HTML of a post body which has IDs on every block (from
 * addBlockIDsToHTML), and the HTML of a comment which might contain
 * blockquotes taken from it, return the ID of the first block which the comment
 * quotes from.
 */
export function getCommentQuotedBlockID(postHTML: string, commentHTML: string, options: QuoteShardSettings): string|null {
  const quoteShards = commentToQuoteShards(commentHTML, options);
  if (!quoteShards?.length) return null;
  
  //@ts-ignore
  const parsedPost = cheerio.load(postHTML, null, false);
  
  return findQuoteInPost(parsedPost, quoteShards);
}

/**
 * Given a comment (as HTML) which might contain blockquotes, extract a list of
 * "quote shards". A quote shard is an HTML substring which, if it matches an
 * HTML substring found in the post, will cause the comment to match that part
 * of the post.
 *
 * This incorporates some slightly complicated heuristics. In particular:
 *  * Split paragraphs, list items, etc into their own blocks.
 *  * If a blockquote-paragraph contains "..." (three dots), "…" (U+2026 Unicode
 *    ellipsis character), or either of those wrapped in parens or square
 *    brackets, split there.
 *  * If there are matching square brackets containing up to 30 characters,
 *    split into a before-the-bracket shard and an after-the-bracket shard.
 *  * Discard shards shorter than 20 characters.
 */
export function commentToQuoteShards(commentHTML: string, options?: QuoteShardSettings): string[] {
  options = options||defaultQuoteShardSettings;
  const result: string[] = [];
  
  // Parse the HTML into cheerio
  //@ts-ignore (cheerio type annotations sadly don't quite match the actual imported library)
  const parsedComment = cheerio.load(commentHTML, null, false);
  
  // Find blockquote elements
  const blockquotes = parsedComment('blockquote');
  for (let i=0; i<blockquotes.length; i++) {
    addQuoteShardsFromElement(result, cheerio(blockquotes[i]), options);
  }
  
  return result;
}

function addQuoteShardsFromElement(outQuoteShards: string[], blockquoteElement: any, options: QuoteShardSettings): void {
  // HACK: Rather than do this in full generality, we first assume that a
  // blockquote element either contains only other block types or no block
  // types.
  // If the element has children that are of block types, recurse into them
  let pos = blockquoteElement[0].firstChild;
  let hasBlockChildren = false;
  while (pos) {
    if (pos.type==='tag' && ['p','li','blockquote'].includes(pos.name)) {
      addQuoteShardsFromElement(outQuoteShards, cheerio(pos), options);
      hasBlockChildren = true;
    }
    pos = pos.nextSibling;
  }
  if (hasBlockChildren) {
    return;
  }
  
  // Split on ellipses
  // HACK: Rather than handle this in full generality, we just ignore the case
  // where ellipses may be inside child elements (eg an italicized section or
  // a link caption). So we split the HTML *as strings*, which in that case
  // produces mismatched tags. This is okay because quote shards are never
  // rendered anywhere, only string-matched to produce a boolean result.
  const quoteHtml = cheerio(blockquoteElement).html() || "";
  
  const ellipsizedSections = quoteHtml.split(/(\[\.\.\.\])|(\[\u2026\])|(\.\.\.)|(\u2026)/);
  for (let section of ellipsizedSections) {
    if (section) {
      const trimmed = section.trim();
      if (trimmed.length >= options.minLength) {
        outQuoteShards.push(trimmed);
      }
    }
  }
}

/**
 * Given a post (as a cheerio parse tree) and a list of quote shards, return the
 * ID of the first block which matches a quote shard (or null if no match is
 * found).
 */
function findQuoteInPost(parsedPost, quoteShards: string[]): string|null {
  let markedElements = parsedPost(matchableBlockElementSelector);
  for (let i=0; i<markedElements.length; i++) {
    const blockID = cheerio(markedElements[i]).attr("id");
    if (blockID) {
      const markedHtml = cheerio(markedElements[i]).html()||"";
      for (let quoteShard of quoteShards) {
        if (markedHtml.indexOf(quoteShard) >= 0) {
          return blockID;
        }
      }
    }
  }
  return null;
}

/**
 * Given a post, fetch all the comments on that post, check them for blockquotes,
 * line those quotes up to sections of the post, and return a mapping from block
 * IDs to arrays of comment IDs.
 *
 * This function is potentially quite slow, if there are a lot of comments and/or
 * the post is very long. FIXME: Build caching for this.
 */
export async function getPostBlockCommentLists(context: ResolverContext, post: DbPost): Promise<{
  allResults: Record<string,string[]>,
  highKarmaResults: Record<string,string[]>,
}> {
  const minKarma = 10;
  
  const postHTML = post.contents?.html;
  //@ts-ignore
  const parsedPost = cheerio.load(addBlockIDsToHTML(postHTML), null, false);
  
  const comments = await Comments.find({
    ...Comments.defaultView({}).selector,
    postId: post._id,
  }).fetch();
  
  let allResults: Record<string,string[]> = {};
  let highKarmaResults: Record<string,string[]> = {};
  
  for (let comment of comments) {
    //@ts-ignore
    const quoteShards = commentToQuoteShards(comment.contents?.html);
    const blockID = findQuoteInPost(parsedPost, quoteShards);
    
    if (blockID) {
      if (blockID in allResults) allResults[blockID].push(comment._id);
      else allResults[blockID] = [comment._id];
      
      if (comment.baseScore >= minKarma) {
        if (blockID in highKarmaResults) highKarmaResults[blockID].push(comment._id);
        else highKarmaResults[blockID] = [comment._id];
      }
    }
  }
  
  return {allResults, highKarmaResults};
}
