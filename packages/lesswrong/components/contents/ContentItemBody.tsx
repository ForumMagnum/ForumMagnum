import React, { useContext, useEffect, useImperativeHandle, useMemo, useRef, type CSSProperties } from 'react';
import { addNofollowToHTML, ContentReplacedSubstringComponentInfo, replacementComponentMap, type ContentItemBodyProps } from './contentBodyUtil';
import * as htmlparser2 from "htmlparser2";
import { type ChildNode as DomHandlerChildNode, type Node as DomHandlerNode, Element as DomHandlerElement, Text as DomHandlerText } from 'domhandler';
import pick from 'lodash/pick';
import { MaybeScrollableBlock } from './HorizScrollBlock';
import HoverPreviewLink from '../linkPreview/HoverPreviewLink';
import uniq from 'lodash/uniq';
import { ConditionalVisibilitySettings } from '../editor/conditionalVisibilityBlock/conditionalVisibility';
import ConditionalVisibilityBlockDisplay from '../editor/conditionalVisibilityBlock/ConditionalVisibilityBlockDisplay';
import ElicitBlock from './ElicitBlock';
import { hasCollapsedFootnotes } from '@/lib/betas';
import { CollapsedFootnotes } from './CollapsedFootnotes';
import { WrappedStrawPoll } from './WrappedStrawPoll';
import { validateUrl } from '@/lib/vulcan-lib/utils';
import { useTracking } from '@/lib/analyticsEvents';
import ForumEventPostPagePollSection from '../forumEvents/ForumEventPostPagePollSection';
import repeat from 'lodash/repeat';
import { captureException } from '@sentry/core';
import { colorReplacements } from '@/themes/userThemes/darkMode';
import { colorToString, invertColor, parseColor } from '@/themes/colorUtil';
import mapValues from 'lodash/mapValues';
import { ThemeContext, useThemeOptions } from '../themes/useTheme';

type PassedThroughContentItemBodyProps = Pick<ContentItemBodyProps, "description"|"noHoverPreviewPrefetch"|"nofollow"|"contentStyleType"|"replacedSubstrings"|"idInsertions"> & {
  themeName: UserThemeSetting,
  bodyRef: React.RefObject<HTMLDivElement|null>,
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
  const themeContext = useContext(ThemeContext)
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
  
  const passedThroughProps: PassedThroughContentItemBodyProps = {
    ...pick(props, ["description", "noHoverPreviewPrefetch", "nofollow", "contentStyleType", "replacedSubstrings", "idInsertions"]),
    themeName: themeContext!.abstractThemeOptions.name,
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
  const { replacedSubstrings, themeName } = passedThroughProps;
  const { captureEvent } = useTracking();
  
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
      let TagName = parsedHtml.tagName.toLowerCase() as any;
      if (TagName === 'html' || TagName === 'body' || TagName === 'head') {
        TagName = 'div';
      }
      const attribs = translateAttribs(parsedHtml.attribs);
      const id = attribs.id;
      const classNames = parsedHtml.attribs.class?.split(' ') ?? [];

      let mappedChildren: React.ReactNode[] = parsedHtml.childNodes.map((c,i) => <ContentItemBodyInner
        key={i}
        parsedHtml={c}
        passedThroughProps={passedThroughProps}
      />)

      if (classNames.includes("footnotes") && hasCollapsedFootnotes) {
        return <CollapsedFootnotes attributes={attribs} footnoteElements={mappedChildren}/>
      }

      if (attribs["style"]) {
        const transformedStyle = transformStylesForDarkMode(attribs["style"], themeName);
        attribs["style"] = transformedStyle;
      }

      if (attribs['data-replacements'] && replacedSubstrings) {
        const substitutions = (JSON.parse(attribs['data-replacements']) as SubstitutionsAttr);
        return [applyReplacements(<>
          {mappedChildren}
        </>, substitutions, replacedSubstrings)];
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
        result = <WrappedStrawPoll>
          {result}
        </WrappedStrawPoll>
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

  // These two are used in the custom Bayes Rule Guide html.
  // Using `new Function` seemed safer than `eval`.
  if ('onclick' in attribsCopy) {
    try {
      attribsCopy.onClick = new Function(attribsCopy.onclick);
      delete attribsCopy.onclick;  
    } catch (e) {
      captureException(`Error parsing onclick attribute in ContentItemBody.  Original function string: ${attribsCopy.onclick}.  Error: ${e.message}`);
      // eslint-disable-next-line no-console
      console.error('Error parsing onclick attribute', e);
    }
  }
  if ('onchange' in attribsCopy) {
    try {
      attribsCopy.onChange = new Function(attribsCopy.onchange);
      delete attribsCopy.onchange;  
    } catch (e) {
      captureException(`Error parsing onchange attribute in ContentItemBody.  Original function string: ${attribsCopy.onchange}.  Error: ${e.message}`);
      // eslint-disable-next-line no-console
      console.error('Error parsing onchange attribute', e);
    }
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
  "for": "htmlFor",
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
  //
  // Insert virtual text nodes containing newlines between block and list
  // elements (p, h1, h2...h6, ol, ul, li, img, ...). traverse() returns the
  // minimum number of newlines that should separate it from any sibling above
  // and below.
  type AnnotatedTextNode = {
    node: DomHandlerText|null,
    str: string,
  };
  type AnnotatedTextNodeWithOffset = AnnotatedTextNode & {
    offset: number
  };
  function traverse(node: DomHandlerChildNode): {
    textNodes: AnnotatedTextNode[],
    separationAbove: number,
    separationBelow: number
  } {
    switch (node.type) {
      case htmlparser2.ElementType.Text:
        const textNode = node;
        const str = textNode.data ?? "";
        return {
          textNodes: [{
            node: textNode,
            str,
          }],
          separationAbove: 0,
          separationBelow: 0,
        }
      case htmlparser2.ElementType.Root:
      case htmlparser2.ElementType.Tag: {
        // Recurse
        const annotatedChildNodes = node.childNodes.map(n => traverse(n));

        // Separation above/below is the greater of the separation created by
        // this tag, and the separation created by its first/last child.
        const thisTagSeparation = (node.type === htmlparser2.ElementType.Tag)
          ? tagNameToNewlineCount(node.tagName.toLowerCase())
          : 0;
        const separationAbove = Math.max(thisTagSeparation, annotatedChildNodes[0]?.separationAbove ?? 0);
        const separationBelow = Math.max(thisTagSeparation, annotatedChildNodes[annotatedChildNodes.length-1]?.separationBelow ?? 0);
        
        // Insert separators between nodes
        const nodesWithSeparators: AnnotatedTextNode[] = [];
        for (let i=0; i<annotatedChildNodes.length; i++) {
          const annotatedChildNode = annotatedChildNodes[i];
          if (i>0) {
            let separation = Math.max(annotatedChildNode.separationAbove, annotatedChildNodes[i-1].separationBelow);
            if (separation > 0) {
              nodesWithSeparators.push({
                node: null,
                str: repeat('\n', separation),
              });
            }
          }
          nodesWithSeparators.push(...annotatedChildNode.textNodes);
        }
        
        return {
          textNodes: nodesWithSeparators,
          separationAbove,
          separationBelow,
        };
      }
      default:
        return {
          textNodes: [],
          separationAbove: 0,
          separationBelow: 0,
        };
    }
  }
  const textNodesWithSeparators: AnnotatedTextNode[] = traverse(parsedHtml).textNodes;
  const textNodesWithOffsets: AnnotatedTextNodeWithOffset[] = [];
  let currentOffset = 0;
  for (const textNode of textNodesWithSeparators) {
    textNodesWithOffsets.push({
      ...textNode,
      offset: currentOffset,
    });
    currentOffset += textNode.str.length;
  }
  const combinedText = textNodesWithOffsets.map(t => t.str).join("");

  // Locate replacements in the combined string, as offsets (or null if not present).
  const replacementRanges: Array<{ startOffset: number, endOffset: number, replacementIndex: number }> =
    replacedSubstrings.flatMap((replacedSubstring, i) => {
      // Trim, and remove any \r (sometimes this has CRLF when it should just be LF)
      const replacedString = replacedSubstring.replacedString.trim().replace(/\r/g, '');
      if (replacedSubstring.replace === 'first') {
        const idx = combinedText.indexOf(replacedString)
        if (idx < 0) return [];
        return [{
          startOffset: idx,
          endOffset: idx + replacedString.length,
          replacementIndex: i,
        }];
      } else {
        const indices = findStringMultiple(replacedString, combinedText);
        return indices.map(idx => ({
          startOffset: idx,
          endOffset: idx + replacedString.length,
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
  for (const textNode of textNodesWithOffsets) {
    // Spacers can't be split (and also the start/end of a substitution will
    // never land on one because substitutions are trimmed)
    if (!textNode.node) {
      continue;
    }
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

function tagNameToNewlineCount(tagName: string): number {
  switch (tagName) {
    case "p":
    case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
      return 2;
    case "ul": case "ol": case "li":
    case "div":
      return 1;
    default:
      return 0;
  }
}

function splitTextNode(textNode: DomHandlerText, splitOffsets: number[]): DomHandlerText[] {
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

const attributesNeedingTransform: Record<string,boolean> = {
  "background": true,
  "backgroundColor": true,
  "borderColor": true,
};

function transformStylesForDarkMode(styles: Record<string,string>, themeName: UserThemeSetting): Record<string,string> {
  if (themeName === 'dark' || themeName === 'auto') {
    return Object.fromEntries(Object.entries(styles).map(([attribute,value]) => {
      if (attributesNeedingTransform[attribute]) {
        const darkModeValue = transformAttributeValueForDarkMode(value)
        if (themeName === "auto" && darkModeValue !== value) {
          return [attribute, `light-dark(${value},${darkModeValue})`];
        } else {
          return [attribute, darkModeValue];
        }
      } else {
        return [attribute, value];
      }
    }));
  } else {
    return styles;
  }
}

function transformAttributeValueForDarkMode(attributeValue: string): string {
  const normalized = attributeValue.trim().toLowerCase();
  if (!colorReplacements[normalized]) {
    const parsedColor = parseColor(normalized);
    if (parsedColor) {
      const invertedColor = invertColor(parsedColor);
      colorReplacements[normalized] = colorToString(invertedColor);
    } else {
      // If unable to parse a color (eg an unsupported color format), use black
      // as a safe dark-mode background color
      colorReplacements[normalized] = "#000000";
    }
  }
  
  if (colorReplacements[normalized]) {
    return colorReplacements[normalized];
  } else {
    return attributeValue;
  }
}
