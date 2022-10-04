import cheerio from 'cheerio';
import { Comments } from '../lib/collections/comments/collection';

export function addBlockIDsToHTML(html: string): string {
  //@ts-ignore
  const parsedPost = cheerio.load(html, null, false);
  let markedElements = parsedPost('p,li,blockquote');
  for (let i=0; i<markedElements.length; i++) {
    let markedElement = markedElements[i];
    if (!cheerio(markedElement).attr("id")) {
      cheerio(markedElement).attr("id", `block${i}`)
    }
  }
  return parsedPost.html();
}

export function getCommentQuotedBlockID(postHTML: string, commentHTML: string): string|null {
  //@ts-ignore
  const parsedPost = cheerio.load(postHTML, null, false);
  //@ts-ignore
  const parsedComment = cheerio.load(commentHTML, null, false);
  
  return getParsedCommentQuotedBlockID(parsedPost, parsedComment);
}

function getParsedCommentQuotedBlockID(parsedPost, parsedComment): string|null {
  const blockquotes = parsedComment('blockquote');
  for (let i=0; i<blockquotes.length; i++) {
    const blockquote = blockquotes[i];
    const quotedBlockID = findQuoteBlockID(parsedPost, blockquote);
    if (quotedBlockID) return quotedBlockID;
  }
  
  return null;
}

export function findQuoteBlockID(parsedPost, blockquote): string|null {
  const blockquoteText = cheerio(blockquote).text();
  let markedElements = parsedPost('p,li,blockquote');
  
  for (let i=0; i<markedElements.length; i++) {
    const blockID = cheerio(markedElements[i]).attr("id");
    if (blockID) {
      const blockText = cheerio(markedElements[i]).text();
      if(blockText.length>0 && blockquoteText===blockText) {
        return blockID;
      }
    }
  }
  return null;
}

export async function getPostBlockCommentLists(context: ResolverContext, post: DbPost): Promise<Record<string,string[]>> {
  const postHTML = post.contents?.html;
  //@ts-ignore
  const parsedPost = cheerio.load(addBlockIDsToHTML(postHTML), null, false);
  
  const comments = await Comments.find({
    ...Comments.defaultView({}).selector,
    postId: post._id,
  }).fetch();
  
  let result: Record<string,string[]> = {};
  for (let comment of comments) {
    //@ts-ignore
    const parsedComment = cheerio.load(comment.contents?.html, null, false);
    const blockID = getParsedCommentQuotedBlockID(parsedPost, parsedComment);
    if (blockID) {
      if (blockID in result) result[blockID].push(comment._id);
      else result[blockID] = [comment._id];
    }
  }
  console.log("getPostBlockCommentLists: "+JSON.stringify(result));
  return result;
}
