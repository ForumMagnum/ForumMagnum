import React, { useState, useEffect } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import withErrorBoundary from '../../common/withErrorBoundary'
import { isServer } from '../../../lib/executionEnvironment';
import type { ToCData, ToCSection } from '../../../lib/tableOfContents';
import qs from 'qs'
import isEmpty from 'lodash/isEmpty';
import filter from 'lodash/filter';
import { useScrollHighlight } from '../../hooks/useScrollHighlight';
import { getCurrentSectionMark, scrollFocusOnElement, ScrollHighlightLandmark } from '@/lib/scrollUtils';
import { isLWorAF } from '@/lib/instanceSettings';
import { useLocation, useNavigate } from "../../../lib/routeUtil";
import { TableOfContentsRow } from "./TableOfContentsRow";
import { AnswerTocRow } from "./AnswerTocRow";

export interface ToCDisplayOptions {
  /**
   * Convert section titles from all-caps to title-case. Used for the Concepts page
   * where the LW version has all-caps section headings as a form of bolding.
   */
  downcaseAllCapsHeadings?: boolean
  
  /**
   * Don't show sections nested below a certain depth. Used on the LW version of the
   * Concepts page, where there would otherwise be section headings for subcategories
   * of the core tags, resulting in a ToC that's overwhelmingly big.
   */
  maxHeadingDepth?: number
  
  /**
   * Extra rows to add to the bottom of the ToC. You'll want to use this instead of
   * adding extra React components after the ToC if those rows have corresponding
   * anchors and should be highlighted based on scroll position.
   */
  addedRows?: ToCSection[],
}

const topSection = "top";

const TableOfContentsListInner = ({tocSections, title, onClickSection, displayOptions}: {
  tocSections: ToCSection[],
  title: string|null,
  onClickSection?: () => void,
  displayOptions?: ToCDisplayOptions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;

  const jumpToAnchor = (anchor: string) => {
    if (isServer) return;

    const anchorY = getAnchorY(anchor);
    if (anchorY !== null) {
      delete query.commentId;
      navigate({
        search: isEmpty(query) ? '' : `?${qs.stringify(query)}`,
        hash: `#${anchor}`,
      });

      // This is forum-gating of a fairly subtle change in scroll behaviour, LW may want to adopt scrollFocusOnElement
      if (!isLWorAF) {
        scrollFocusOnElement({ id: anchor, options: {behavior: "smooth"}})
      } else {
        let sectionYdocumentSpace = anchorY + window.scrollY;
        jumpToY(sectionYdocumentSpace);
      }
    }
  }
  let filteredSections = (displayOptions?.maxHeadingDepth && tocSections)
    ? filter(tocSections, s=>s.level <= displayOptions.maxHeadingDepth!)
    : tocSections;

  if (displayOptions?.addedRows) {
    filteredSections = [...filteredSections, ...displayOptions.addedRows];
  }
  
  const { landmarkName: currentSection } = useScrollHighlight([
    ...filteredSections.map((section): ScrollHighlightLandmark => ({
      landmarkName: section.anchor,
      elementId: section.anchor,
      position: "centerOfElement"
    })),
    {
      landmarkName: "comments",
      elementId: "postBody",
      position: "bottomOfElement"
    },
  ]);

  if (!tocSections)
    return <div/>

  const handleClick = async (ev: React.SyntheticEvent, jumpToSection: () => void): Promise<void> => {
    ev.preventDefault();
    if (onClickSection) {
      onClickSection();
      // One of the things this callback can do is expand folded-up text which
      // might contain the anchor we want to scroll to. We wait for a setTimeout
      // here, to allow React re-rendering to finish in that case.
      await new Promise((resolve,reject) => setTimeout(resolve, 0));
    }
    jumpToSection();
  }

  // Since the Table of Contents data is sent as part of the post data and
  // partially generated from the post html, changing the answers ordering
  // in the ToC is not trivial to do via a graphql query.
  // Separating the ToC part with answers would require some refactoring,
  // but for now we can just sort the answers client side.
  const answersSorting = query?.answersSorting;
  if (answersSorting === "newest" || answersSorting === "oldest") {
    filteredSections = sectionsWithAnswersSorted(filteredSections, answersSorting);
  }

  return <div>
    <TableOfContentsRow key="postTitle"
      href="#"
      onClick={ev => {
        if (isRegularClick(ev)) {
          void handleClick(ev, () => {
            navigate("#");
            jumpToY(0)
          });
        }
      }}
      highlighted={currentSection === "above" || currentSection === null}
      title
    >
      {title?.trim()}
    </TableOfContentsRow>
    
    {filteredSections.map((section, index) => {
      return (
        <TableOfContentsRow
          key={section.anchor}
          indentLevel={section.level}
          divider={section.divider}
          highlighted={section.anchor === currentSection}
          href={"#"+section.anchor}
          onClick={(ev) => {
            if (isRegularClick(ev)) {
              void handleClick(ev, () => {
                jumpToAnchor(section.anchor)
              });
            }
          }}
          answer={!!section.answer}
        >
          {section.answer
            ? <AnswerTocRow answer={section.answer} />
            : <span>{adjustHeadingText(section.title)}</span>
          }
        </TableOfContentsRow>
      )
    })}
  </div>
}

export function isRegularClick(ev: React.MouseEvent) {
  if (!ev) return false;
  return ev.button===0 && !ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey;
}

/**
 * Return the screen-space Y coordinate of an anchor. (Screen-space meaning
 * if you've scrolled, the scroll is subtracted from the effective Y
 * position.)
 */
export function getAnchorY(anchorName: string): number|null {
  let anchor = window.document.getElementById(anchorName);
  if (anchor) {
    let anchorBounds = anchor.getBoundingClientRect();
    return anchorBounds.top + (anchorBounds.height/2);
  } else {
    return null
  }
}

export function jumpToY(y: number) {
  if (isServer) return;

  try {
    window.scrollTo({
      top: y - getCurrentSectionMark() + 1,
      behavior: "smooth"
    });
  } catch(e) {
    // eslint-disable-next-line no-console
    console.warn("scrollTo not supported, using link fallback", e)
  }
}


/**
 * Returns a shallow copy of the ToC sections with question answers sorted by date,
 * without changing the position of other sections.
 */
export function sectionsWithAnswersSorted(
  sections: ToCSection[],
  sorting: "newest" | "oldest"
) {
  const answersSectionsIndexes = sections
    .map((section, index) => [section, index] as const)
    .filter(([section, _]) => !!section.answer);
  const originalIndexes = answersSectionsIndexes.map(([_, originalIndex]) => originalIndex);
  const answersSections = answersSectionsIndexes.map(([section, _]) => section);

  const sign = sorting === "newest" ? 1 : -1;
  answersSections.sort((section1, section2) => {
    const value1 = section1.answer?.postedAt || "";
    const value2 = section2.answer?.postedAt || "";
    if (value1 < value2) { return sign; }
    if (value1 > value2) { return -sign; }
    return 0;
  });

  const sortedSections = [...sections];
  for (let [i, section] of answersSections.entries()) {
    sortedSections[originalIndexes[i]] = section;
  }
  return sortedSections;
};

function downcaseIfAllCaps(text: string) {
  // If already mixed-case, don't do anything
  if (text !== text.toUpperCase())
    return text;
  
  // Split on spaces, downcase everything except the first character of each token
  const tokens = text.split(' ');
  const downcaseToken = (tok: string) => {
    if (tok.length > 1) {
      return tok.substr(0,1) + tok.substr(1).toLowerCase();
    } else {
      return tok;
    }
  }
  return tokens.map(tok => downcaseToken(tok)).join(' ');
}

export function adjustHeadingText(text: string|undefined, displayOptions?: ToCDisplayOptions) {
  if (!text) return "";
  if (displayOptions?.downcaseAllCapsHeadings) {
    return downcaseIfAllCaps(text.trim());
  } else {
    return text.trim();
  }
}

export const TableOfContentsList = registerComponent(
  "TableOfContentsList", TableOfContentsListInner, {
    hocs: [withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    TableOfContentsList: typeof TableOfContentsList
  }
}
