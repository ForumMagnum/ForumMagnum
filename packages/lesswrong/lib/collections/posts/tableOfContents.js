import { Utils } from 'meteor/vulcan:core';
import cheerio from 'cheerio';

// Number of headings below which a table of contents won't be generated.
const minHeadingsForToC = 3;

// Tags which define headings. Currently <h1>-<h4>, <strong>, and <b>. Excludes
// <h5> and <h6> because their usage in historical (HTML) wasn't as a ToC-
// worthy heading.
const headingTags = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  // <b> and <strong> are at the same level
  strong: 7,
  b: 7,
}

const headingIfWholeParagraph = {
  strong: true,
  b: true,
};

const headingSelector = _.keys(headingTags).join(",");

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
export function extractTableOfContents(postHTML, alwaysDisplayToC)
{
  if (!postHTML) return null;
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
    
    if (title && title.trim()!=="") {
      let anchor = titleToAnchor(title, usedAnchors);
      usedAnchors[anchor] = true;
      cheerio(tag).attr("id", anchor);
      headings.push({
        title: title,
        anchor: anchor,
        level: tagToHeadingLevel(tag.tagName),
      });
    }
  }

  if ((headings.length < minHeadingsForToC) && !alwaysDisplayToC) {
    return null;
  }

  // Filter out unused heading levels, mapping the heading levels to consecutive
  // numbers starting from 1. So if a post uses <h1>, <h3> and <strong>, those
  // will be levels 1, 2, and 3 (not 1, 3 and 7).

  // Get a list of heading levels used
  let headingLevelsUsedDict = {};
  for(let i=0; i<headings.length; i++)
    headingLevelsUsedDict[headings[i].level] = true;

  // Generate a mapping from raw heading levels to compressed heading levels
  let headingLevelsUsed = _.keys(headingLevelsUsedDict).sort();
  let headingLevelMap = {};
  for(let i=0; i<headingLevelsUsed.length; i++)
    headingLevelMap[ headingLevelsUsed[i] ] = i;

  // Mark sections with compressed heading levels
  for(let i=0; i<headings.length; i++)
    headings[i].level = headingLevelMap[headings[i].level]+1;

  return {
    html: postBody.html(),
    sections: headings,
    headingsCount: headings.length
  }
}

const reservedAnchorNames = ["top", "comments"];

// Given the text in a heading block and a dict of anchors that have been used
// in the post so far, generate an anchor, and return it. An anchor is a
// URL-safe string that can be used for within-document links, and which is
// not one of a few reserved anchor names.
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
  if(!usedAnchors[anchor] && !_.find(reservedAnchorNames, x=>x===anchor))
    return anchor;

  let anchorSuffix = 1;
  while(usedAnchors[anchor + anchorSuffix])
    anchorSuffix++;
  return anchor+anchorSuffix;
}

// `<b>` and `<strong>` tags are headings iff they are the only thing in their
// paragraph. Return whether the given tag name is a tag with that property
// (ie, is `<strong>` or `<b>`).
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
  let selfAndSiblings = cheerio(parent).contents();
  if (selfAndSiblings.length != 1) return false;

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
