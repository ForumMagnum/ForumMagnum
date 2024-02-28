import cheerio from 'cheerio';

// Tags which define headings. Currently <h1>-<h4>, <strong>, and <b>. Excludes
// <h5> and <h6> because their usage in historical (HTML) wasn't as a ToC-
// worthy heading.
export const headingTags = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  // <b> and <strong> are at the same level
  strong: 7,
  b: 7,
}

export const headingIfWholeParagraph = {
  strong: true,
  b: true,
};

export function tagIsHeading(tag: cheerio.Element): boolean {
  if (tag.type !== "tag") {
    return false;
  }
  if (!(tag.tagName in headingTags)) {
    return false;
  }
  if (tagIsWholeParagraph(tag)) {
    return tagIsHeadingIfWholeParagraph(tag.tagName);
  } else {
    return true;
  }
}

// `<b>` and `<strong>` tags are headings iff they are the only thing in their
// paragraph. Return whether or not the given cheerio tag satisfies these heuristics.
// See tagIsHeadingIfWholeParagraph
const tagIsWholeParagraph = (tag?: cheerio.TagElement): boolean => {
  if (!tag) {
    return false;
  }

  // Ensure the tag's parent is valid
  const parents = cheerio(tag).parent();
  if (!parents || !parents.length || parents[0].type !== 'tag') {
    return false;
  }

  // Ensure that all of the tag's siblings are of the same type as the tag
  const selfAndSiblings = cheerio(parents[0]).contents();
  if (selfAndSiblings.toArray().find((elem) => tagIsAlien(tag, elem))) {
    return false;
  }

  // Ensure that the tag is inside a 'p' element and that all the text in that 'p' is in tags of
  // the same type as our base tag
  const para = cheerio(tag).closest('p');
  if (para.length < 1 || para.text().trim() !== para.find(tag.name).text().trim()) {
    return false;
  }

  return true;
}

const tagIsAlien = (baseTag: cheerio.TagElement, potentialAlienTag: cheerio.Element): boolean => {
  switch (potentialAlienTag.type) {
    case 'tag':
      return baseTag.name !== potentialAlienTag.name;
    case 'text':
      return (potentialAlienTag.data?.trim().length ?? 0) > 0;
    default:
      return true;
  }
}

// `<b>` and `<strong>` tags are headings iff they are the only thing in their
// paragraph. Return whether the given tag name is a tag with that property
// (ie, is `<strong>` or `<b>`).
// See tagIsWholeParagraph
function tagIsHeadingIfWholeParagraph(tagName: string): boolean
{
  return tagName.toLowerCase() in headingIfWholeParagraph;
}
