import { diff } from './vendor/node-htmldiff/htmldiff';
import { Revisions } from '../lib/collections/revisions/collection';
import cheerio from 'cheerio';
import orderBy from 'lodash/orderBy';
import times from 'lodash/times';

type EditAttributions = (string|null)[]
type InsDelUnc = "ins"|"del"|"unchanged"

export async function annotateAuthors(documentId: string, collectionName: string, fieldName: string): Promise<string> {
  const revs = await Revisions.find({
    documentId, collectionName, fieldName
  }).fetch();
  if (!revs.length) return "";
  
  const revsByDate = orderBy(revs, r=>r.editedAt);
  const firstRev = revsByDate[0];
  const finalRev = revsByDate[revs.length-1];
  let attributions: EditAttributions = times(firstRev.html?.length||0, ()=>firstRev.userId);
  
  for (let i=1; i<revsByDate.length; i++) {
    const rev = revsByDate[i];
    const prevHtml = revs[i-1].html;
    const newHtml = rev.html;
    attributions = attributeEdits(prevHtml, newHtml, rev.userId, attributions);
  }
  
  return attributionsToSpans(finalRev.html, attributions);
}

export const attributeEdits = (oldHtml: string, newHtml: string, userId: string, oldAttributions: EditAttributions): EditAttributions => {
  //const diffs = diffHtml(oldHtml, newHtml, false);
  const diffs = diff(oldHtml, newHtml);
  //@ts-ignore
  const $ = cheerio.load(diffs, null, false);
  const newAttributions: EditAttributions = [];
  let oldAttributionPos = 0;
  
  walkHtmlPreorder<InsDelUnc>($.root()[0], "unchanged", (node: cheerio.Element, state: InsDelUnc) => {
    //@ts-ignore
    if (node.type === 'tag' || node.type === "root") {
      if (node.tagName==="ins") {
        return "ins";
      } else if (node.tagName==="del") {
        return "del";
      }
    } else if (node.type === 'text' && node.data) {
      const text: string = node.data;
      if (state==="ins") {
        for (let i=0; i<text.length; i++)
          newAttributions.push(userId);
      } else if (state==="del") {
        oldAttributionPos += text.length;
      } else if (state==="unchanged") {
        for (let i=0; i<text.length; i++)
          newAttributions.push(oldAttributions[oldAttributionPos++]);
      }
    }
    return state;
  });
  
  return newAttributions;
}

function walkHtmlPreorder<T>(node: cheerio.Element, props: T, callback: (node: cheerio.Element, props: T)=>T) {
  const childProps: T = callback(node, props);
  //@ts-ignore
  if (node.type==="tag" || node.type==="root") {
    for (let child of node.children) {
      walkHtmlPreorder(child, childProps, callback);
    }
  }
}

function mapHtmlPostorder($: cheerio.Root, node: cheerio.Element, callback: (node: cheerio.Cheerio)=>cheerio.Cheerio): cheerio.Cheerio {
  //@ts-ignore
  if (node.type==="tag" || node.type==="root") {
    const $copiedNode = $(node).clone();
    const mappedChildren = ($copiedNode[0] as cheerio.TagElement).children.map(c =>
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
  // @ts-ignore DefinitelyTyped annotation is wrong, and cheerio's own annotations aren't ready yet
  const $ = cheerio.load(html, null, false);
  const ret: EditAttributions = [];
  let currentAuthorId: string|null = null;
  walkHtmlPreorder<void>($.root()[0], undefined, (node: cheerio.Element, props: void) => {
    //@ts-ignore
    if (node.type === 'tag' || node.type === "root") {
      if (node.attribs?.class) {
        const newAuthorId = classesToAuthorId(node.attribs.class)
        if (newAuthorId)
          currentAuthorId = newAuthorId;
      }
    } else if (node.type === 'text' && node.data) {
      for (let i=0; i<node.data.length; i++) {
        ret.push(currentAuthorId);
      }
    }
  });
  return ret;
}

export const applyAttributionsToText = ($: cheerio.Root, node: cheerio.Element, attributions: EditAttributions, startOffset: number): cheerio.Cheerio => {
  if (!node.data || node.data.length===0) {
    return $(node);
  }
  const text = node.data;
  
  function createSpan(className: string|null, text: string): cheerio.Element|string {
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
  let spans: (cheerio.Element|string)[] = [];
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
    // @ts-ignore
    wrapperSpan.append(span);
  }
  return wrapperSpan;
}

export const attributionsToSpans = (html: string, attributions: EditAttributions): string => {
  // @ts-ignore DefinitelyTyped annotation is wrong, and cheerio's own annotations aren't ready yet
  const $ = cheerio.load(html, null, false);
  let attributionPos = 0;
  
  return cheerio.html(mapHtmlPostorder($, $.root()[0], ($node: cheerio.Cheerio) => {
    const node = $node[0];
    if (node.type === 'text' && node.data) {
      const ret = applyAttributionsToText($, node, attributions, attributionPos);
      attributionPos += node.data.length
      return ret;
    } else {
      return $(node);
    }
  }));
}
