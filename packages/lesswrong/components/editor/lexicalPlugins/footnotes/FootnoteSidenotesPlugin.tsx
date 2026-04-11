import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useStyles } from '@/components/hooks/useStyles';
import type { ContentStyleType } from '@/components/common/ContentStylesValues';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import { SideItem, useHasSideItemsSidebar, useSideItemsFocus, scrollSideItemAnchorIntoViewIfNeeded } from '@/components/contents/SideItems';
import {
  FOOTNOTE_ATTRIBUTES,
  FOOTNOTE_CLASSES,
} from './constants';
import {
  FootnoteAncestorsContext,
  footnotePreviewStyles,
} from '@/components/linkPreview/FootnotePreview';
import { useIsAboveBreakpoint } from '@/components/hooks/useScreenWidth';

type LexicalFootnoteSidenote = {
  key: string,
  anchorEl: HTMLElement,
  footnoteHref: string,
  footnoteHTML: string,
  footnoteIndex: string|null,
};

function isInteractiveClickTarget(target: EventTarget|null): boolean {
  return target instanceof Element
    && !!target.closest('a, button, input, textarea, select, [role="button"]');
}

function isFootnoteContentsNonempty(footnoteContentsElement: Element): boolean {
  return !!Array.from(footnoteContentsElement.querySelectorAll('p, li'))
    .reduce((acc, p) => acc + p.textContent, '')
    .trim();
}

function getFootnoteContentElement(rootElement: HTMLElement, footnoteId: string): HTMLElement|null {
  const footnoteElement = rootElement.ownerDocument.getElementById(`fn${footnoteId}`);
  if (!(footnoteElement instanceof HTMLElement) || !rootElement.contains(footnoteElement)) {
    return null;
  }
  const footnoteContentElement = footnoteElement.querySelector(`.${FOOTNOTE_CLASSES.footnoteContent}`);
  return footnoteContentElement instanceof HTMLElement ? footnoteContentElement : null;
}

function collectSidenotes(rootElement: HTMLElement): LexicalFootnoteSidenote[] {
  const references = Array.from(rootElement.querySelectorAll<HTMLElement>(
    `.${FOOTNOTE_CLASSES.footnoteReference}[${FOOTNOTE_ATTRIBUTES.footnoteId}]`
  ));
  return references.flatMap((referenceEl, index) => {
    const footnoteId = referenceEl.getAttribute(FOOTNOTE_ATTRIBUTES.footnoteId);
    if (!footnoteId) {
      return [];
    }
    const footnoteContentElement = getFootnoteContentElement(rootElement, footnoteId);
    if (!footnoteContentElement || !isFootnoteContentsNonempty(footnoteContentElement)) {
      return [];
    }
    return [{
      key: `${footnoteId}:${index}`,
      anchorEl: referenceEl,
      footnoteHref: `#fn${footnoteId}`,
      footnoteHTML: footnoteContentElement.outerHTML,
      footnoteIndex: referenceEl.getAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex),
    }];
  });
}

function sidenotesAreEqual(
  previous: LexicalFootnoteSidenote[],
  next: LexicalFootnoteSidenote[],
): boolean {
  if (previous.length !== next.length) {
    return false;
  }
  for (let i = 0; i < previous.length; i++) {
    if (
      previous[i].key !== next[i].key ||
      previous[i].anchorEl !== next[i].anchorEl ||
      previous[i].footnoteHref !== next[i].footnoteHref ||
      previous[i].footnoteHTML !== next[i].footnoteHTML ||
      previous[i].footnoteIndex !== next[i].footnoteIndex
    ) {
      return false;
    }
  }
  return true;
}

const LexicalFootnoteSidenoteItem = ({
  sidenote,
  contentStyleType,
}: {
  sidenote: LexicalFootnoteSidenote,
  contentStyleType: ContentStyleType,
}) => {
  const classes = useStyles(footnotePreviewStyles);
  const [hovered, setHovered] = useState(false);
  const setFocusedAnchor = useSideItemsFocus();
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isInteractiveClickTarget(event.target)) {
      return;
    }
    // Align this sidenote with its footnote reference in the text. When
    // inline comments or other sidenotes push this sidenote down, focusing
    // the anchor tells the SideItems sidebar to position this sidenote at
    // its anchor's vertical position and cascade the rest. Then scroll the
    // anchor reference into view if it's currently off-screen so the
    // alignment is actually visible.
    if (setFocusedAnchor) {
      setFocusedAnchor(sidenote.anchorEl);
    }
    scrollSideItemAnchorIntoViewIfNeeded(sidenote.anchorEl);
  };

  return (
    <SideItem anchorEl={sidenote.anchorEl} options={{offsetTop: -6}}>
      <div
        className={classNames(
          classes.sidenote,
          hovered && classes.sidenoteHover,
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
      >
        <FootnoteAncestorsContext.Provider value={[sidenote.footnoteHref]}>
          <ContentStyles contentType={contentStyleType}>
            <span className={classes.sidenoteWithIndex}>
              {sidenote.footnoteIndex && <span className={classes.sidenoteIndex}>
                {sidenote.footnoteIndex}.
              </span>}
              <div className={classes.sidenoteContent}>
                <ContentItemBody dangerouslySetInnerHTML={{__html: sidenote.footnoteHTML}} />
                <div className={classes.overflowFade} />
              </div>
            </span>
          </ContentStyles>
        </FootnoteAncestorsContext.Provider>
      </div>
    </SideItem>
  );
};

export const FootnoteSidenotesPlugin = ({
  contentStyleType = 'postHighlight',
}: {
  contentStyleType?: ContentStyleType,
}) => {
  const [editor] = useLexicalComposerContext();
  const [sidenotes, setSidenotes] = useState<LexicalFootnoteSidenote[]>([]);
  const hasSideItemsSidebar = useHasSideItemsSidebar();
  const screenIsWideEnoughForSidenotes = useIsAboveBreakpoint('lg');
  const shouldShowSidenotes = hasSideItemsSidebar && screenIsWideEnoughForSidenotes;

  useEffect(() => {
    if (!shouldShowSidenotes) {
      setSidenotes((prev) => prev.length ? [] : prev);
      return;
    }

    const refreshFromDom = () => {
      const rootElement = editor.getRootElement();
      if (!rootElement) {
        setSidenotes((prev) => prev.length ? [] : prev);
        return;
      }
      const nextSidenotes = collectSidenotes(rootElement);
      setSidenotes((prev) => sidenotesAreEqual(prev, nextSidenotes) ? prev : nextSidenotes);
    };

    refreshFromDom();
    return mergeRegister(
      editor.registerUpdateListener(() => {
        refreshFromDom();
      }),
      editor.registerRootListener(() => {
        refreshFromDom();
      }),
    );
  }, [editor, shouldShowSidenotes]);

  if (!shouldShowSidenotes) {
    return null;
  }

  return <>
    {sidenotes.map((sidenote) => (
      <LexicalFootnoteSidenoteItem
        key={sidenote.key}
        sidenote={sidenote}
        contentStyleType={contentStyleType}
      />
    ))}
  </>;
};
