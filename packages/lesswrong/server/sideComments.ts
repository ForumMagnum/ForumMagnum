import cheerio from 'cheerio';
import { cheerioParse, cheerioParseAndMarkOffsets, tokenizeHtml } from './utils/htmlUtil';
import groupBy from 'lodash/groupBy';

export interface QuoteShardSettings {
  minLength: number
}
export interface QuoteShard {
  text: string,
  blockquoteIndex: number,
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
  if (!intervals.length) {
    return html;
  }
  let intervalsByStart = groupBy(intervals, interval=>interval.start);
  let intervalsByEnd = groupBy(intervals, interval=>interval.end);
  let sb: string[] = [];
  let pos = 0;
  
  let activeSpan: string|null = null;
  let activeClasses = new Set<string>();
  let activeIntervals: MarkedInterval[] = [];
  let isInTag = false;
  
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
        isInTag = true;
        break;
      case 'space':
        if (isInTag) {
          sb.push(tokenStr);
          pos += tokenStr.length;
          break;
        }
        // FALLTHROUGH
      case 'data':
        let lastSplit = 0;
        
        for (let i=0; i<tokenStr.length; i++) {
          //if (intervalsByStart[i+pos] || intervalsByEnd[i+pos]) {
          //if (intervalsByStart[i+pos] || some(activeIntervals, interval => interval.end > i+pos)) {
          {
            if (i>lastSplit) {
              const activeClassStrs = activeIntervals.map(interval => interval.spanClass);
              setActiveSpan(activeClassStrs.join(" "));
              
              sb.push(tokenStr.substr(lastSplit, i-lastSplit));
              lastSplit = i;
            }
            
            // FIXME: Don't rely on exact end offsets; close anything that's overshot.
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
                activeIntervals.push(interval);
              }
            }
            
            activeIntervals = activeIntervals.filter(interval => interval.end > i+pos);
          }
        }
        
        const activeClassStrs = activeIntervals.map(interval => interval.spanClass);
        setActiveSpan(activeClassStrs.join(" "));
        
        sb.push(tokenStr.substr(lastSplit, tokenStr.length-lastSplit));
        pos += tokenStr.length;
        break;
      case 'tagEnd':
      case 'tagEndAutoclose':
        isInTag = false;
        // FALLTHROUGH
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
  
  const parsedPost = cheerioParse(postHTML);
  
  const match = findQuoteInPost(parsedPost)(quoteShards);
  return match?.firstMatchingBlockID ?? null;
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
export function commentToQuoteShards(commentHTML: string, options?: QuoteShardSettings): QuoteShard[] {
  options = options||defaultQuoteShardSettings;
  const result: QuoteShard[] = [];
  
  // Parse the HTML into cheerio
  const parsedComment = cheerioParse(commentHTML);
  
  // Find blockquote elements
  const blockquotes = parsedComment('blockquote');
  for (let i=0; i<blockquotes.length; i++) {
    addQuoteShardsFromElement(result, cheerio(blockquotes[i]), options);
  }
  
  return result;
}

function addQuoteShardsFromElement(outQuoteShards: QuoteShard[], blockquoteElement: any, options: QuoteShardSettings): void {
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
        outQuoteShards.push({
          text: trimmed,
          blockquoteIndex: 1, //TODO
        });
      }
    }
  }
}

interface QuoteInPost {
  firstMatchingBlockID: string
  matchingSpans: {start: number, end: number}[]
}

/**
 * Given a post (as a cheerio parse tree with annotated offsets) and a list of
 * quote shards, return the ID of the first block which matches a quote shard
 * (or null if no match is found).
 */
const findQuoteInPost = (parsedPost: AnyBecauseTodo) => {
  let markedElements = parsedPost(matchableBlockElementSelector);
  const markedElementBlockHtml: (string|null)[] = [];
  for (let i=0; i<markedElements.length; i++) {
    // This is a for loop instead of a map because markedElmeents (the result of
    // a cheerio selector) isn't actually an array
    const markedElement = markedElements[i];
    const blockID = cheerio(markedElement).attr("id");
    if (blockID) {
      markedElementBlockHtml.push(parsedPost.html(cheerio(markedElement))||"");
    } else {
      markedElementBlockHtml.push(null);
    }
  }

  return (quoteShards: QuoteShard[]): QuoteInPost|null => {
    let firstMatchingBlockID: string|null = null;
    let matchingSpans: {start: number, end: number}[] = [];
    
    for (let i=0; i<markedElements.length; i++) {
      const blockID = cheerio(markedElements[i]).attr("id");
      if (blockID) {
        const blockStartOffset = markedElements[i].offset;
        const markedHtml = markedElementBlockHtml[i];
        if (!markedHtml) continue;
        
        for (let quoteShard of quoteShards) {
          const quoteShardOffset = markedHtml.indexOf(quoteShard.text);
          if (quoteShardOffset >= 0) {
            if (!firstMatchingBlockID) {
              firstMatchingBlockID = blockID;
            }
            // FIXME: This assumes that a parse-and-serialize roundtrip through cheerio doesn't change any offsets, but this assumption is not valid.
            matchingSpans.push({
              start: blockStartOffset + quoteShardOffset,
              end: blockStartOffset + quoteShardOffset + quoteShard.text.length,
            });
          }
        }
      }
    }
    
    if (firstMatchingBlockID) {
      return { firstMatchingBlockID, matchingSpans };
    } else {
      return null;
    }
  }
}

// A comment, reduced to only the fields that affect side-comment placement.
interface CommentForSideComment {
  _id: string
  html: string
}

export function matchSideComments({html, comments, quoteShardSettings}: {
  html: string,
  comments: CommentForSideComment[]
  quoteShardSettings?: QuoteShardSettings,
}): {
  html: string,
  sideCommentsByBlock: Record<string,string[]>,
} {
  const htmlWithBlockIDs = addBlockIDsToHTML(html);
  if (!comments.length) {
    return {
      html: htmlWithBlockIDs,
      sideCommentsByBlock: {},
    };
  }

  const parsedPost = cheerioParseAndMarkOffsets(htmlWithBlockIDs);
  
  let sideCommentsByBlock: Record<string,string[]> = {};
  let markedSpans: MarkedInterval[] = [];
  const findQuoteInPostPartialApplication = findQuoteInPost(parsedPost);
  
  for (let comment of comments) {
    const quoteShards = commentToQuoteShards(comment.html, quoteShardSettings);
    if (!quoteShards.length) continue;
    const match = findQuoteInPostPartialApplication(quoteShards);
    
    if (match) {
      const blockID = match?.firstMatchingBlockID ?? null;
      // TODO: this isn't distinguishing between blockquotes within the comment
      const spanClass = `blockquote_${comment._id}_1`;
      
      markedSpans = [
        ...markedSpans,
        ...match.matchingSpans.map(({start,end}) => ({start, end, spanClass}))
      ];
      
      if (blockID in sideCommentsByBlock) sideCommentsByBlock[blockID].push(comment._id);
      else sideCommentsByBlock[blockID] = [comment._id];
    }
  }
  
  const htmlWithSpanAnnotations = annotateMatchedSpans(htmlWithBlockIDs, markedSpans);
  
  return {
    html: htmlWithSpanAnnotations,
    sideCommentsByBlock
  };
}
