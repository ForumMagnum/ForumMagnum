import React, { useEffect, useImperativeHandle, useRef, type CSSProperties } from 'react';
import { addNofollowToHTML, type ContentItemBodyProps } from '../common/ContentItemBody';
import * as htmlparser2 from "htmlparser2";
import { type ChildNode } from 'domhandler';
import { Components } from '@/lib/vulcan-lib/components';
import pick from 'lodash/pick';

type PassedThroughContentItemBodyProps = Pick<ContentItemBodyProps, "description"|"noHoverPreviewPrefetch"|"nofollow"|"contentStyleType">

/**
 * Renders user-generated HTML, with progressive enhancements. Replaces
 * ContentItemBody, by parsing and recursing through an HTML parse tree rather
 * than doing post-mount modifications.
 *
 * Functionality from ContentItemBody which is supported:
 *   markHoverableLinks
 * Functionality from ContentItemBody which is not yet implemented:
 *   markScrollableBlocks
 *   markConditionallyVisibleBlocks
 *   addHorizontalScrollIndicators
 *   collapseFootnotes
 *   markElicitBlocks
 *   wrapStrawPoll
 *   addCTAButtonEventListeners
 *   replaceForumEventPollPlaceholders
 *   replaceSubstrings
 *   applyIdInsertions
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
export const ContentItemBody2 = (props: ContentItemBodyProps) => {
  const { onContentReady, nofollow, dangerouslySetInnerHTML, className, ref } = props;
  const bodyRef = useRef<HTMLDivElement>(null);
  const html = (nofollow
    ? addNofollowToHTML(dangerouslySetInnerHTML.__html)
    : dangerouslySetInnerHTML.__html
  );
  const parsedHtml = htmlparser2.parseDocument(html);

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
  
  const passedThroughProps = pick(props, ["description", "noHoverPreviewPrefetch", "nofollow", "contentStyleType"]);
  
  return <div className={className} ref={bodyRef}>
    {parsedHtml.childNodes.map((child,i) => <ContentItemBodyInner
      key={i}
      parsedHtml={child}
      passedThroughProps={passedThroughProps}
    />)}
  </div>
}

const ContentItemBodyInner = ({parsedHtml, passedThroughProps}: {
  parsedHtml: ChildNode,
  passedThroughProps: PassedThroughContentItemBodyProps
}) => {
  switch (parsedHtml.type) {
    case htmlparser2.ElementType.CDATA:
    case htmlparser2.ElementType.Directive:
    case htmlparser2.ElementType.Root:
    case htmlparser2.ElementType.Script:
    case htmlparser2.ElementType.Style:
      return null;

    case htmlparser2.ElementType.Tag:
      const TagName = parsedHtml.tagName as any;
      const attribs = translateAttribs(parsedHtml.attribs);
      const mappedChildren = parsedHtml.childNodes.map((c,i) => <ContentItemBodyInner
        key={i}
        parsedHtml={c}
        passedThroughProps={passedThroughProps}
      />)
      
      if (TagName === 'a') {
        return <Components.HoverPreviewLink
          href={attribs.href}
          {...passedThroughProps}
          {...attribs}
        >
          {mappedChildren}
        </Components.HoverPreviewLink>
      } else if (parsedHtml.childNodes.length > 0) {
        return <TagName
          {...attribs}
        >
          {mappedChildren}
        </TagName>
      } else {
        return <TagName
          {...attribs}
        />
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
 * a string that needs to be converted into `CSSProperties` (a k-v dict).
 *
 * This is NOT a sanitization/validation function. The expectation is that the
 * HTML was validated before it was passed to ContentItemBody and parsed.
 */
function translateAttribs(attribs: Record<string,string>): Record<string,any> {
  if ('style' in attribs) {
    return {
      ...attribs,
      style: parseInlineStyle(attribs.style),
    };
  } else {
    return attribs;
  }
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
