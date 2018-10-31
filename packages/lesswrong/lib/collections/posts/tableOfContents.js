import { Utils } from 'meteor/vulcan:core';
import cheerio from 'cheerio';

// Number of headings below which a table of contents won't be generated.
const minHeadingsForToC = 3;

const headingTags = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
}

const headingIfWholeParagraph = {
  strong: 7,
  b: 8,
};

const headingSelector = _.keys(headingTags).concat(_.keys(headingIfWholeParagraph)).join(",");

// Given an HTML document, extract a list of sections for a table of contents
// from it, and add anchors. The result is modified HTML with added anchors,
// plus a JSON array of sections, where each section has a
// `title`, `anchor`, and `level`, like this:
//   {
//     html: "<a anchor=...">,
//     sections: [
//       {title: "Preamble", anchor: "preamble", level: 1},
//       {title: "My Cool Idea", anchor: "mycoolidea", level: 1},
//         {title: "An Aspect of My Cool Idea", anchor:"anaspectofmycoolidea", level: 2},
//         {title: "Why This Is Neat", anchor:"whythisisneat", level: 2},
//       {title: "Conclusion", anchor: "conclusion", level: 1},
//     ]
//   }
export function extractTableOfContents(postHTML)
{
  const postBody = cheerio.load(postHTML);
  let headings = [];
  let usedAnchors = {};
  
  // First, find the headings in the document, create a linear list of them,
  // and insert anchors at each one.
  let headingTags = postBody(headingSelector);
  for (let i=0; i<headingTags.length; i++) {
    let tag = headingTags[i];
    
    if (tagIsHeadingIfWholeParagraph(tag.tagName) && !tagIsWholeParagraph(tag)) {
      continue;
    }
    
    let title = cheerio(tag).text();
    let anchor = titleToAnchor(title, usedAnchors);
    cheerio(tag).attr("id", anchor);
    headings.push({
      title: title,
      anchor: anchor,
      level: tagToHeadingLevel(tag.tagName),
    });
  }
  
  if (headings.length < minHeadingsForToC)
    return null;
  
  // Filter out unused heading levels, mapping the heading levels to consecutive
  // numbers starting from 1.
  // TODO
  
  return {
    html: postBody.html(),
    sections: headings,
  }
}

// Given the text in a heading block and a dict of anchors that have been used
// in the post so far, generate an anchor, add that anchor to usedAnchors, and
// return it. An anchor is a URL-safe string that can be used for
// within-document links.
function titleToAnchor(title, usedAnchors)
{
  let charsToUse = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789";
  let sb = [];
  
  for(let i=0; i<title.length; i++) {
    let ch = title.charAt(i);
    if(charsToUse.indexOf(ch) >= 0) {
      sb.push(ch);
    } else {
      sb.push('_');
    }
  }
  
  let anchor = sb.join('');
  if(!usedAnchors[anchor])
    return anchor;
  
  let anchorSuffix = 1;
  while(usedAnchors[anchor + anchorSuffix])
    anchorSuffix++;
  return anchor+anchorSuffix;
}

// `<b>` and `<strong>` tags are headings iff they are the only thing in their
// paragraph.
function tagIsHeadingIfWholeParagraph(tagName)
{
  return tagName.toLowerCase() in headingIfWholeParagraph;
}

function tagIsWholeParagraph(tag) {
  if (!tag) return false;
  let parents = cheerio(tag).parent();
  if (!parents || !parents.length) return false;
  let parent = parents[0];
  if (parent.tagName.toLowerCase() !== 'p') return false;
  let siblings = cheerio(tag).siblings();
  if (siblings.length > 0) return false;
  
  return true;
}

function tagToHeadingLevel(tagName)
{
  let lowerCaseTagName = tagName.toLowerCase();
  if (lowerCaseTagName in headingTags)
    return headingTags[lowerCaseTagName];
  else if (lowerCaseTagName in headingIfWholeParagraph)
    return headingIfWholeParagraph[lowerCaseTagName];
  else
    return 0;
}

Utils.extractTableOfContents = extractTableOfContents;