import React, { useContext, useEffect, useState } from 'react';
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
import { usePostReadProgress } from '../usePostReadProgress';
import { usePostsPageContext } from '../PostsPage/PostsPageContext';
import { SidebarsContext } from '../../common/SidebarsWrapper';
import classNames from 'classnames';
import { ToCDisplayOptions, adjustHeadingText, getAnchorY, isRegularClick, jumpToY } from './TableOfContentsList';

function normalizeOffsets(sections: (ToCSection | ToCSectionWithOffset)[]): ToCSectionWithOffset[] {
  if (sections.length === 0) {
    return [];
  }
  
  const titleSection: ToCSectionWithOffset = { ...sections[0], offset: sections[0].offset ?? 0 };

  const remainingSections = sections.slice(1);

  const normalizedSections: ToCSectionWithOffset[] = remainingSections.map((section, idx) => ({
    ...section,
    offset: section.divider ? (1 - (sections[idx].offset ?? 0)) : ((section.offset ?? 0) - (sections[idx].offset ?? 0))
  }));

  return [titleSection, ...normalizedSections];
};

function getSectionsWithOffsets(sectionHeaders: Element[], filteredSections: ToCSection[]) {
  let sectionsWithOffsets;
  const parentContainer = sectionHeaders[0]?.parentElement;
  // If we have any section headers, assign offsets to them
  if (parentContainer) {
    const containerHeight = parentContainer.getBoundingClientRect().height;

    const anchorOffsets = sectionHeaders.map(sectionHeader => ({
      anchorHref: sectionHeader.getAttribute('id'),
      offset: (sectionHeader as HTMLElement).offsetTop / containerHeight
    }));

    sectionsWithOffsets = filteredSections.map((section) => {
      const anchorOffset = anchorOffsets.find((anchorOffset) => anchorOffset.anchorHref === section.anchor);
      return {
        ...section,
        offset: anchorOffset?.offset,
      };
    });
  } else {
    // Otherwise, we'll just default to assigning the entire offset to the comments "section" in the ToC in `normalizeOffsets`
    sectionsWithOffsets = filteredSections;
  }
  return sectionsWithOffsets;
}

const styles = (theme: ThemeType) => ({
  root: {
    left: 0,
    top: 0,
    maxHeight: '100vh',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    //Override bottom border of title row for FixedToC but not in other uses of TableOfContentsRow
    '& .TableOfContentsRow-title': {
      borderBottom: "none",
    },
    wordBreak: 'break-word',
    transition: 'opacity .5s ease-in-out 0.5s, transform .5s ease-in-out 0.5s, height 0.4s ease-in-out, max-height 0.4s ease-in-out',
  },
  fadeOut: {
    opacity: 0,
    transform: 'translateX(-50px)',
    transitionDelay: '0s',
  },
  fadeIn: {
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
  belowTitle: {
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
    marginBottom: 20,
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
  nonTitleRows: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    flexGrow: 1,
    '& .TableOfContentsRow-link': {
      background: theme.palette.panelBackground.default
    },
    '& .TableOfContentsDivider-divider': {
      marginLeft: 4,
    },
  },
});

const FixedPositionToc = ({tocSections, title, postedAt, onClickSection, displayOptions, classes}: {
  tocSections: ToCSection[],
  title: string|null,
  postedAt?: Date,
  onClickSection?: () => void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType<typeof styles>,
}) => {
  const { TableOfContentsRow, AnswerTocRow } = Components;

  const navigate = useNavigate();
  const location = useLocation();
  const { timezone } = useTimezone();
  const { query } = location;
  const { tocVisible } = useContext(SidebarsContext)!;

  const [normalizedSections, setNormalizedSections] = useState<ToCSectionWithOffset[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const postContext = usePostsPageContext();
  const disableProgressBar = (!postContext || isServer || postContext.shortform || postContext.readTimeMinutes < 2);

  const { readingProgressBarRef } = usePostReadProgress({
    updateProgressBar: (element, scrollPercent) => element.style.setProperty("--scrollAmount", `${scrollPercent}%`),
    disabled: disableProgressBar || !hasLoaded,
    setScrollWindowHeight: (element, height) => element.style.setProperty("--windowHeight", `${height}px`),
    useFirstViewportHeight: true
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
      jumpToY(sectionYdocumentSpace);
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
    ...filteredSections.map((section): ScrollHighlightLandmark => ({
      landmarkName: section.anchor,
      elementId: section.anchor,
      position: "centerOfElement",
      offset: -(getCurrentSectionMark() * 2)
    })),
    {
      landmarkName: "comments",
      elementId: "postBody",
      position: "bottomOfElement",
      offset: -(getCurrentSectionMark() * 2)
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
    const postBodyRef = document.getElementById('postBody');
    if (!postBodyRef) return;
    //Get all elements with href corresponding to anchors from the table of contents
    const postImages = Array.from(postBodyRef.getElementsByTagName('img'));
    function updateImageLoadingState(this: HTMLImageElement) {
      if (postImages.every(image => image.complete)) setHasLoaded(true)
      this.removeEventListener('load', updateImageLoadingState);
    };
    postImages.forEach((postImage) => postImage.addEventListener('load', updateImageLoadingState));
    if (postImages.every(image => image.complete)) setHasLoaded(true);
    return () => {
      postImages.forEach((postImage) => postImage.removeEventListener('load', updateImageLoadingState));
    }
  }, [])

  useEffect(() => {
    const postBodyRef = document.getElementById('postBody');
    if (!postBodyRef) return;
    const postBodyBlocks = Array.from(postBodyRef.querySelectorAll('[id]'));
    const sectionHeaders = postBodyBlocks.filter(block => filteredSections.map(section => section.anchor).includes(block.getAttribute('id') ?? ''));
    const sectionsWithOffsets = getSectionsWithOffsets(sectionHeaders, filteredSections);
    const newNormalizedSections = normalizeOffsets(sectionsWithOffsets);

    if (!isEqual(normalizedSections, newNormalizedSections)) {
      setNormalizedSections(newNormalizedSections);
    }
  }, [filteredSections, normalizedSections, hasLoaded]);

  const titleRow = (
    <TableOfContentsRow
      key="postTitle"
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
  );

  const rows = normalizedSections.map((section, index) => {
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
  });

  const commentsRow = normalizedSections.slice(-1)?.[0]?.anchor === 'comments' ? rows.pop() : undefined;

  if (!tocSections || !hasLoaded)
    return <div/>

  return <div className={classNames(classes.root, { [classes.fadeIn]: tocVisible, [classes.fadeOut]: !tocVisible })}>
    {titleRow}
    <div className={classes.belowTitle}>
      <div className={classes.progressBarContainer} ref={readingProgressBarRef}>
        <div className={classes.progressBar} />
        <div className={classes.unfilledProgressBar}/>
      </div>
      <div className={classes.nonTitleRows}>
        {rows}
      </div>
    </div>
    {commentsRow}
  </div>
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
