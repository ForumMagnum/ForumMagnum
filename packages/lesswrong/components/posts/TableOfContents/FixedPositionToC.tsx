import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import withErrorBoundary from '@/components/common/withErrorBoundary'
import { isServer } from '../../../lib/executionEnvironment';
import type { ToCSection, ToCSectionWithOffsetAndScale } from '../../../lib/tableOfContents';
import qs from 'qs'
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import filter from 'lodash/filter';
import { useScrollHighlight } from '../../hooks/useScrollHighlight';
import { usePostReadProgress } from '../usePostReadProgress';
import { usePostsPageContext } from '../PostsPage/PostsPageContext';
import classNames from 'classnames';
import { ToCDisplayOptions, adjustHeadingText, getAnchorY, isRegularClick, jumpToY } from './TableOfContentsList';
import { HOVER_CLASSNAME } from './MultiToCLayout';
import { getOffsetChainTop } from '@/lib/utils/domUtil';
import { scrollFocusOnElement, ScrollHighlightLandmark } from '@/lib/scrollUtils';
import { isLWorAF } from '@/lib/instanceSettings';
import { useLocation, useNavigate } from "../../../lib/routeUtil";
import { getClassName } from '@/components/hooks/useStyles';
import type { TableOfContentsRowStyles } from './TableOfContentsRow';
import type { TableOfContentsDividerStyles } from './TableOfContentsDivider';

function normalizeToCScale({containerPosition, sections}: {
  sections: ToCSection[]
  containerPosition?: {top: number, bottom: number},
}): ToCSectionWithOffsetAndScale[] {
  // If we have no sections, just return empty array
  if (sections.length === 0) return [];
  
  // Get the total height of the post content
  const containerTop = containerPosition?.top || 0;
  const containerBottom = containerPosition?.bottom || 0;
  const totalContentHeight = containerBottom - containerTop;
  
  // Calculate the gap between container top and first section for proper spacing
  const firstSectionOffset = sections[0].offset || 0;
  const gapToFirstSection = firstSectionOffset - containerTop;
  
  // Create a virtual spacer for the gap at the top if needed because first heading is not at the top of the page
  const titleGapSpacer = {
    title: "",
    anchor: "spacer",
    level: 0,
    offset: containerTop,
    scale: gapToFirstSection > 0 ? gapToFirstSection / totalContentHeight * 100 : 0,
    spacer: true
  };
  
  // For each section (corresponding to a heading), calculate a "scale" that's proportional to its position in the document
  // We will set the flex-grow amount of the corresponding ToC element proportional this value.
  // The scale for an element is calculated by subtracting its own offset from the offset of the next positioned element.
  // However, not every element necessarily has an offset; if an element doesn't have one its vertical scale is 0 (ie it 
  // does not grow past its minimum size), and it's skipped for purposes of deciding what counts as the "next positioned 
  // element". (When we hit the end of the list, we use containerPosition.bottom in place of the next offset)
  const normalizedSections = sections.map((section, idx) => {
    
    // Find the next section with an offset, or use the container bottom
    let nextPositionedIdx = idx+1;
    while (nextPositionedIdx<sections.length && !sections[nextPositionedIdx].offset) {
      nextPositionedIdx++;
    }
    
    const nextSectionOffset = (nextPositionedIdx>=sections.length)
      ? containerPosition?.bottom ?? 0
      : sections[nextPositionedIdx].offset ?? 0;
    
    const sectionHeight = nextSectionOffset - (section.offset ?? 0);
    
    // Scale is the percentage of total content height this section occupies
    const sectionScale = section.divider ? 1 : (sectionHeight / totalContentHeight) * 100;
    
    return {
      ...section,
      offset: section.offset ?? 0,
      scale: sectionScale
    };
  });
  
  // Return with spacer if there's a significant gap before the first heading
  return gapToFirstSection > 50 ? [titleGapSpacer, ...normalizedSections] : normalizedSections;
};

function getSectionsWithOffsets(postContents: HTMLElement, sections: ToCSection[]): ToCSectionWithOffsetAndScale[] {
  // Filter out ToC entries which don't correspond to headings inside the post
  // body. This removes entries for the comment section, answers, and
  // dividers, which are included in the server-side ToC generation and are
  // used in the original ToC, but aren't used in the full-height ToC.
  const postBodyBlocks = Array.from(postContents.querySelectorAll('[id]'));
  const sectionHeaderIds = new Set<string>();
  for (const block of postBodyBlocks) {
    const id = block.getAttribute('id')
    if (id) {
      sectionHeaderIds.add(id);
    }
  }
  const filteredSections = sections.filter(section => sectionHeaderIds.has(section.anchor));

  // Measure the post contents container (distinct from the post body container,
  // in that it doesn't include the title and metadata).
  const containerTop = getOffsetChainTop(postContents);
  const containerHeight = postContents.offsetHeight;

  // Measure the vertical position of each anchor
  const sectionsWithOffsets = filteredSections.map((section) => {
    const anchor = document.getElementById(section.anchor);
    if (anchor) {
      return {
        ...section,
        offset: getOffsetChainTop(anchor),
      };
    } else {
      return section;
    }
  });
  
  // Using the vertical positions, compute scale factors
  return normalizeToCScale({
    sections: sectionsWithOffsets,
    containerPosition: {top: containerTop, bottom: containerTop+containerHeight},
  });
}

const styles = (theme: ThemeType) => ({
  root: {
    left: 0,
    top: 0,
    maxHeight: '100vh',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 22,
    //Override bottom border of title row for FixedToC but not in other uses of TableOfContentsRow
    [`& .${getClassName<TableOfContentsRowStyles>("TableOfContentsRow", "title")}`]: {
      borderBottom: "none",
    },
    wordBreak: 'break-word',
    transition: 'opacity .25s ease-in-out 0.5s, transform .5s ease-in-out 0.5s, height 0.4s ease-in-out, max-height 0.4s ease-in-out',
  },
  hover: {
    '& $rowOpacity': {
      opacity: 1,
    },
    '& $headingOpacity': {
      opacity: 1,
    },
    '& $tocTitle': {
      opacity: 1,
    }
  },
  rowWrapper: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
  },
  rowOpacity: {
    transition: '.25s',
    opacity: 0,
  },
  headingOpacity: {
    transition: '.25s',
    opacity: 0,
  },
  rowDotContainer: {
    display: "flex",
    alignItems: "center"
  },
  rowDot: {
    fontSize: 9,
    height: 9,
    background: theme.palette.background.pageActiveAreaBackground,
    marginLeft: 2,
    marginRight: 8,
    zIndex: 1,
    color: theme.palette.grey[700]
  },
  tocWrapper: {
    marginLeft: 13,
  },
  //Use our PostTitle styling with small caps
  tocTitle: {
    ...theme.typography.postStyle,
    ...theme.typography.smallCaps,
    fontSize: "1.3rem",
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexGrow: 1,
  },
  progressBarContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    '--scrollAmount': '0%',
    marginRight: -4,
    marginBottom: 0,
    width: 1,
    background: theme.palette.grey[400],
    overflowY: 'clip',
  },
  progressBar: {
    flex: 'var(--scrollAmount)',
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8
    },
    "&:after": {
      content: "''",
      marginLeft: -0.5,
      paddingLeft: 2,
      alignSelf: 'end',
      height: 'var(--windowHeight)',
      background: theme.palette.grey[600],
    }
  },
  unfilledProgressBar: {
    width: 1,
    flex: 'calc(100% - var(--scrollAmount))',
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8
    },
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    [`& .${getClassName<TableOfContentsDividerStyles>("TableOfContentsDivider", "divider")}`]: {
      marginLeft: 4,
    },
  },
});

const FixedPositionToc = ({tocSections, title, heading, onClickSection, displayOptions, classes, hover}: {
  tocSections: ToCSection[],
  title: string|null,
  heading?: React.ReactNode,
  onClickSection?: () => void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType<typeof styles>,
  hover?: boolean,
}) => {
  const { TableOfContentsRow, AnswerTocRow } = Components;

  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;

  const [normalizedSections, setNormalizedSections] = useState<ToCSectionWithOffsetAndScale[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const postContext = usePostsPageContext()?.fullPost;
  const disableProgressBar = ((!isLWorAF && !postContext) || isServer || postContext?.shortform);

  const { readingProgressBarRef } = usePostReadProgress({
    updateProgressBar: (element, scrollPercent) => element.style.setProperty("--scrollAmount", `${scrollPercent}%`),
    disabled: disableProgressBar || !hasLoaded,
    setScrollWindowHeight: (element, height) => element.style.setProperty("--windowHeight", `${height}px`)
  });

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

      // This is forum-gating of a fairly subtle change in scroll behaviour, LW may want to adopt scrollFocusOnElement
      if (!isLWorAF) {
        scrollFocusOnElement({ id: anchor, options: {behavior: "smooth"}})
      } else {
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

  // Filter out answers in the full-height ToC, along with the section heading and divider (which are only present if there's at least one answer)
  if (filteredSections.some(section => section.answer)) {
    filteredSections = filteredSections.filter(section => !['answers', 'postAnswersDivider'].includes(section.anchor) && !section.answer);
  }
  
  const { landmarkName: currentSection } = useScrollHighlight([
    ...filteredSections
      .filter(section => !section.spacer)
      .map((section): ScrollHighlightLandmark => ({
        landmarkName: section.anchor,
        elementId: section.anchor,
        position: "centerOfElement",
      })),
    {
      landmarkName: "comments",
      elementId: "postBody",
      position: "bottomOfElement",
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

  useEffect(() => {
    void (async () => {
      await waitForAllPostImagesToLoad();
      setHasLoaded(true);
    })();
  }, [])

  useEffect(() => {
    const postContent = document.getElementById('postContent') ?? document.getElementById('tagContent');
    if (!postContent) return;
    const newNormalizedSections = getSectionsWithOffsets(postContent, filteredSections);

    if (!isEqual(normalizedSections, newNormalizedSections)) {
      setNormalizedSections(newNormalizedSections);
    }
  }, [filteredSections, normalizedSections, hasLoaded]);

  const titleRow = (
    <div className={classes.rowWrapper} key={"#"}>
      <div className={classes.rowDotContainer}>
        <span className={classNames(HOVER_CLASSNAME, classes.rowOpacity, classes.tocWrapper)}>
          <TableOfContentsRow
            indentLevel={1}
            key="postTitle"
            href="#"
            scale={0}
            fullHeight
            highlighted={currentSection === "above"}
            onClick={ev => {
              if (isRegularClick(ev)) {
                void handleClick(ev, () => {
                  navigate("#");
                  jumpToY(0)
                });
              }
            }}
          >
            <div className={classes.tocTitle}>
              {title?.trim()}
            </div>
          </TableOfContentsRow>
        </span>
      </div>
    </div>
  );
  
  const renderedSections = normalizedSections.filter(row => (!row.divider && row.anchor !== "comments") || row.spacer);

  const rows = renderedSections.map((section, index) => {
    const scaleStyling = section.scale !== undefined ? { flex: section.scale } : undefined;

    // If this is just a spacer, render only the space without a dot or label
    if (section.spacer) {
      return (
        <div className={classes.rowWrapper} style={scaleStyling} key={section.anchor}>
          {/* Empty div for spacing */}
        </div>
      );
    }

    const tocRow = (
      <TableOfContentsRow
        indentLevel={section.level}
        divider={section.divider}
        href={"#"+section.anchor}
        scale={section.scale}
        highlighted={section.anchor === currentSection}
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

    return (
      <div className={classes.rowWrapper} style={scaleStyling} key={section.anchor}>
        <div className={classes.rowDotContainer}>
          <div className={classes.rowDot}>•</div>
          <span className={classNames(classes.rowOpacity, HOVER_CLASSNAME)}>
            {tocRow}
          </span>
        </div>
      </div>
    )
  });

  if (!tocSections || !hasLoaded)
    return <div/>

  return <div className={classNames(classes.root, { [classes.hover]: hover })}>
    <div className={classes.wrapper}>
      <div className={classes.progressBarContainer} ref={readingProgressBarRef}>
        <div className={classes.progressBar} />
        <div className={classes.unfilledProgressBar}/>
      </div>
      <div className={classes.rows}>
        {titleRow}
        <div className={classNames(HOVER_CLASSNAME, classes.headingOpacity)}>
          {heading}
        </div>
        {rows}
      </div>
    </div>
  </div>
}

async function waitForAllPostImagesToLoad() {
  const postBody = document.getElementById('postBody');
  if (!postBody) return;
  const postImages = Array.from(postBody.getElementsByTagName('img'));

  for (const imageTag of postImages) {
    if (!imageTag.complete) {
      await waitForImageToLoad(imageTag);
    }
  }
}

function waitForImageToLoad(imageTag: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    if (imageTag.complete) {
      resolve();
      return;
    }
    
    function onImageLoaded(this: HTMLImageElement) {
      imageTag.removeEventListener("load", onImageLoaded);
      resolve();
    }
    imageTag.addEventListener("load", onImageLoaded);
  });
}

const FixedPositionTocComponent = registerComponent(
  "FixedPositionToC", FixedPositionToc, {
    hocs: [withErrorBoundary],
    styles
  }
);

declare global {
  interface ComponentTypes {
    FixedPositionToC: typeof FixedPositionTocComponent
  }
}
