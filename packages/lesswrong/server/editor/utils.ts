import mjAPI from 'mathjax-node'
import {isAnyTest, isMigrations} from '../../lib/executionEnvironment'
import Revisions, { ChangeMetrics } from '../../lib/collections/revisions/collection';
import { diff } from "../vendor/node-htmldiff/htmldiff";
import { cheerioParse } from '../utils/htmlUtil'
import cheerio from 'cheerio'
import { extractVersionsFromSemver } from '../../lib/editor/utils';
import { normalizeHtmlForDiff } from '../resolvers/htmlDiff';

export const trimLatexAndAddCSS = (dom: any, css: string) => {
  // Remove empty paragraphs
  var paragraphs = dom.getElementsByClassName("MJXc-display");
  // We trim all display equations that don't have any textContent. This seems
  // Likely fine, but there is some chance this means we are also trimming some
  // Equations that only have images or something like that. If this happen, we
  // want to adjust this part.
  for (var i = 0, len = paragraphs.length; i < len; i++) {
      var elem = paragraphs[i];
      if (elem.textContent.trim() === '') {
          elem.parentNode.removeChild(elem);
          i--;
          len--;
      }
  }
  const [firstLatexElement] = dom.getElementsByClassName("mjx-chtml");
  const styleNode = dom.createElement("style");
  styleNode.textContent = css;
  if (firstLatexElement) firstLatexElement.appendChild(styleNode);
  return dom
}

const MATHJAX_OPTIONS = {
  jax: ['input/TeX', 'output/CommonHTML'],
  TeX: {
    extensions: ['autoload-all.js', 'Safe.js'],
  },
  messageStyles: 'none',
  showProcessingMessages: false,
  showMathMenu: false,
  showMathMenuMSIE: false,
  preview: 'none',
  delayStartupTypeset: true,
}

if (!isAnyTest && !isMigrations) {
  mjAPI.config({
    MathJax: MATHJAX_OPTIONS
  });
  mjAPI.start();
}

export const preProcessLatex = async (content: AnyBecauseTodo) => {
  // MathJax-rendered LaTeX elements have an associated stylesheet. We put this
  // inline with the first (and only the first) MathJax element; this ensures
  // that it ends up in feeds, in greaterwrong's scrapes, etc, whereas if it
  // were part of the site's top-level styles, it wouldn't. This leads to
  // at most one copy per LaTeX-using post or comment; so there's some
  // duplication, but not the extreme amount of duplication we had before
  // (where a single post that used LaTeX heavily added ~80 copies of 19kb
  // each to the front page).
  //
  // The MathJax stylesheet varies with its configuration, but (we're pretty
  // sure) does not vary with the content of what it's rendering.

  // gets set to true if a stylesheet has already been added
  let mathjaxStyleUsed = false;

  for (let key in content.entityMap) { // Can't use forEach with await
    let value = content.entityMap[key];
    if(value.type === "INLINETEX" && value.data.teX) {
      const mathJax = await mjAPI.typeset({
            math: value.data.teX,
            format: "inline-TeX",
            html: true,
            css: !mathjaxStyleUsed,
      })
      value.data = {...value.data, html: mathJax.html};
      if (!mathjaxStyleUsed) {
        value.data.css = mathJax.css;
        mathjaxStyleUsed = true;
      }
      content.entityMap[key] = value;
    }
  }

  for (let key in content.blocks) {
    const block = content.blocks[key];
    if (block.type === "atomic" && block.data.mathjax) {
      const mathJax = await mjAPI.typeset({
        math: block.data.teX,
        format: "TeX",
        html: true,
        css: !mathjaxStyleUsed,
      })
      block.data = {...block.data, html: mathJax.html};
      if (!mathjaxStyleUsed) {
        block.data.css = mathJax.css;
        mathjaxStyleUsed = true;
      }
    }
  }

  return content;
}

const countCharsInTag = (parsedHtml: cheerio.Root, tagName: string): number => {
  const instancesOfTag = parsedHtml(tagName);
  let cumulative = 0;
  for (let i=0; i<instancesOfTag.length; i++) {
    const tag = instancesOfTag[i];
    const text = cheerio(tag).text();
    cumulative += text.length;
  }
  return cumulative;
}

export const htmlToChangeMetrics = (oldHtml: string, newHtml: string): ChangeMetrics => {
  const htmlDiff = diff(normalizeHtmlForDiff(oldHtml), normalizeHtmlForDiff(newHtml));
  const parsedHtml = cheerioParse(htmlDiff);

  /// Given an HTML diff, where added sections are marked with <ins> and <del>
  /// tags, count the number of chars added and removed. This is used for providing
  /// a quick distinguisher between small and large changes, on revision history
  /// lists.
  const insertedChars = countCharsInTag(parsedHtml, "ins");
  const removedChars = countCharsInTag(parsedHtml, "del");

  return { added: insertedChars, removed: removedChars };
}

export async function getLatestRev(documentId: string, fieldName: string): Promise<DbRevision|null> {
  return await Revisions.findOne({documentId: documentId, fieldName}, {sort: {editedAt: -1}})
}

/// Given a revision, return the last revision of the same document/field prior
/// to it (null if the revision is the first).
export async function getPrecedingRev(rev: DbRevision): Promise<DbRevision|null> {
  return await Revisions.findOne(
    {documentId: rev.documentId, fieldName: rev.fieldName, editedAt: {$lt: rev.editedAt}},
    {sort: {editedAt: -1}}
  );
}

export function getNextVersion(previousRevision: DbRevision | null, updateType: DbRevision['updateType'] = 'minor', isDraft: boolean) {
  const { major, minor, patch } = extractVersionsFromSemver(previousRevision?.version || "1.0.0")
  switch (updateType) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "major":
      return `${major+1}.0.0`
    case "initial":
      return isDraft ? '0.1.0' : '1.0.0'
    default:
      throw new Error("Invalid updateType, must be one of 'patch', 'minor' or 'major'")
  }
}

/**
 * Make an editable document reflect the latest revision available
 *
 * Documents can get out of sync with revisions if a revision gets deleted, or
 * if there's a bug. This function will update a document to match the most
 * recent *version* in the revisions schema.
 */
export async function syncDocumentWithLatestRevision<N extends CollectionNameString>(
  collection: CollectionBase<N>,
  document: ObjectsByCollectionName[N],
  fieldName: string
): Promise<void> {
  const latestRevision = await Revisions.findOne(
    {
      documentId: document._id,
      draft: false
    },
    { sort: { version: -1 } }
  )
  if (!latestRevision) {
    // Some documents are deletable, but typescript doesn't know that
    if ((document as unknown as {deleted: boolean}).deleted) {
      return
    } else {
      throw new Error(
        `Document ${document._id} (${collection.collectionName}) has no revisions`
      )
    }
  }
  await collection.rawUpdateOne(document._id, {
    $set: {
      [`${fieldName}_latest`]: latestRevision._id
    }
  })
}

export type MaybeDrafteable = { draft?: boolean } 
export const isBeingUndrafted = (oldDocument: MaybeDrafteable, newDocument: MaybeDrafteable) => oldDocument.draft && !newDocument.draft
