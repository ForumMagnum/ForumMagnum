import React, { useEffect, useRef, useState } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { useLocation } from '../../lib/routeUtil';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { gql, useSuspenseQuery } from '@apollo/client';
import classNames from 'classnames';
import range from 'lodash/range';
import { useCurrentUser } from '../common/withUser';
import qs from "qs";
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { filterWhereFieldsNotNull } from '@/lib/utils/typeGuardUtils';
import { getSpotlightUrl } from '@/lib/collections/spotlights/helpers';
import { CoordinateInfo, ReviewYearGroupInfo, ReviewSectionInfo, reviewWinnerYearGroupsInfo, reviewWinnerSectionsInfo } from '@/lib/publicSettings';
import { ReviewYear, ReviewWinnerCategory, reviewWinnerCategories, BEST_OF_LESSWRONG_PUBLISH_YEAR, PublishedReviewYear, publishedReviewYears } from '@/lib/reviewUtils';

import ContentStyles from '@/components/common/ContentStyles';
import Loading from '@/components/vulcan-core/Loading';
import SectionTitle from '@/components/common/SectionTitle';

import '@/lib/collections/users/fragments'
import '@/lib/collections/posts/fragments'
import '@/lib/collections/comments/fragments'
import '@/lib/collections/tags/fragments'
import '@/lib/collections/spotlights/fragments'
import '@/lib/collections/reviewWinners/fragments'
import '@/lib/collections/splashArtCoordinates/fragments'
import '@/lib/collections/chapters/fragments'
import '@/lib/collections/revisions/fragments'
import { usePathname, useSearchParams } from 'next/navigation';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
import SpotlightItem from "@/components/spotlights/SpotlightItem";
import LWTooltip from "@/components/common/LWTooltip";

/** In theory, we can get back posts which don't have review winner info, but given we're explicitly querying for review winners... */
export type GetAllReviewWinnersQueryResult = (PostsTopItemInfo & { reviewWinner: Exclude<PostsTopItemInfo['reviewWinner'], null> })[]

type ExpansionState = 'expanded' | 'collapsed' | 'default';
type HiddenState = 'full' | 'hidden';
export type CoordinatePosition = 'left' | 'middle' | 'right';
type Dpr = 1 | 2;

interface PostGridDimensions {
  postGridColumns: number;
  postGridRows: number;
}

interface GetPostsInGridArgs extends PostGridDimensions {
  posts: PostsTopItemInfo[];
  viewportWidth: number;
  viewportHeight: number;
  leftBookOffset: number;
}

interface PostGridContentsProps extends PostGridDimensions {
  postsInGrid: (PostsTopItemInfo | null)[][];
  viewportHeight: number;
  classes: ClassesType<typeof styles>;
  id: string;
  handleToggleFullyOpen: (id: string) => void;
  gridContainerHeight: number;
  isExpanded: boolean;
  isShowingAll: boolean;
  leftBookOffset: number;
  coverLoaded: boolean;
  expandedNotYetMoved: boolean;
  dpr: Dpr;
}

interface PostGridCellContentsProps extends Omit<PostGridContentsProps, 'postsInGrid'> {
  post: PostsTopItemInfo | null;
  rowIdx: number;
  columnIdx: number;
}

interface GetSplashArtUrlArgs {
  reviewWinnerArt: ReviewWinnerTopPostsPage_reviewWinnerArt;
  leftBookOffset: number;
  dpr: Dpr;
}

const MAX_GRID_SIZE = 6;

const DEFAULT_SPLASH_ART_COORDINATES: CoordinateInfo = {
  leftHeightPct: .2, leftWidthPct: .2, leftXPct: .2, leftYPct: .2, leftFlipped: false,
  middleHeightPct: .2, middleWidthPct: .2, middleXPct: .2, middleYPct: .2, middleFlipped: false,
  rightHeightPct: .2, rightWidthPct: .2, rightXPct: .2, rightYPct: .2, rightFlipped: false,
};

const description = `${siteNameWithArticleSetting.get()}'s best posts`;

const BOOK_OFFSETS_TO_COORDINATE_POSITIONS: Partial<Record<number, CoordinatePosition>> = {
  0: 'left',
  1: 'middle',
  2: 'right'
};

export const COORDINATE_POSITIONS_TO_BOOK_OFFSETS: Record<CoordinatePosition, number> = Object.fromEntries(
  Object.entries(BOOK_OFFSETS_TO_COORDINATE_POSITIONS).map(([offset, position]) => [position, offset])
);

function gridPositionToClassName(gridPosition: number) {
  return `gridPosition${gridPosition}` as const;
}

function gridPositionToClassesEntry(theme: ThemeType, gridPosition: number) {
  return [gridPositionToClassName(gridPosition), {
    left: `calc(-${(gridPosition % 3) * 3} * 120px)`,
    [theme.breakpoints.down(1200)]: {
      left: `calc(-${(gridPosition % 2) * 3} * 120px)`,
    },
    [theme.breakpoints.down(800)]: {
      left: 0
    }
  }] as const;
};

const IMAGE_GRID_HEADER_WIDTH = 40;

const styles = (theme: ThemeType) => ({
  widerColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    width: 'min-content'
  },
  title: {
    fontSize: "4.0rem",
    fontWeight: 500,
  },
  description: {
    maxWidth: 700,
    paddingLeft: 17,
    [theme.breakpoints.down(800)]: {
      paddingLeft: 0
    }
  },
  gridContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    rowGap: '20px',
    width: 1200,
    marginTop: 24,
    [theme.breakpoints.down(1200)]: {
      width: 800
    },
    [theme.breakpoints.down(800)]: {
      width: 'inherit',
      rowGap: 0
    }
  },
  postsImageGrid: {
    position: "relative",
    display: "flex",
    transition: 'height 0.5s ease-in-out',
    marginRight: "auto",
    marginLeft: "auto",
    '&:hover $imageGridHeader': {
      background: theme.palette.leastwrong.imageGridHeader
    },
    '&:hover $toggleIcon': {
      opacity: 1
    },
    [theme.breakpoints.down(800)]: {
      flexDirection: "column",
    },
    '&:hover $imageGridPostBody:not($imageGridPostRead)': {
      backdropFilter: 'grayscale(0) brightness(0.6)',
      '--top-posts-page-scrim-opacity': '0%'
    },
  },
  expandedImageGrid: {
    '& $imageGridContainer': {
      transition: 'width 0.5s ease-in-out',
      width: 'calc(9 * 120px - 2px)',
      [theme.breakpoints.down(1200)]: {
        width: 'calc(6 * 120px - 2px)',
      },
      [theme.breakpoints.down(800)]: {
        width: 'calc(3 * 120px - 2px)',
        transition: 'height 0.5s ease-in-out',
      },
    },
    '& $imageGrid': {
      left: '0 !important'
    },
    '& $imageGridPostOffscreen': {
      opacity: 1,
      transitionDelay: '0s'
    },
    '& $toggleIcon': {
      transform: 'rotate(45deg)'
    }
  },
  collapsedImageGrid: {
    '& $imageGridContainer': {
      transition: 'width 0.5s ease-in-out, height 0.5s ease-in-out',
      width: 0
    },
    '& $imageGridHeader': {
      width: 38,
    }
  },
  showAllImageGrid: {
    '& $imageGridContainer': {
      transition: 'width 0.5s ease-in-out, height 0.5s ease-in-out',
    },
  },
  imageGridHeader: {
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: "16px 0px 4px 3px",
    cursor: 'pointer',
    transition: 'background 0.2s ease-in, width 0.5s ease-in-out',
    '&&&:hover': {
      background: theme.palette.leastwrong.imageGridHeaderHighlighted
    },
    [theme.breakpoints.up(800)]: {
      width: IMAGE_GRID_HEADER_WIDTH,
      height: 'inherit',
    },
    [theme.breakpoints.down(800)]: {
      padding: 0,
      writingMode: "inherit",
      transform: 'none',
      width: 'inherit',
      height: '40px',
    }
  },
  imageGridHeaderTitle: {
    margin: 0,
    fontSize: 32,
    transition: 'opacity 0.5s ease-in 0.5s',
    ...theme.typography.headerStyle
  },
  toggleIcon: {
    fontSize: 24,
    opacity: 0,
    transform: 'rotate(0deg)',
    transition: 'transform 0.2s ease-in',
    transitionDelay: '0.5s',
    [theme.breakpoints.down(800)]: {
      order: 2,
      padding: 0,
      margin: 0,
      opacity: 1
    }
  },
  imageGridContainer: {
    position: "relative",
    width: 'calc(3 * 120px - 2px)',
    height: 'inherit',
    overflow: 'hidden',
    transition: 'width 0.5s ease-in-out, height 0.5s ease-in-out',
    [theme.breakpoints.down(800)]: {
      transition: 'height 0.5s ease-in-out',
    },
    
  },
  imageGrid: {
    display: "grid",
    position: "absolute",
    top: 0,
    overflow: "hidden",
    gridAutoFlow: 'row',
    transition: 'left 0.5s ease-in-out',
    '&:hover $imageGridPostBackgroundContainer': {
      transitionDelay: '0.2s'
    },
    // This is so that when the user moves their mouse between different post items in the grid (which have loaded their images successfully),
    // the "cover" image doesn't pop in between "post" image transitions
    // '&:has($imageGridPostBackgroundCompleteHovered:not($imageGridPostBackgroundContainerHidden)) $imageGridBackgroundContainer': {
    //   opacity: 0,
    // },
  },
  // If we want to display a grid with more than 6 items, increase this number
  ...Object.fromEntries(Array.from({ length: MAX_GRID_SIZE }, (_, i) => gridPositionToClassesEntry(theme, i))),
  imageGridBackgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1080,
    zIndex: -1,
    transition: "opacity 0.2s ease-in",
    objectPosition: "right",
    background: theme.palette.leastwrong.imageGridBackground,
    display: 'flex',
    flexDirection: 'column',
  },
  imageGridBackgroundContainerCategory: {
    zIndex: -2
  },
  imageGridBackground: {
    position: "relative",
    width: '100%',
  },
  imageGridBackgroundReflected: {
    transform: 'scaleY(-1)',
  },
  showAllButton: {
    ...theme.typography.commentStyle,
    height: 120,
    width: 120,
    position: 'absolute',
    top: 0,
    background: theme.palette.greyAlpha(.5),
    color: theme.palette.text.invertedBackgroundText,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    cursor: 'pointer',
    transition: "left 0.2s ease-in 0.5s",
    borderRight: `1px solid ${theme.palette.text.alwaysWhite}`,
    borderBottom: `1px solid ${theme.palette.text.alwaysWhite}`,
  },
  showAllButtonVisible: {
    left: 0
  },
  showAllButtonHidden: {
    left: 120,
    transition: 'left 0.2s ease-in 0s'
  },
  imageGridPostJustExpanded: {
    pointerEvents: 'none'
  },
  imageGridPost: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.alwaysWhite,
    display: "flex",
    textWrap: "balance",
    cursor: "pointer",

    '&:hover': {
      opacity: 1 // Overwriting default <a> styles
    },

    '&:hover .hoverBackground': {
      opacity: 1
    },

    '&&&:hover $imageGridPostBackgroundContainer': {
      display: "flex",
      opacity: 1,
      transitionDelay: "0s",
      zIndex: 2
    },
    '&&&:hover $imageGridPostBackgroundReflected': {
      zIndex: 1,
      opacity: 1
    },

    height: 'inherit',
  },

  imageGridPostUnread: {
    '&': {
      backdropFilter: 'grayscale(0.75) brightness(0.6)',
      background: 'none'
    }
  },

  imageGridPostRead: {

  },

  imageGridPostHidden: {
    opacity: 0,
    transitionDelay: '0.5s'
  },

  imageGridPostOffscreen: {
    opacity: 0,
    transitionDelay: '0.5s'
  },

  imageGridPostBody: {
    borderRight: `1px solid ${theme.palette.text.alwaysWhite}`,
    borderBottom: `1px solid ${theme.palette.text.alwaysWhite}`,
    background: `linear-gradient(0deg, ${theme.palette.leastwrong.postBodyScrim}, transparent 60%)`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
    zIndex: 4,
    transition: 'backdrop-filter 0.5s ease-in-out, --top-posts-page-scrim-opacity 0.5s ease-in-out',
    '&&&:hover': {
      background: theme.palette.leastwrong.highlightedPost,
      backdropFilter: "none",
    },
    // The `:not(:has()) is to avoid forcing the author name to display when the cell is in the "Show All" state
    '&:hover:not(:has($imageGridPostHidden)) $imageGridPostAuthor': {
      opacity: 1
    },
  },
  emptyGridCell: {
    borderRight: `1px solid ${theme.palette.text.alwaysWhite}`,
    borderBottom: `1px solid ${theme.palette.text.alwaysWhite}`,
    zIndex: 3,
  },
  imageGridPostBackgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    // We could do 100% here, but it would cause us to clip the bottom of the image in some 2 column cases
    width: 1080,
    opacity: 0,
    zIndex: -1,
    transition: "opacity 0.2s ease-in",
    transitionDelay: '0.2s',
    objectPosition: "right",
    background: theme.palette.leastwrong.imageGridBackground,
    display: 'flex',
    flexDirection: 'column',
  },
  imageGridPostBackgroundContainerHidden: {
    '&&&&&&': {
      display: "none",
    }
  },
  imageGridPostBackground: {
    position: "relative",
    width: '100%',
  },
  imageGridPostBackgroundReflected: {
    transform: 'scaleY(-1)',
  },
  // This class exists purely so that we can track it from `imageGrid` to apply `opacity: 0` to `imageGridBackground`
  // Unfortunately there doesn't seem to be a way to track when someone is hovering over a "complete" (loaded) image purely in CSS
  // So we need to apply this class in code with mouseover event tracking while checking the imgRef's `complete` property
  imageGridPostBackgroundCompleteHovered: {},
  imageGridPostAuthor: {
    opacity: 0,
    textAlign: "right",
    paddingTop: 2,
    fontWeight: 600,
    paddingRight: 6,
    transition: "opacity 0.2s ease-in",
    paddingLeft: 12
  },
  imageGridPostTitle: {
    padding: 4,
    paddingTop: 0,
    transition: "opacity 0.2s ease-in",
    textShadow: `0px 0px 3px ${theme.palette.text.alwaysBlack}, 0 0 5px ${theme.palette.text.alwaysBlack}, 0 0 8px ${theme.palette.text.alwaysBlack}`,
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 6,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  expandIcon: {},
  postsByYearSectionCentered: {
    marginTop: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '& h1': {
      ...theme.typography.display3,
      marginTop: 0,
      ...theme.typography.headerStyle
    }
  },
  categoryTitle: {
    textTransform: 'capitalize',
  },
  year: {
    ...theme.typography.display1,
    ...theme.typography.headerStyle,
    margin: 12,
    color: theme.palette.grey[600],
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.4rem',
      marginLeft: 6,
      marginRight: 6,
    }
  },
  category: {
    ...theme.typography.display1,
    fontSize: '1.6rem',
    margin: 12,
    ...theme.typography.headerStyle,
    fontVariantCaps: 'all-small-caps',
    color: theme.palette.grey[600],
    marginBottom: 24,
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.4rem',
      marginLeft: 6,
      marginRight: 6,
    }
  },
  postsByYearCategory: {
    display: 'flex',
    marginBottom: 12
  },
  yearCategorySectionTitle: {
    ...theme.typography.display2,
    ...theme.typography.headerStyle,
    marginBottom: 12,

  },
  yearSelector: {
    textWrap: 'balance',
    marginBottom: '12px',
    textAlign: "center",
  },
  categorySelector: {
    textWrap: 'balance',
    marginBottom: '12px',
    textAlign: "center",
  },
  disabledCategory: {
    opacity: .5,
    cursor: 'default'
  },
  spotlightItem: {
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
  },
  spotlightRanking: {
    marginRight: 16,
    ...theme.typography.body2,
    ...theme.typography.headerStyle,
    color: theme.palette.grey[500],
  },
  spotlightIsNotRead: {
    filter: 'saturate(0) opacity(0.8)',
    '&:hover': {
      filter: 'saturate(1) opacity(1)',
    }
  },
  spotlightCheckmarkRow: {
    marginTop: 8,
    marginBottom: 52,
    textWrap: 'balance',
    textAlign: 'center',
    maxWidth: SECTION_WIDTH
  },
  spotlightCheckmark: {
    display: 'inline-block',
    width: 14,
    height: 14,
    borderRadius: 3,
    border: `solid 1px ${theme.palette.grey[400]}`,
    backgroundColor: theme.palette.grey[100],
    margin: 2
  },
  spotlightCheckmarkIsRead: {
    backgroundColor: theme.palette.lwTertiary.main,
    borderColor: theme.palette.grey[700],
    backgroundOpacity: .2,
    opacity: .7
  }
});

function sortReviewWinners(reviewWinners: GetAllReviewWinnersQueryResult) {
  const sortedReviewWinners = [...reviewWinners];
  return sortedReviewWinners.sort((a, b) => {
    const aCuratedOrder = a.reviewWinner?.curatedOrder ?? Number.MAX_SAFE_INTEGER
    const bCuratedOrder = b.reviewWinner?.curatedOrder ?? Number.MAX_SAFE_INTEGER
    const curatedOrderDiff = aCuratedOrder - bCuratedOrder
    
    // If one has curatedOrder and the other doesn't, prioritize the one with curatedOrder
    if (curatedOrderDiff !== 0) {
      return curatedOrderDiff
    }
  
    // Otherwise sort by finalReviewVoteScoreHighKarma in descending order
    return a.reviewWinner.reviewRanking - b.reviewWinner.reviewRanking;
  });
}

function getLeftOffset(index: number, columnLength: number) {
  return index % columnLength;
}

function useWindowWidth(defaultValue = 2000): number {
  const [windowWidth, setWindowWidth] = useState(defaultValue);

  useEffect(() => {
    function handleResize() {
      setWindowWidth(global?.visualViewport?.width || 2000);
    }

    global?.addEventListener('resize', handleResize);
    handleResize();
    return () => global.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
}

function getHiddenState(gridId: string, fullyOpenGridIds: string[]): HiddenState | undefined {
  if (fullyOpenGridIds.length === 0) {
    return undefined;
  }

  return fullyOpenGridIds.includes(gridId) ? 'full' : 'hidden';
}

function getCurrentPostGridHeight(isShowingAll: boolean, isExpanded: boolean, postGridRows: number, viewportHeight: number, bookGridColumns: number) {
  const isMobile = bookGridColumns === 1;
  // On mobile, the header is no longer transformed, and as such has its height take up space in the post grid
  const headerAdjustment = isMobile ? 40 : 0;

  // If we're in the "Show All" state, we want enough height to show every row
  if (isShowingAll) {
    return (postGridRows * 120) + headerAdjustment - 1;
  }

  // If we're not on mobile, return height based on the default viewport "height" assigned to each post grid
  if (!isMobile) {
    return (viewportHeight * 120) - 1;
  }

  // If we're on mobile and in the expanded state, we use the default viewport height
  if (isExpanded) {
    return (viewportHeight * 120) + headerAdjustment - 1;
  }

  // Otherwise, we're in the unexpanded mobile state, which only has one row visible
  return 120 + headerAdjustment - 1;
}

function getNewExpansionState(expansionState: Record<string, ExpansionState>, toggledElementId: string): Record<string, ExpansionState> {
  const elements = document.querySelectorAll(`[id^="PostsImageGrid-"]`);
  const currentState = expansionState[toggledElementId] || 'default';

  const clickedElement = document.getElementById(`PostsImageGrid-${toggledElementId}`);
  const clickedElementY = clickedElement?.getBoundingClientRect().top;

  const elementsToToggle = Array.from(elements).filter((element) => {
    const elementY = element.getBoundingClientRect().top;
    return elementY === clickedElementY && clickedElement;
  });

  const newClickedElementState = currentState === 'expanded' ? 'default' : 'expanded';

  const newState: Record<string, ExpansionState> = {
    ...expansionState,
    ...Object.fromEntries(elementsToToggle.map(element => [element.id.replace('PostsImageGrid-', ''), currentState === 'expanded' ? 'default' : 'collapsed'])),
    [toggledElementId]: newClickedElementState
  };
  return newState;
}

const TopPostsPage = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const screenWidth = useWindowWidth(2000);
  /** 
   * The number of grids we'll show horizontally before wrapping over to the next "row" of grids on the screen.
   * 
   * width < 800px:             1,
   * 800px >= width < 1200px:   2,
   * 1200px >= width:           3
   */
  const horizontalBookGridCount = Math.min(Math.max(Math.floor(screenWidth / 400), 1), 3);

  const [expansionState, setExpansionState] = useState<Record<string, ExpansionState>>({});
  const [fullyOpenGridIds, setFullyOpenGridIds] = useState<string[]>([]);
  const [expandedNotYetMoved, setExpandedNotYetMoved] = useState(false)

  const handleToggleExpand = (id: string) => {
    const newState = getNewExpansionState(expansionState, id);

    if (fullyOpenGridIds.length !== 0) {
      const collapsedGridIds = Object.keys(newState).filter(gridId => newState[gridId] === 'collapsed');
      // We only remove the "fully open" state from those grids which end up collapsed when we toggle the "expanded" state of another grid
      // This prevents the issue where you can fully open grids on two rows, expand a different grid on the top row,
      // and then have a bunch of empty space in between the two rows because the grid in the top row which was "fully open" still is,
      // and is taking up (unseen) vertical space via its height.
      // We also remove it from the grid that's been un-expanded, if it was fully-open at the time.
      setFullyOpenGridIds([...fullyOpenGridIds].filter(openGridId => !collapsedGridIds.includes(openGridId) && id !== openGridId));

    }

    setExpansionState(newState);
    setExpandedNotYetMoved(true)
  }

  const toggleFullyOpenGridId = (id: string) => {
    if (fullyOpenGridIds.includes(id)) {
      setFullyOpenGridIds([...fullyOpenGridIds].filter(openGridId => openGridId !== id));
    } else {
      setFullyOpenGridIds([...fullyOpenGridIds, id]);
    }
  };

  const { data } = useSuspenseQuery(gql`
    query GetAllReviewWinners {
      GetAllReviewWinners {
        ...PostsTopItemInfo
      }
    }
    ${fragmentTextForQuery('PostsTopItemInfo')}
  `);

  console.log({data})

  const reviewWinnersWithPosts: GetAllReviewWinnersQueryResult = [...(data as any).GetAllReviewWinners ?? []];
  const sortedReviewWinners = sortReviewWinners(reviewWinnersWithPosts);

  function getPostsImageGrid(posts: PostsTopItemInfo[], img: string, coords: CoordinateInfo, header: string, id: string, gridPosition: number, expandedNotYetMoved: boolean) {
    const props = {
      id,
      posts,
      classes,
      img,
      coords,
      header,
      horizontalBookGridCount,
      gridPosition,
      expansionState: expansionState[id],
      handleToggleExpand,
      handleToggleFullyOpen: toggleFullyOpenGridId,
      hiddenState: getHiddenState(id, fullyOpenGridIds),
      expandedNotYetMoved
    };
    return <PostsImageGrid {...props} key={id} />;
  }

  const sectionsInfo: Record<ReviewWinnerCategory, ReviewSectionInfo> | null = reviewWinnerSectionsInfo.get();
  const yearGroupsInfo: Record<ReviewYear, ReviewYearGroupInfo> | null = reviewWinnerYearGroupsInfo.get();

  if (!sectionsInfo) {
    // eslint-disable-next-line no-console
    console.error('Failed to load reviewWinnerSectionsInfo (image data) from public settings');
    return null;
  }

  if (!yearGroupsInfo) {
    // eslint-disable-next-line no-console
    console.error('Failed to load reviewWinnerYearGroupsInfo (image data) from public settings');
    return null;
  }

  const sectionGrid = Object.entries(sectionsInfo).sort(([, a], [, b]) => a.order - b.order).map(([id, { title, imgUrl, coords }], index) => {
    const posts = sortedReviewWinners.filter(post => post.reviewWinner?.category === id);
    return getPostsImageGrid(posts, imgUrl, coords ?? DEFAULT_SPLASH_ART_COORDINATES, title ?? id, id, index, expandedNotYetMoved);
  });

  return (
    <>
      {/* <HeadTags description={description} image={"https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto/v1709263848/Screen_Shot_2024-02-29_at_7.30.43_PM_m5pyah.png"} /> */}
      {/** TODO: change pageContext when/if we rename component */}
      <AnalyticsContext pageContext="topPostsPage">
        <div className={classes.widerColumn}>
          <div className={classes.description}>
            <SectionTitle title={preferredHeadingCase("The Best of LessWrong")} titleClassName={classes.title} />
            <ContentStyles contentType="post">
              When posts turn more than a year old, the LessWrong community reviews and votes on how well they have stood the test of time. These are the posts that have ranked the highest for all years since 2018 (when our annual tradition of choosing the least wrong of LessWrong began).
              <br /><br />
              For the years 2018, 2019 and 2020 we also published physical books with the results of our annual vote, which you can buy and learn more about {<Link to='/books'>here</Link>}.
            </ContentStyles>
          </div>
          <div className={classes.gridContainer} onMouseMove={() => expandedNotYetMoved && setExpandedNotYetMoved(false)}>
            {sectionGrid}
          </div>
          {/* {loading && <Loading/>} */}
          {/* <TopSpotlightsSection classes={classes} 
            yearGroupsInfo={yearGroupsInfo} 
            sectionsInfo={sectionsInfo} 
            reviewWinnersWithPosts={reviewWinnersWithPosts} 
          /> */}
        </div>
      </AnalyticsContext>
    </>
  );
}

type YearSelectorState = PublishedReviewYear|'all'
type CategorySelectorState = ReviewWinnerCategory|'all'

function getInitialYear(yearQuery?: string): YearSelectorState {
  if (!yearQuery) {
    return BEST_OF_LESSWRONG_PUBLISH_YEAR
  }
  if (yearQuery === 'all') {
    return 'all'
  }
  const yearQueryInt = parseInt(yearQuery);
  if (publishedReviewYears.has(yearQueryInt)) {
    return yearQueryInt
  }
  return BEST_OF_LESSWRONG_PUBLISH_YEAR
}

function TopSpotlightsSection({classes, yearGroupsInfo, sectionsInfo, reviewWinnersWithPosts }: {
  classes: ClassesType<typeof styles>,
  yearGroupsInfo: Record<ReviewYear, ReviewYearGroupInfo>,
  sectionsInfo: Record<ReviewWinnerCategory, ReviewSectionInfo>,
  reviewWinnersWithPosts: PostsTopItemInfo[]
}) {
  const location = useLocation();
  const { query: { year: yearQuery, category: categoryQuery } } = location;

  const categories = [...reviewWinnerCategories]

  const [year, setYear] = useState<YearSelectorState>(getInitialYear(yearQuery))

  const initialCategory = (categoryQuery && reviewWinnerCategories.has(categoryQuery)) ? categoryQuery : 'all'  
  const [category, setCategory] = useState<CategorySelectorState>(initialCategory)

  useEffect(() => {
    if (yearQuery) {
      const element = document.getElementById('year-category-section');
      if (element) {          
        window.scrollTo({
          top: element.getBoundingClientRect().top + window.pageYOffset - 400
        });
      }
    }
  }, [yearQuery]);

  let filteredReviewWinnersForSpotlights: PostsTopItemInfo[] = []

  filteredReviewWinnersForSpotlights = reviewWinnersWithPosts.filter(post => post.reviewWinner?.reviewYear === year && post.reviewWinner?.category === category)


  if (year === 'all' && category === 'all') {
    filteredReviewWinnersForSpotlights = reviewWinnersWithPosts
  } else if (year === 'all') {
    filteredReviewWinnersForSpotlights = reviewWinnersWithPosts.filter(post => post.reviewWinner?.category === category)
  } else if (category === 'all') {
    filteredReviewWinnersForSpotlights = reviewWinnersWithPosts.filter(post => post.reviewWinner?.reviewYear === year)
  } else {
    filteredReviewWinnersForSpotlights = reviewWinnersWithPosts.filter(post => post.reviewWinner?.reviewYear === year && post.reviewWinner?.category === category)
  }

  const filteredSpotlights = filterWhereFieldsNotNull(filteredReviewWinnersForSpotlights, 'spotlight').map(post => ({
    ...post.spotlight,
    post,
    tag: null,
    sequence: null,
    ranking: post.reviewWinner?.reviewRanking
  })).sort((a, b) => {
    const reviewWinnerA = reviewWinnersWithPosts.find(post => post._id === a.post?._id)
    const reviewWinnerB = reviewWinnersWithPosts.find(post => post._id === b.post?._id)
    if (reviewWinnerA?.reviewWinner?.reviewRanking !== reviewWinnerB?.reviewWinner?.reviewRanking) {
      return (reviewWinnerA?.reviewWinner?.reviewRanking ?? 0) - (reviewWinnerB?.reviewWinner?.reviewRanking ?? 0)
    } else if (reviewWinnerA?.reviewWinner?.reviewYear !== reviewWinnerB?.reviewWinner?.reviewYear) {  
      return (reviewWinnerA?.reviewWinner?.reviewYear ?? 0) - (reviewWinnerB?.reviewWinner?.reviewYear ?? 0)
    } else if (reviewWinnerA?.reviewWinner?.category !== reviewWinnerB?.reviewWinner?.category) {
      return (reviewWinnerA?.reviewWinner?.category ?? '').localeCompare(reviewWinnerB?.reviewWinner?.category ?? '')
    } else {
      return 0
    }
  })

  const handleSetYear = (y: YearSelectorState) => {
    const newSearch = qs.stringify({year: y, category});
    history.replaceState(null, '', `${location.pathname}?${newSearch}`);
    setYear(y);
  }
  
  const handleSetCategory = (t: CategorySelectorState) => {
    const newSearch = qs.stringify({year, category: t});
    history.replaceState(null, '', `${location.pathname}?${newSearch}`);
    setCategory(t);
  }

  return <div className={classes.postsByYearSectionCentered} id="year-category-section">
      <div className={classes.yearSelector}>
        {[...publishedReviewYears].map((y) => {
          const postsCount = reviewWinnersWithPosts.filter(post => {
            return post.reviewWinner?.reviewYear === y
          }).length
          return <LWTooltip key={y} title={`${postsCount} posts`} placement="top"><a onClick={() => handleSetYear(y)} className={classes.year} key={y} style={{color: y === year ? '#000' : '#888'}}>{y}</a></LWTooltip>
        })}
        <LWTooltip key="all" title={`${reviewWinnersWithPosts.length} posts`} inlineBlock={false}>
          <a onClick={() => handleSetYear('all')} className={classes.year} style={{color: year === 'all' ? '#000' : '#888', fontVariant: 'all-small-caps'}}>
            All
          </a>
        </LWTooltip>
      </div>
      <div className={classes.categorySelector}>
        {categories.map((t) => {
          const postsCount = year === 'all' ? reviewWinnersWithPosts.filter(post => post.reviewWinner?.category === t).length : reviewWinnersWithPosts.filter(post => post.reviewWinner?.reviewYear === year && post.reviewWinner?.category === t).length
          return <LWTooltip key={t} title={`${postsCount} posts`} inlineBlock={false}>
            <a onClick={() => handleSetCategory(t)} className={classNames(classes.category, !postsCount && classes.disabledCategory)} style={{color: t === category ? '#000' : '#888'}}>{sectionsInfo[t].title}</a>
          </LWTooltip>
        })}
        <LWTooltip key="all" title={`${reviewWinnersWithPosts.filter(post => {
          if (year === 'all') return true
          return post.reviewWinner?.reviewYear === year
        }).length} posts`} inlineBlock={false}>
          <a onClick={() => handleSetCategory('all')} className={classes.category} style={{color: category === 'all' ? '#000' : '#888'}}>
            All
          </a>
        </LWTooltip>
      </div>
      <div className={classes.spotlightCheckmarkRow}>
        {filteredSpotlights.map((spotlight) => {
          const post = reviewWinnersWithPosts.find(post => post._id === spotlight.post?._id)
          const postYear = ((category !== 'all' && year !== 'all') || year === 'all') ? post?.reviewWinner?.reviewYear : ''
          const postCategory = ((year !== 'all' && category !== 'all') || category === 'all') ? post?.reviewWinner?.category : ''
          const postAuthor = post?.user?.displayName
          const tooltip = <><div>{spotlight.post?.title}</div>
          <div><em>by {postAuthor}</em></div>
          {(postYear || postCategory) && <div><em>{postYear} <span style={{textTransform: 'capitalize'}}>{postCategory}</span></em></div>}</>

          return <LWTooltip key={spotlight._id} title={tooltip}>
            <Link key={spotlight._id} to={getSpotlightUrl(spotlight)} className={classNames(classes.spotlightCheckmark, spotlight.post?.isRead && classes.spotlightCheckmarkIsRead)}></Link>
          </LWTooltip>
        })}
      </div>
      <div style={{ maxWidth: SECTION_WIDTH, paddingBottom: 1000 }}>
        {filteredSpotlights.map((spotlight) => <div key={spotlight._id} className={classNames(classes.spotlightItem, !spotlight.post?.isRead && classes.spotlightIsNotRead )}>
          <LWTooltip title={`Ranked #${spotlight.ranking} in ${spotlight.post?.reviewWinner?.reviewYear}`}>
            <div className={classes.spotlightRanking}>#{(spotlight.ranking ?? 0) + 1}</div>
          </LWTooltip>
          <SpotlightItem spotlight={spotlight} showSubtitle={false} />
        </div>)}
      </div>
    </div>
}

function getPostsInGrid(args: GetPostsInGridArgs) {
  const { posts, viewportWidth, viewportHeight, postGridColumns, postGridRows, leftBookOffset } = args;

  // Construct an empty 2D array of posts
  const postsInGrid: (PostsTopItemInfo | null)[][] = range(postGridRows).map(row => range(postGridColumns).map(col => null));
  // Fill the viewport
  let placedPostIndex = 0;
  const viewportLeft = leftBookOffset * 3;
  for (let row = 0; row < Math.min(viewportHeight, postGridRows); row++) {
    for (let column = viewportLeft; column < viewportLeft + viewportWidth; column++) {
      postsInGrid[row][column] = posts[placedPostIndex++];
    }
  }
  // Fill remaining spots in the grid
  for (let row = 0; row < postGridRows; row++) {
    for (let column = 0; column < postGridColumns; column++) {
      if (postsInGrid[row][column] === null) {
        postsInGrid[row][column] = posts[placedPostIndex++] ?? null;
      }
    }
  }

  return postsInGrid;
}

const PostGridContents = (props: PostGridContentsProps) => {
  const { postsInGrid, ...cellArgs } = props;
  return <>{postsInGrid.map((row, rowIdx) => row.map((post, columnIdx) => <PostGridCellContents post={post} rowIdx={rowIdx} columnIdx={columnIdx} key={post?._id ?? `empty-${rowIdx}-${columnIdx}`} {...cellArgs} />))}</>;
}

const PostGridCellContents = (props: PostGridCellContentsProps): JSX.Element => {
  const { post, rowIdx, columnIdx, viewportHeight, postGridColumns, postGridRows, classes, id, handleToggleFullyOpen, isExpanded, isShowingAll, leftBookOffset, coverLoaded, expandedNotYetMoved, dpr } = props;
  const isLastCellInDefaultView = (rowIdx === (viewportHeight - 1)) && (columnIdx === (postGridColumns - 1));
  const offsetColumnIdx = columnIdx - (leftBookOffset * 3);
  const isDefault = rowIdx < viewportHeight && (offsetColumnIdx < 3) && (offsetColumnIdx >= 0);
  // If a user clicks on a book title to expand it, and the book has leftOffset > 0 (i.e. isn't in the first book-grid "column"),
  // users may experience a weird transition when their cursor ends up hovering on a post that was previously hidden and thus hadn't had its image loaded.
  // So we additionally preload images for those posts as well as those which are shown on the initial load (`isDefault`)
  const isUnderTitle = offsetColumnIdx === -1;

  const emptyCellElement = <div key={`empty-${rowIdx}-${columnIdx}`} className={classes.emptyGridCell} />;

  const reviewWinnerArt = post?.reviewWinner?.reviewWinnerArt ?? undefined;
  const imgSrc = reviewWinnerArt ? getSplashArtUrl({ reviewWinnerArt, leftBookOffset, dpr }) : '';

  const applyHideImageClass = !(isDefault || isUnderTitle || isExpanded || isShowingAll) || !coverLoaded || expandedNotYetMoved;
  const imageClass = classNames({
    [classes.imageGridPostBackgroundContainerHidden]: applyHideImageClass
  });

  if (!post) {
    return emptyCellElement;
  }

  return (
    <ImageGridPost
      key={post._id}
      post={post}
      imgSrc={imgSrc}
      classes={classes}
      imageGridId={id}
      imageClass={imageClass}
      isShowAll={isLastCellInDefaultView && isExpanded}
      showAllVisible={isExpanded && !isShowingAll && postGridRows > 4}
      handleToggleFullyOpen={handleToggleFullyOpen}
    />
  );
}

function getPostGridTemplateDimensions({ postGridRows, postGridColumns }: PostGridDimensions) {
  return {
    gridTemplateRows: `repeat(${postGridRows}, 120px)`,
    gridTemplateColumns: `repeat(${postGridColumns}, 120px)`
  };
}

const getCroppedUrl = (url: string, splashCoordinates: Omit<SplashArtCoordinates, "_id" | "reviewWinnerArtId">, leftBookOffset: number, dpr: Dpr) => {
  let coordinatePosition: CoordinatePosition | undefined = BOOK_OFFSETS_TO_COORDINATE_POSITIONS[leftBookOffset];
  if (!coordinatePosition) {
    // eslint-disable-next-line no-console
    console.error(`Invalid leftBookOffset ${leftBookOffset} used to derive coordinate position`);
    coordinatePosition = 'left';
  }
  const {
    [`${coordinatePosition}XPct` as const]: xPct,
    [`${coordinatePosition}YPct` as const]: yPct,
    [`${coordinatePosition}WidthPct` as const]: widthPct,
    // We're explicitly not bothering with heightPct right now, since we just want to get "to the bottom" of the image
    [`${coordinatePosition}Flipped` as const]: flipped,
  } = splashCoordinates;

  const newXPct = Math.min(1, Math.max(0, xPct - (widthPct * leftBookOffset)));
  const newWidthPct = Math.min(1, Math.max(0, widthPct * 3)); // this will break the url if it goes above 1, but it shouldn't

  // According to https://cloudinary.com/documentation/responsive_server_side_client_hints#automatic_pixel_density_detection,
  // "Setting a value of dpr_1.0 is treated the same way as dpr_auto and will also be replaced with the device's DPR.
  // If you want to force dpr_1.0, you should do so by removing the dpr option from the URL completely."
  const dprParam = dpr === 2 ? 'dpr_2.0,' : '';
  const cropPathParam = `c_crop,w_${newWidthPct},x_${newXPct},y_${yPct},h_1/${dprParam}w_1080`;
  return url
    .replace('upload/', `upload/${cropPathParam}/`)
    .replace('upload/', `upload/${flipped ? 'a_hflip/' : ''}`)
}

function getSplashArtUrl({ reviewWinnerArt, leftBookOffset, dpr }: GetSplashArtUrlArgs) {
  const {
    splashArtImageUrl,
    activeSplashArtCoordinates,
  } = reviewWinnerArt;

  return getCroppedUrl(splashArtImageUrl, activeSplashArtCoordinates ?? DEFAULT_SPLASH_ART_COORDINATES, leftBookOffset, dpr)
    .replace('f_auto,q_auto', 'f_auto,q_auto:eco');
}

const PostsImageGrid = ({ posts, classes, img, coords, header, id, horizontalBookGridCount, gridPosition, expansionState, handleToggleExpand, handleToggleFullyOpen, hiddenState, expandedNotYetMoved }: {
  posts: PostsTopItemInfo[],
  classes: ClassesType<typeof styles>,
  img: string,
  coords: CoordinateInfo,
  header: string,
  id: string,
  horizontalBookGridCount: number,
  gridPosition: number,
  expansionState: ExpansionState,
  handleToggleExpand: (id: string) => void,
  handleToggleFullyOpen: (id: string) => void,
  hiddenState?: 'hidden' | 'full',
  expandedNotYetMoved: boolean 
}) => {
  const coverImgRef = useRef<HTMLImageElement>(null);
  const [coverImgLoaded, setCoverImgLoaded] = useState(false);
  const [dpr, setDpr] = useState<Dpr>(1);

  /** The "index" of this book grid in its "row" */
  const leftBookOffset = getLeftOffset(gridPosition, horizontalBookGridCount);
  /** The number of columns in the grid's expanded (and "show all") state */
  const postGridColumns = horizontalBookGridCount * 3;
  /** The number of rows in the grid's "show all" state */
  const postGridRows = Math.max(Math.ceil(posts.length / postGridColumns), 4);

  const viewportWidth = 3;
  const viewportHeight = 4;

  const postsInGrid = getPostsInGrid({
    posts,
    viewportWidth,
    viewportHeight,
    postGridColumns,
    postGridRows,
    leftBookOffset
  });

  const isExpanded = expansionState === 'expanded';
  const isCollapsed = expansionState === 'collapsed';
  const isShowingAll = hiddenState === 'full';

  // TODO: figure out if we get 5 rows sometimes when we should be getting 4?
  const gridTemplateDimensions = getPostGridTemplateDimensions({ postGridRows, postGridColumns });

  const postGridHeight = getCurrentPostGridHeight(isShowingAll, isExpanded, postGridRows, viewportHeight, horizontalBookGridCount);
  const gridContainerHeight = horizontalBookGridCount === 1 ? postGridHeight - 40 : postGridHeight;
  const gridPositionClass = gridPositionToClassName(gridPosition) as keyof ClassesType<typeof styles>;

  const postGridContents = <PostGridContents
    postsInGrid={postsInGrid}
    viewportHeight={viewportHeight}
    postGridColumns={postGridColumns}
    postGridRows={postGridRows}
    classes={classes}
    id={id}
    gridContainerHeight={gridContainerHeight}
    handleToggleFullyOpen={handleToggleFullyOpen}
    isExpanded={isExpanded}
    isShowingAll={isShowingAll}
    leftBookOffset={leftBookOffset}
    coverLoaded={coverImgLoaded}
    expandedNotYetMoved={expandedNotYetMoved}
    dpr={dpr}
  />

  const gridWrapperClassName = classNames(classes.postsImageGrid, {
    [classes.expandedImageGrid]: isExpanded,
    [classes.collapsedImageGrid]: isCollapsed,
    [classes.showAllImageGrid]: isShowingAll,
  });

  const gridClassName = classNames(classes.imageGrid, classes[gridPositionClass]);
  const croppedUrl = getCroppedUrl(img, coords ?? DEFAULT_SPLASH_ART_COORDINATES, leftBookOffset, dpr);

  // We have this useEffect checking the `complete` property, along with an `onLoad` on the `img` itself
  // We need both because `onLoad` isn't reliable, e.g. in the case where the cover images are cached.
  // This optimization is to delay loading any book's individual post images until that book's cover image is loaded
  useEffect(() => {
    if (coverImgRef.current?.complete) {
      setCoverImgLoaded(true);
    }
  }, []);

  useEffect(() => {
    const validDpr = window.devicePixelRatio >= 2 ? 2 : 1;
    setDpr(validDpr);
  }, []);

  return <div className={gridWrapperClassName} id={`PostsImageGrid-${id}`} style={{ height: postGridHeight }}>
    <div className={classes.imageGridHeader} onClick={() => handleToggleExpand(id)}>
      <span className={classes.toggleIcon}>
        <span className={classes.expandIcon}>+</span>
      </span>
      <h2 className={classes.imageGridHeaderTitle}>{header}</h2>
    </div>
    <div className={classes.imageGridContainer} style={{ height: gridContainerHeight }}>
      <div className={gridClassName} style={gridTemplateDimensions}>
        <div className={classNames(classes.imageGridBackgroundContainer, classes.imageGridBackgroundContainerCategory)}>
          <img src={croppedUrl} ref={coverImgRef} onLoad={() => setCoverImgLoaded(true)} className={classes.imageGridBackground} />
          <img src={croppedUrl} className={classNames([classes.imageGridBackground, classes.imageGridBackgroundReflected])} />
          <img src={croppedUrl} className={classes.imageGridBackground} />
          <img src={croppedUrl} className={classNames([classes.imageGridBackground, classes.imageGridBackgroundReflected])} />
        </div>
        {postGridContents}
      </div>
    </div>
  </div>;
}

const ImageGridPost = ({ post, imgSrc, imageGridId, handleToggleFullyOpen, imageClass, classes, isShowAll = false, showAllVisible = false }: {
  post: PostsTopItemInfo,
  imgSrc: string,
  imageGridId: string,
  imageClass: string,
  handleToggleFullyOpen: (id: string) => void,
  classes: ClassesType<typeof styles>,
  isShowAll?: boolean,
  showAllVisible?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const titleClassName = classNames(classes.imageGridPostTitle, {
    [classes.imageGridPostHidden]: isShowAll && showAllVisible
  });

  const authorClassName = classNames(classes.imageGridPostAuthor, {
    [classes.imageGridPostHidden]: isShowAll && showAllVisible
  });

  const showAllElementClassName = classNames(classes.showAllButton, {
    [classes.showAllButtonVisible]: showAllVisible,
    [classes.showAllButtonHidden]: !showAllVisible
  });


  const [hover, setHover] = useState(false)
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseOver = () => {
    setHover(!!imgRef.current?.complete);
  };

  const handleMouseLeave = () => setHover(false);

  return <Link className={classes.imageGridPost} key={post._id} to={isShowAll && showAllVisible ? (pathName + searchParams.toString())  : postGetPageUrl(post)}>
    <div className={classNames(classes.imageGridPostBody, {[classes.imageGridPostUnread]: currentUser && !post.isRead, [classes.imageGridPostRead]: currentUser && post.isRead})} onMouseOver={handleMouseOver} onMouseLeave={handleMouseLeave}>
      <div className={authorClassName}>
        {post?.user?.displayName}
      </div>
      <div className={titleClassName}>
        {post.title}
      </div>
      {isShowAll && <div
        key="show-all"
        className={showAllElementClassName}
        onClick={() => handleToggleFullyOpen(imageGridId)}>
        Show All
      </div>}
    </div>
    <div className={classNames([classes.imageGridPostBackgroundContainer, {[classes.imageGridPostBackgroundContainerHidden]: (isShowAll && showAllVisible)}])}>
      <img
        ref={imgRef}
        loading={'lazy'}
        className={classNames([classes.imageGridPostBackground, imageClass, { [classes.imageGridPostBackgroundCompleteHovered]: hover && !(isShowAll && showAllVisible) }])}
        src={imgSrc}
      />
      <img loading={'lazy'} className={classNames([classes.imageGridPostBackgroundReflected, classes.imageGridPostBackground, imageClass])} src={imgSrc} />
      <img loading={'lazy'} className={classNames([ classes.imageGridPostBackground, imageClass])} src={imgSrc} />
      <img loading={'lazy'} className={classNames([classes.imageGridPostBackgroundReflected, classes.imageGridPostBackground, imageClass])} src={imgSrc} />
    </div>
  </Link>;
}

const TopPostsPageComponent = registerComponent(
  "TopPostsPage",
  TopPostsPage,
  { styles },
);

declare global {
  interface ComponentTypes {
    TopPostsPage: typeof TopPostsPageComponent
  }
}

export default TopPostsPageComponent;

export {
  TopPostsPageComponent as TopPostsPage
}
