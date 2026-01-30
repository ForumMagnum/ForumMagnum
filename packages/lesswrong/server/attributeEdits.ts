import { diff } from './vendor/node-htmldiff/htmldiff';
import { compareVersionNumbers } from '../lib/editor/utils';
import cheerio from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { DataNode, Element, Node, NodeWithChildren } from 'cheerio/node_modules/domhandler';
import { cheerioParse } from './utils/htmlUtil';
import orderBy from 'lodash/orderBy';
import filter from 'lodash/filter';

type EditAttributions = (string|null)[]
type InsDelUnc = "ins"|"del"|"unchanged"

export async function annotateAuthors(documentId: string, collectionName: string, fieldName: string, context: ResolverContext, upToVersion?: string | null): Promise<string> {
  const { finalHtml, attributions } = await computeAttributions(
    documentId,
    collectionName,
    fieldName,
    context,
    upToVersion
  );

  return attributionsToSpans(finalHtml, attributions);
}

export async function computeAttributions(
  documentId: string,
  collectionName: string,
  fieldName: string,
  context: ResolverContext,
  upToVersion?: string | null
): Promise<{ finalHtml: string; attributions: EditAttributions }> {
  const { Revisions } = context;

  const revs = await Revisions.find({
    documentId, collectionName, fieldName,
    skipAttributions: false,
  }).fetch();
  if (!revs.length) {
    return { finalHtml: "", attributions: [] };
  }

  let filteredRevs = orderBy(revs, r=>r.editedAt);
  
  // If upToVersion is provided, ignore revs after that
  if (upToVersion) {
    filteredRevs = filter(filteredRevs, r=>compareVersionNumbers(upToVersion, r.version)>=0);
  }

  if (!filteredRevs.length) {
    return { finalHtml: "", attributions: [] };
  }
  
  // Cluster commits by author. In any sequential run of commits by the same
  // author, remove all but the last one. This makes it so that deleting and
  // reinserting something, making an edit and reverting it, etc does not affect
  // attributios.
  filteredRevs = filter(filteredRevs, (r,i) => (
    i===0 || i===filteredRevs.length-1 || filteredRevs[i+1].userId!==r.userId
  ));
  
  // Identify commits that are reverts (text exactly matches a prior rev) and
  // skip over everything in between the reverted-to rev and the revert (which
  // is likely deleting and then restoring stuff, which should not be attributed
  // to the person who did the restore).
  let isReverted: boolean[] = Array.from({ length: filteredRevs.length }, ()=>false);
  for (let i=0; i<filteredRevs.length; i++) {
    for (let j=i-1; j>=0; j--) {
      if (filteredRevs[i].html===filteredRevs[j].html) {
        for (let k=j+1; k<=i; k++)
          isReverted[k] = true;
      }
    }
  }
  filteredRevs = filter(filteredRevs, (r,i) => !isReverted[i]);
  
  const revsByDate = filteredRevs;
  const firstRev = revsByDate[0];
  const finalRev = revsByDate[revsByDate.length-1];
  let attributions: EditAttributions = Array.from({ length: firstRev.html?.length||0 }, ()=>firstRev.userId);
  
  for (let i=1; i<revsByDate.length; i++) {
    const rev = revsByDate[i];
    const prevHtml = revsByDate[i-1].html ?? "";
    const newHtml = rev.html ?? "";
    attributions = attributeEdits(prevHtml, newHtml, rev.userId!, attributions);
  }

  return { finalHtml: finalRev.html || "", attributions };
}

function annotateInsDel(root: Node): InsDelUnc[] {
  const annotations: InsDelUnc[] = [];
  
  walkHtmlPreorder<InsDelUnc>(root, "unchanged", (node: Node, state: InsDelUnc) => {
    if (node.type === "tag") {
      if ((node as Element).tagName === "ins") {
        return "ins";
      } else if ((node as Element).tagName === "del") {
        return "del";
      }
    } else if (node.type === 'text' && (node as DataNode).data) {
      const text: string = (node as DataNode).data;
      for (let i=0; i<text.length; i++)
        annotations.push(state);
    }
    return state;
  });
  
  return annotations;
}

function treeToText($: CheerioAPI): string {
  const textSegments: string[] = [];
  walkHtmlPreorder<null>($.root()[0], null, (node: Node, state: null) => {
    if (node.type === 'text' && (node as DataNode).data) {
      const text: string = (node as DataNode).data;
      textSegments.push(text);
    }
    return null;
  });
  return textSegments.join("");
}

function isSpace(s: string): boolean {
  return s.trim()==="";
}

function replaceDelTag($: CheerioAPI) {
  $('del').each((_, element) => {
    const $del = $(element);
    const attributes = $del.attr();
    const content = $del.html();
  
    // Create a new <s> element with the same attributes and content
    const $s = $('<s>').attr(attributes).html(content!);
  
    // Replace the <del> element with the new <s> element
    $del.replaceWith($s);
  });
  return $;
}

export const attributeEdits = (oldHtml: string, newHtml: string, userId: string, oldAttributions: EditAttributions): EditAttributions => {
  // Parse the before/after HTML
  const parsedOldHtml = replaceDelTag(cheerioParse(oldHtml));
  const parsedNewHtml = replaceDelTag(cheerioParse(newHtml));
  
  const oldText = treeToText(parsedOldHtml);
  const newText = treeToText(parsedNewHtml);
  
  const diffHtml = diff(parsedOldHtml.html(), parsedNewHtml.html());
  const parsedDiffs = cheerioParse(diffHtml);
  const insDelAnnotations = annotateInsDel(parsedDiffs.root()[0]);
  
  let newAttributions: EditAttributions = [];
  let oldTextPos = 0;
  let newTextPos = 0;
  let diffPos = 0;
  let diffText = treeToText(parsedDiffs);
  
  for(; newTextPos<newText.length;) {
    if (insDelAnnotations[diffPos]==='ins' && newText.charCodeAt(newTextPos)===diffText.charCodeAt(diffPos)) {
      newAttributions.push(userId);
      newTextPos++;
      diffPos++;
    } else if (insDelAnnotations[diffPos]==='del' && oldText.charCodeAt(oldTextPos)===diffText.charCodeAt(diffPos)) {
      oldTextPos++;
      diffPos++;
    } else if (insDelAnnotations[diffPos]==='unchanged' && oldText.charCodeAt(oldTextPos) === newText.charCodeAt(newTextPos) && oldText.charCodeAt(oldTextPos) === diffText.charCodeAt(diffPos)) {
      newAttributions.push(oldAttributions[oldTextPos]);
      oldTextPos++;
      newTextPos++;
      diffPos++;
    } else {
      let skippedWs = false;
      while (newTextPos<newText.length && isSpace(newText.charAt(newTextPos))) {
        if (newAttributions.length>0)
          newAttributions.push(newAttributions[newAttributions.length-1]);
        else
          newAttributions.push(null);
        newTextPos++;
        skippedWs = true;
      }
      while (oldTextPos<oldText.length && isSpace(oldText.charAt(oldTextPos))) {
        oldTextPos++;
        skippedWs = true;
      }
      while (!skippedWs && diffPos<diffText.length && isSpace(diffText.charAt(diffPos))) {
        diffPos++;
        skippedWs = true;
      }
      
      if (!skippedWs) {
        throw new Error(`Text mismatch: '${oldText.charAt(oldTextPos)}'@${oldTextPos} vs '${newText.charAt(newTextPos)}'@${newTextPos}`);
      }
    }
  }
  
  if (newAttributions.length !== newText.length)
    throw new Error("Result text length mismatch");
  return newAttributions;
}

function walkHtmlPreorder<T>(node: Node, props: T, callback: (node: Node, props: T) => T) {
  const childProps: T = callback(node, props);
  if (node.type === "tag" || node.type === "root") {
    for (let child of (node as NodeWithChildren).children) {
      walkHtmlPreorder(child, childProps, callback);
    }
  }
}

function mapHtmlPostorder($: CheerioAPI, node: Node, callback: (node: Cheerio<Node>) => Cheerio<Node>): Cheerio<Node> {
  if (node.type === "tag" || node.type === "root") {
    const $copiedNode = $(node).clone();
    const mappedChildren = ($copiedNode[0] as NodeWithChildren).children.map(c =>
      mapHtmlPostorder($, c, callback));
    $copiedNode.empty();
    for (let mappedChild of mappedChildren)
      mappedChild.appendTo($copiedNode);
    return callback($copiedNode);
  } else {
    return callback($(node));
  }
}

function classesToAuthorId(classes: string|null): string|null {
  if (!classes) return null;
  const singleClasses = classes.split(' ');
  for (let singleClass of singleClasses) {
    if (singleClass.startsWith('by_'))
      return singleClass.substr(3);
  }
  return null;
}
function authorIdToClasses(authorId: string|null): string|null {
  if (!authorId) return null;
  return "by_"+authorId;
}

export const spansToAttributions = (html: string): EditAttributions => {
  const $ = cheerioParse(html);
  const ret: EditAttributions = [];
  let currentAuthorId: string|null = null;
  walkHtmlPreorder<void>($.root()[0], undefined, (node: Node, props: void) => {
    if (node.type === 'tag' || node.type === "root") {
      if ((node as Element).attribs?.class) {
        const newAuthorId = classesToAuthorId((node as Element).attribs.class)
        if (newAuthorId)
          currentAuthorId = newAuthorId;
      }
    } else if (node.type === 'text' && (node as DataNode).data) {
      for (let i=0; i<(node as DataNode).data.length; i++) {
        ret.push(currentAuthorId);
      }
    }
  });
  return ret;
}

export const applyAttributionsToText = ($: CheerioAPI, node: Node, attributions: EditAttributions, startOffset: number): Cheerio<Node> => {
  if (!(node as DataNode).data || (node as DataNode).data.length===0) {
    return $(node);
  }
  const text = (node as DataNode).data;
  
  function createSpan(className: string|null, text: string): Node|string {
    if (className) {
      const span = $('<span/>');
      span.text(text);
      span.attr('class', className);
      return span.toArray()[0];
    } else {
      return text;
    }
  }
  
  let rangeStart = 0;
  let currentAuthor: string|null = attributions[startOffset];
  let spans: (Node|string)[] = [];
  for (let i=1; i<text.length; i++) {
    if (attributions[startOffset+i] !== attributions[startOffset+i-1]) {
      const span = createSpan(authorIdToClasses(currentAuthor), text.substr(rangeStart, i-rangeStart));
      spans.push(span);
      currentAuthor = attributions[startOffset+i];
      rangeStart = i;
    }
  }
  spans.push(createSpan(authorIdToClasses(currentAuthor), text.substr(rangeStart)));
  
  if (spans.length===1) {
    return $(spans[0]);
  }
  
  const wrapperSpan = $('<span/>');
  for (let span of spans) {
    wrapperSpan.append(span);
  }
  return wrapperSpan;
}

export const attributionsToSpans = (html: string, attributions: EditAttributions): string => {
  const $ = cheerioParse(html);
  let attributionPos = 0;
  
  return cheerio.html(mapHtmlPostorder($, $.root()[0], ($node: Cheerio<Node>) => {
    const node = $node[0];
    if (node.type === 'text' && (node as DataNode).data) {
      const ret = applyAttributionsToText($, node, attributions, attributionPos);
      attributionPos += (node as DataNode).data.length
      return ret;
    } else {
      return $(node);
    }
  }));
}
