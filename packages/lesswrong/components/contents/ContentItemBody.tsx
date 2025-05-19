import React, { useEffect, useImperativeHandle, useMemo, useRef, type CSSProperties } from 'react';
import { addNofollowToHTML, ContentReplacedSubstringComponentInfo, replacementComponentMap, type ContentItemBodyProps } from './contentBodyUtil';
import * as htmlparser2 from "htmlparser2";
import { type ChildNode as DomHandlerChildNode, type Node as DomHandlerNode, Element as DomHandlerElement, Text as DomHandlerText } from 'domhandler';
import pick from 'lodash/pick';
import { MaybeScrollableBlock } from '../common/HorizScrollBlock';
import HoverPreviewLink from '../linkPreview/HoverPreviewLink';
import uniq from 'lodash/uniq';
import { ConditionalVisibilitySettings } from '../editor/conditionalVisibilityBlock/conditionalVisibility';
import ConditionalVisibilityBlockDisplay from '../editor/conditionalVisibilityBlock/ConditionalVisibilityBlockDisplay';
import ElicitBlock from '../posts/ElicitBlock';
import { hasCollapsedFootnotes } from '@/lib/betas';
import { CollapsedFootnotes2 } from './CollapsedFootnotes2';
import { WrappedStrawPoll2 } from '../common/WrappedStrawPoll';
import { validateUrl } from '@/lib/vulcan-lib/utils';
import { captureEvent } from '@/lib/analyticsEvents';
import ForumEventPostPagePollSection from '../forumEvents/ForumEventPostPagePollSection';

type PassedThroughContentItemBodyProps = Pick<ContentItemBodyProps, "description"|"noHoverPreviewPrefetch"|"nofollow"|"contentStyleType"|"replacedSubstrings"|"idInsertions"> & {
  bodyRef: React.RefObject<HTMLDivElement|null>
}

type SubstitutionsAttr = Array<{substitutionIndex: number, isSplitContinuation: boolean}>;

/**
 * Renders user-generated HTML, with progressive enhancements. Replaces
 * ContentItemBody, by parsing and recursing through an HTML parse tree rather
 * than doing post-mount modifications.
 *
 * Functionality from the old ContentItemBody which is supported:
 *   markHoverableLinks
 *   markScrollableBlocks
 *   replaceSubstrings
 *   applyIdInsertions
 *   markConditionallyVisibleBlocks
 *   markElicitBlocks
 *   collapseFootnotes
 *   wrapStrawPoll
 * Functionality from the old ContentItemBody which is implemented, but not well tested:
 *   addCTAButtonEventListeners
 *   replaceForumEventPollPlaceholders
 *   exposeInternalIds
 * Additional limitations:
 *   CDATA, directive, script, and style nodes are ignored. These will be
 *   stripped from user-generated content by the sanitizer but may show up in
 *   admin-generated posts.
 *
 * Not in ContentItemBody, but would be useful to add here: Truncation. Since
 * we're walking a parsed HTML tree, this is a better place for the
 * functionality that's currently handled by `truncatize`.
 */
export const ContentItemBody = (props: ContentItemBodyProps) => {
  const { onContentReady, nofollow, dangerouslySetInnerHTML, replacedSubstrings, className, ref } = props;
  const bodyRef = useRef<HTMLDivElement|null>(null);
  const html = (nofollow
    ? addNofollowToHTML(dangerouslySetInnerHTML.__html)
    : dangerouslySetInnerHTML.__html
  );
  const parsedHtml = useMemo(() => {
    const parsed = htmlparser2.parseDocument(html);
    if (replacedSubstrings && replacedSubstrings.length > 0) {
      applyReplaceSubstrings(parsed, replacedSubstrings)
    }
    return parsed;
  }, [html, replacedSubstrings]);

  useImperativeHandle(ref, () => ({
    containsNode: (node: Node): boolean => {
      return !!bodyRef.current?.contains(node);
    },
    getText: (): string => {
      return bodyRef.current?.textContent ?? ""
    },
    getAnchorEl: (): HTMLDivElement|null => {
      return bodyRef.current;
    },
  }));
  
  useEffect(() => {
    if (bodyRef.current) {
      onContentReady?.(bodyRef.current);
    }
  }, [onContentReady]);
  
  const passedThroughProps = {
    ...pick(props, ["description", "noHoverPreviewPrefetch", "nofollow", "contentStyleType", "replacedSubstrings", "idInsertions"]),
    bodyRef,
  };
  
  return <div className={className} ref={bodyRef}>
    {parsedHtml.childNodes.map((child,i) => <ContentItemBodyInner
      key={i}
      parsedHtml={child}
      passedThroughProps={passedThroughProps}
      root={true}
    />)}
  </div>
}

const ContentItemBodyInner = ({parsedHtml, passedThroughProps, root=false}: {
  parsedHtml: DomHandlerChildNode,
  passedThroughProps: PassedThroughContentItemBodyProps,
  root?: boolean,
}) => {
  const { replacedSubstrings } = passedThroughProps;;
  switch (parsedHtml.type) {
    case htmlparser2.ElementType.CDATA:
    case htmlparser2.ElementType.Directive:
    case htmlparser2.ElementType.Root:
      return null;

    case htmlparser2.ElementType.Script: {
      // Embedded script tag. This can appear in posts/etc if they were last edited
      // by an admin (otherwise the validator will have stripped it out.)
      const scriptText: string = parsedHtml.childNodes
        .map((c,i) => c.type === htmlparser2.ElementType.Text ? c.data : "")
        .join("");
      return <script>{scriptText}</script>;
    }
    case htmlparser2.ElementType.Style: {
      // Embedded script tag. This can appear in posts/etc if they were last edited
      // by an admin (otherwise the validator will have stripped it out.) All children
      // must be text nodes.
      const styleText: string = parsedHtml.childNodes
        .map((c,i) => c.type === htmlparser2.ElementType.Text ? c.data : "")
        .join("");
      return <style>{styleText}</style>;
    }

    case htmlparser2.ElementType.Tag: {
      const TagName = parsedHtml.tagName.toLowerCase() as any;
      const attribs = translateAttribs(parsedHtml.attribs);
      const id = attribs.id;
      const classNames = parsedHtml.attribs.class?.split(' ') ?? [];

      let mappedChildren: React.ReactNode[] = parsedHtml.childNodes.map((c,i) => <ContentItemBodyInner
        key={i}
        parsedHtml={c}
        passedThroughProps={passedThroughProps}
      />)

      if (classNames.includes("footnotes") && hasCollapsedFootnotes) {
        return <CollapsedFootnotes2 attributes={attribs} footnoteElements={mappedChildren}/>
      }

      let result: React.ReactNode|React.ReactNode[] = mappedChildren;
      if (id && passedThroughProps.idInsertions?.[id]) {
        const idInsertion = passedThroughProps.idInsertions[id];
        result = [
          <React.Fragment key="inserted">{idInsertion}</React.Fragment>,
           ...result
        ];
      }
      
      if (classNames.includes("conditionallyVisibleBlock")) {
        const visibilityOptionsStr = attribs["data-visibility"];
        if (visibilityOptionsStr) {
          let visibilityOptions: ConditionalVisibilitySettings|null = null;
          try {
            visibilityOptions = JSON.parse(visibilityOptionsStr)
            result = <ConditionalVisibilityBlockDisplay options={visibilityOptions!}>
              {result}
            </ConditionalVisibilityBlockDisplay>;
          } catch {
            // eslint-disable-next-line no-console
            console.error("Error parsing conditional visibility options", visibilityOptionsStr);
          }
        }
      }
      if (classNames.includes("elicit-binary-prediction")) {
        const elicitId = attribs['data-elicit-id'];
        if (elicitId) {
          result = <ElicitBlock questionId={elicitId}/>
        }
      }
      if (classNames.includes("strawpoll-embed")) {
        result = <WrappedStrawPoll2>
          {result}
        </WrappedStrawPoll2>
      }
      if (classNames.includes("ck-cta-button")) {
        if (attribs['data-href']) {
          attribs.href = validateUrl(attribs['data-href']);
        }
        const originalOnClick = attribs['onClick'];
        attribs['onClick'] = (ev: React.MouseEvent<HTMLAnchorElement>) => {
          captureEvent("ctaButtonClicked", {href: attribs['data-href']});
          originalOnClick?.(ev);
        }
      }
      if (classNames.includes("ck-poll")) {
        const forumEventId = attribs['data-internal-id'];
        if (forumEventId) {
          return <ForumEventPostPagePollSection id={forumEventId} forumEventId={forumEventId} />
        }
      }
      if (attribs['data-internal-id']) {
        // If the element has a data-internal-id attribute, translate it into `id`. This is used in
        // some ckeditor plugins (Google Docs import, ckeditor5-poll, internal-block-links) to
        // support internal linking.
        // If the element already has an ID, create a wrapper span with the added ID. Otherwise add
        // it to the element.
        // TODO: The previous implementation of this also checked the document for elements with
        // the same ID, which is not implemented here (and is complicated significantly by render
        // timings). I'm not sure whether that's actually important.
        if (attribs.id) {
          result = <span id={attribs['data-internal-id']}>{result}</span>
        } else {
          attribs.id = attribs['data-internal-id'];
        }
      }

      if (attribs['data-replacements'] && replacedSubstrings) {
        const substitutions = (JSON.parse(attribs['data-replacements']) as SubstitutionsAttr);
        result = [applyReplacements(<TagName {...attribs}>
          {result}
        </TagName>, substitutions, replacedSubstrings)];
      }

      if (root && ['p','div','table'].includes(TagName)) {
        return <MaybeScrollableBlock TagName={TagName} attribs={attribs} bodyRef={passedThroughProps.bodyRef}>
          {result}
        </MaybeScrollableBlock>
      } else if (TagName === 'a') {
        return <HoverPreviewLink
          href={attribs.href}
          {...passedThroughProps}
          {...attribs}
        >
          {result}
        </HoverPreviewLink>
      } else if (parsedHtml.childNodes.length > 0) {
        return <TagName {...attribs}>
          {result}
        </TagName>
      } else {
        return <TagName {...attribs}/>
      }
    }

    case htmlparser2.ElementType.Text:
      return parsedHtml.data;

    case htmlparser2.ElementType.Comment:
      return null;
  }
}

/**
 * Translate an attributes-dict from parsed HTML into something that can be
 * passed to React. In particular, if there's a `style` attribute, it will be
 * a string that needs to be converted into `CSSProperties` (a k-v dict); and,
 * if there's an attribute which React knows by a different name, apply the
 * inverse mapping, ie class->className, srcset->srcSet.
 *
 * This is NOT a sanitization/validation function. The expectation is that the
 * HTML was validated before it was passed to ContentItemBody and parsed.
 */
function translateAttribs(attribs: Record<string,string>): Record<string,any> {
  let attribsCopy: any = {...attribs};
  if ('style' in attribsCopy) {
    attribsCopy.style = parseInlineStyle(attribs.style);
  }
  for (const attribKey of Object.keys(attribsCopy)) {
    if (attribKey in mapAttributeNames) {
      attribsCopy[mapAttributeNames[attribKey]] = attribsCopy[attribKey];
      delete attribsCopy[attribKey];
    }
  }
  return attribsCopy;
}

/**
 * Mapping from HTML attribute names as they appear in HTML, to attribute names as React
 * wants them (ie, with camel-casing). Missing mappings will cause warnings from React,
 *  which look like:
 *   ```Invalid DOM property `allowfullscreen`. Did you mean `allowFullScreen`?```
 * Which don't break anything important but are spammy.
 */
const mapAttributeNames: Record<string,string> = {
  "srcset": "srcSet",
  "class": "className",
  "colspan": "colSpan",
  "columnspan": "columnSpan",
  "rowspan": "rowSpan",
  "allowfullscreen": "allowFullScreen",
}

function camelCaseCssAttribute(input: string) {
  return input.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

export function parseInlineStyle(input: string): CSSProperties {
  return input.split(';').reduce((obj, kv) => {
    let [key, val] = kv.split(':')
    key = key?.trim()
    val = val?.trim()
    if (key && val) {
      obj[camelCaseCssAttribute(key) as keyof CSSProperties] = val as any
    }
    return obj
  }, {} as CSSProperties)
}

function applyReplaceSubstrings(parsedHtml: DomHandlerChildNode, replacedSubstrings: ContentReplacedSubstringComponentInfo[]): DomHandlerChildNode {
  // Traverse parsedHtml, producing an array of text nodes, a combined string
  // with the text of all those nodes, and text offsets for each. Node types
  // that contain non-normal text (CDATA, Script, Style) are skipped.
  const textNodes: Array<{
    node: DomHandlerText,
    offset: number,
    str: string,
  }> = [];
  let currentOffset = 0;

  function traverse(node: DomHandlerChildNode) {
    switch (node.type) {
      case htmlparser2.ElementType.Root:
        for (const child of node.childNodes) {
          traverse(child);
        }
        break;
      case htmlparser2.ElementType.Text:
        const textNode = node;
        const str = textNode.data ?? "";
        textNodes.push({
          node: textNode,
          offset: currentOffset,
          str,
        });
        currentOffset += str.length;
        break;
      case htmlparser2.ElementType.Tag:
        for (const child of node.childNodes) {
          traverse(child);
        }
        break;
      default:
        break;
    }
  }
  traverse(parsedHtml);
  const combinedText = textNodes.map(t => t.str).join("");

  // Locate replacements in the combined string, as offsets (or null if not present).
  const replacementRanges: Array<{ startOffset: number, endOffset: number, replacementIndex: number }> =
    replacedSubstrings.flatMap((replacedSubstring, i) => {
      if (replacedSubstring.replace === 'first') {
        const idx = combinedText.indexOf(replacedSubstring.replacedString)
        if (idx < 0) return [];
        return [{
          startOffset: idx,
          endOffset: idx + replacedSubstring.replacedString.length,
          replacementIndex: i,
        }];
      } else {
        const indices = findStringMultiple(replacedSubstring.replacedString, combinedText);
        return indices.map(idx => ({
          startOffset: idx,
          endOffset: idx + replacedSubstring.replacedString.length,
          replacementIndex: i
        }));
      }
    }
  )

  // Modify the parse tree (in place) to split text nodes at substitution boundaries.
  const splitTextNodes: Array<{
    node: DomHandlerText
    offset: number
    substitutions: SubstitutionsAttr,
  }> = [];
  const splitOffsets = uniq(replacementRanges.flatMap(r => [r.startOffset, r.endOffset])).sort((a,b) => a-b);
  for (const textNode of textNodes) {
    const nodeSplitOffsets = splitOffsets
      .filter(o => o > textNode.offset && o < textNode.offset + textNode.str.length)
      .map(o => o - textNode.offset);
    if (nodeSplitOffsets.length > 0) {
      const newSplitNodes = splitTextNode(textNode.node, nodeSplitOffsets);
      let withinNodeOffset = 0;
      for (const newSplitNode of newSplitNodes) {
        splitTextNodes.push({
          node: newSplitNode,
          offset: textNode.offset + withinNodeOffset,
          substitutions: [],
        });
        withinNodeOffset += newSplitNode.data?.length ?? 0;
      }
    } else {
      splitTextNodes.push({
        node: textNode.node,
        offset: textNode.offset,
        substitutions: [],
      });
    }
  }

  // Mark split text nodes with the replacements that apply to them
  for (let i=0; i<replacementRanges.length; i++) {
    const replacementRange = replacementRanges[i];
    let first = true;
    for (const textNode of splitTextNodes) {
      if (textNode.offset >= replacementRange.startOffset && textNode.offset < replacementRange.endOffset) {
        textNode.substitutions.push({
          substitutionIndex: replacementRange.replacementIndex,
          isSplitContinuation: !first,
        });
        first = false;
      }
    }
  }

  // Modify the parse tree (in place) to wrap text nodes inside substituted ranges with a <span data-replacements="...">.
  for (const textNode of splitTextNodes) {
    if (textNode.substitutions.length > 0) {
      const span = new DomHandlerElement(
        'span',
        {"data-replacements": JSON.stringify(textNode.substitutions)},
        []
      );
      htmlparser2.DomUtils.replaceElement(textNode.node, span);
      htmlparser2.DomUtils.appendChild(span, textNode.node);
    }
  }

  return parsedHtml;
}

function splitTextNode(textNode: DomHandlerText, splitOffsets: number[]): DomHandlerText[] {
  const parentElement = textNode.parent!;
  const childrenArray = Array.from(parentElement.childNodes);
  const nodeIndex: number = childrenArray.indexOf(textNode);

  // Partion textNode into n+1 Text nodes, each containing a substring, with the given splitOffsets.
  let newTextNodes: DomHandlerText[] = [];
  let lengthSoFar = 0;
  for (let i=0; i<splitOffsets.length; i++) {
    const replacementResult = splitText(textNode, splitOffsets[i] - lengthSoFar);
    if (replacementResult) {
      const [insertedTextNode, replacedTextNode] = replacementResult;
      newTextNodes.push(insertedTextNode);
      textNode = replacedTextNode;
      lengthSoFar += insertedTextNode.data?.length ?? 0;
    }
  }
  return [...newTextNodes, textNode];
}

function findStringMultiple(needle: string, haystack: string): number[] {
  const indices: number[] = [];
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    indices.push(index);
    index = haystack.indexOf(needle, index + 1);
  }
  return indices;
}

function applyReplacements(element: React.ReactNode, substitutions: SubstitutionsAttr, replacements: ContentReplacedSubstringComponentInfo[]): React.ReactNode {
  for (const substitution of substitutions) {
    const replacement = replacements[substitution.substitutionIndex];
    const Component = replacementComponentMap[replacement.componentName];
    element = <Component key="replacement" {...replacement.props} isSplitContinuation={substitution.isSplitContinuation}>
      {element}
    </Component>;
  }
  return element;
}

function splitText(textNode: DomHandlerText, splitOffset: number): [DomHandlerText, DomHandlerText]|null {
  const text = textNode.data;
  if (splitOffset > 0 && splitOffset < text.length) {
    const insertedTextNode = new DomHandlerText(text.slice(0, splitOffset));
    htmlparser2.DomUtils.prepend(textNode, insertedTextNode);
    const replacedTextNode = new DomHandlerText(text.slice(splitOffset));
    htmlparser2.DomUtils.replaceElement(textNode, replacedTextNode);
    return [insertedTextNode, replacedTextNode];
  }
  return null;
}
