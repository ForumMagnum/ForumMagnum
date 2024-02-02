import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import withErrorBoundary from '../../common/withErrorBoundary'
import { isServer } from '../../../lib/executionEnvironment';
import { useLocation } from '../../../lib/routeUtil';
import type { ToCSection, ToCSectionWithOffset } from '../../../lib/tableOfContents';
import qs from 'qs'
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import filter from 'lodash/filter';
import { getCurrentSectionMark, ScrollHighlightLandmark, useScrollHighlight } from '../../hooks/useScrollHighlight';
import { useNavigate } from '../../../lib/reactRouterWrapper';
import moment from 'moment';
import { useTimezone } from '../../common/withTimezone';

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

const sectionsHaveOffsets = (sections: ToCSection[]): sections is (ToCSection | ToCSectionWithOffset)[] => {
  return sections.some(section => section.offset !== undefined);
};

const normalizeOffsets = (sections: (ToCSection | ToCSectionWithOffset)[]): ToCSectionWithOffset[] => {
  const titleSection: ToCSectionWithOffset = { ...sections[0], offset: sections[0].offset ?? 0 };

  const remainingSections = sections.slice(1);

  const normalizedSections: ToCSectionWithOffset[] = remainingSections.map((section, idx) => ({
    ...section,
    offset: section.divider ? (1 - (sections[idx].offset ?? 0)) : ((section.offset ?? 0) - (sections[idx].offset ?? 0))
  }));

  return [titleSection, ...normalizedSections];
};

const isRegularClick = (ev: React.MouseEvent) => {
  if (!ev) return false;
  return ev.button===0 && !ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey;
};

const adjustHeadingText = (text: string|undefined, displayOptions?: ToCDisplayOptions) => {
  if (!text) return "";
  if (displayOptions?.downcaseAllCapsHeadings) {
    return downcaseIfAllCaps(text.trim());
  } else {
    return text.trim();
  }
};

const styles = (theme: ThemeType) => ({
  root: {
    left: 0,
    top: 0,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    //Override bottom border of title row for FixedToC but not in other uses of TableOfContentsRow
    '& .TableOfContentsRow-title': {
      borderBottom: "none",
    },
  },
  //Use our PostTitle styling with small caps
  tocTitle: {
    ...theme.typography.postStyle,
    ...theme.typography.smallCaps,
    fontSize: "1.3rem",
    marginTop: 16,
    marginBottom: 8,
  },
  tocPostedAt: {
    color: theme.palette.link.tocLink
  },
})

const FixedPositionToc = ({tocSections, title, postedAt, onClickSection, displayOptions, classes}: {
  tocSections: ToCSection[],
  title: string|null,
  postedAt?: Date,
  onClickSection?: () => void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType<typeof styles>,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { timezone } = useTimezone();
  const { query } = location;

  const [normalizedSections, setNormalizedSections] = useState<ToCSectionWithOffset[]>([]);

  const jumpToAnchor = (anchor: string) => {
    if (isServer) return;

    const anchorY = getAnchorY(anchor);
    if (anchorY !== null) {
      delete query.commentId;
      navigate({
        search: isEmpty(query) ? '' : `?${qs.stringify(query)}`,
        hash: `#${anchor}`,
      });
      let sectionYdocumentSpace = anchorY + window.scrollY;
      jumpToY(sectionYdocumentSpace);
    }
  }

  const { TableOfContentsRow, AnswerTocRow } = Components;

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

  useEffect(() => {
    const postBodyRef = document.getElementById('postBody');
    if (!postBodyRef) return;

    //Get all elements with href corresponding to anchors from the table of contents
    const postBodyBlocks = postBodyRef.querySelectorAll('[id]');
    const sectionHeaders = Array.from(postBodyBlocks).filter(block => filteredSections.map(section => section.anchor).includes(block.getAttribute('id') ?? ''));
    
    const parentContainer = sectionHeaders[0]?.parentElement;
    if (parentContainer) {
      const containerHeight = parentContainer.getBoundingClientRect().height;

      const anchorOffsets = sectionHeaders.map(sectionHeader => ({
        anchorHref: sectionHeader.getAttribute('id'), 
        offset: (sectionHeader as HTMLElement).offsetTop / containerHeight
      }));

      const sectionsWithOffsets = filteredSections.map((section) => {
        const anchorOffset = anchorOffsets.find((anchorOffset) => anchorOffset.anchorHref === section.anchor);
        return {
          ...section,
          offset: anchorOffset?.offset,
        };
      });

      const newNormalizedSections = normalizeOffsets(sectionsWithOffsets);
      if (!isEqual(normalizedSections, newNormalizedSections)) {
        setNormalizedSections(newNormalizedSections);
      }
    }
  }, [filteredSections, normalizedSections]);

  if (!tocSections)
    return <div/>

  return <div className={classes.root}>
    <TableOfContentsRow key="postTitle"
      href="#"
      offset={0}
      onClick={ev => {
        if (isRegularClick(ev)) {
          void handleClick(ev, () => {
            navigate("#");
            jumpToY(0)
          });
        }
      }}
      highlighted={currentSection === "above"}
      title
      fullHeight
    >
      <div className={classes.tocTitle}>
        {title?.trim()}
      </div>
      {postedAt && <div className={classes.tocPostedAt}>
        {moment(new Date(postedAt)).tz(timezone).format("Do MMM YYYY")}
      </div>}
    </TableOfContentsRow>
    
    {normalizedSections.map((section, index) => {
      return (
        <TableOfContentsRow
          key={section.anchor}
          indentLevel={section.level}
          divider={section.divider}
          highlighted={section.anchor === currentSection}
          href={"#"+section.anchor}
          offset={section.offset}
          onClick={(ev) => {
            if (isRegularClick(ev)) {
              void handleClick(ev, () => {
                jumpToAnchor(section.anchor)
              });
            }
          }}
          answer={!!section.answer}
          fullHeight
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


/**
 * Return the screen-space Y coordinate of an anchor. (Screen-space meaning
 * if you've scrolled, the scroll is subtracted from the effective Y
 * position.)
 */
export const getAnchorY = (anchorName: string): number|null => {
  let anchor = window.document.getElementById(anchorName);
  if (anchor) {
    let anchorBounds = anchor.getBoundingClientRect();
    return anchorBounds.top + (anchorBounds.height/2);
  } else {
    return null
  }
}

export const jumpToY = (y: number) => {
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


const FixedPositionTocComponent = registerComponent(
  "FixedPositionToC", FixedPositionToc, {
    hocs: [withErrorBoundary],
    styles
  }
);


/**
 * Returns a shallow copy of the ToC sections with question answers sorted by date,
 * without changing the position of other sections.
 */
const sectionsWithAnswersSorted = (
  sections: ToCSection[],
  sorting: "newest" | "oldest"
) => {
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

declare global {
  interface ComponentTypes {
    FixedPositionToC: typeof FixedPositionTocComponent
  }
}
