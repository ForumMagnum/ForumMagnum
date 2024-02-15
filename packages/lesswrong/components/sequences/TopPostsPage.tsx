import React, { useEffect, useState } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { useLocation } from '../../lib/routeUtil';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { usePostBySlug } from '../posts/usePost';
import { LWReviewWinnerSortOrder, getCurrentTopPostDisplaySettings } from './TopPostsDisplaySettings';

import { gql, useQuery } from '@apollo/client';
import classNames from 'classnames';
import range from 'lodash/range';

/** In theory, we can get back posts which don't have review winner info, but given we're explicitly querying for review winners... */
type GetAllReviewWinnersQueryResult = (PostsTopItemInfo & { reviewWinner: Exclude<PostsTopItemInfo['reviewWinner'], null> })[]

type ExpansionState = 'expanded' | 'collapsed' | 'default';
type HiddenState = 'full' | 'hidden';
export type CoordinatePosition = 'left' | 'middle' | 'right';

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

interface GetPostGridContentsArgs extends PostGridDimensions {
  postsInGrid: (PostsTopItemInfo | null)[][];
  viewportHeight: number;
  classes: ClassesType<typeof styles>;
  id: string;
  handleToggleFullyOpen: (id: string) => void;
  isExpanded: boolean;
  isShowingAll: boolean;
  leftBookOffset: number;
  coversLoading: boolean;
}

interface GetPostGridCellContentsArgs extends Omit<GetPostGridContentsArgs, 'postsInGrid'> {
  post: PostsTopItemInfo | null;
  rowIdx: number;
  columnIdx: number;
}

interface GetSplashArtUrlArgs {
  reviewWinnerArt?: ReviewWinnerTopPostsPage_reviewWinnerArt;
  leftBookOffset: number;
  fallbackUrl: string;
}

const MAX_GRID_SIZE = 6;

// TODO: not actually sure we want to use default coordinates if coordinates are missing
// And even if we do, these values are definitely wrong (i.e. need to figure out aspect ratio)
const DEFAULT_SPLASH_ART_COORDINATES: Omit<SplashArtCoordinates, '_id' | 'reviewWinnerArtId'> = {
  leftHeightPct: .2, leftWidthPct: .2, leftXPct: .2, leftYPct: .2,
  middleHeightPct: .2, middleWidthPct: .2, middleXPct: .2, middleYPct: .2,
  rightHeightPct: .2, rightWidthPct: .2, rightXPct: .2, rightYPct: .2,
};

// TODO: update the description to be appropriate for this page
const description = `All of ${siteNameWithArticleSetting.get()}'s posts, filtered and sorted however you want`;

let candidateImages = [
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,fl_progressive,q_auto/v1707268870/TopPostsPageCandidateImages/51d4e735-f328-436b-af1f-72f8a393114e.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,fl_progressive,q_auto/v1707268870/TopPostsPageCandidateImages/9a46ebf2-a5f4-4520-827f-5e723164a857.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,fl_progressive,q_auto/v1707268870/TopPostsPageCandidateImages/41b79ce2-bd03-45a5-bd9e-a7761a539b0a.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,fl_progressive,q_auto/v1707268870/TopPostsPageCandidateImages/d257c3a8-df69-4da5-ae4c-0fc01bd800d0.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,fl_progressive,q_auto/v1707268870/TopPostsPageCandidateImages/53236167-d294-4870-b65b-c793a83be8e0.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,fl_progressive,q_auto/v1707268870/TopPostsPageCandidateImages/b8b7586b-3147-4df3-8b46-e2d48ff23620.png",
]

const sectionsInfo = {
  rationality: {
    title: "Rationality",
    img: candidateImages[0],
    tag: "Rationality",
  },
  optimization: {
    title: "Optimization",
    img: candidateImages[1],
    tag: "World Optimization"
  },
  modeling: {
    title: "World",
    img: candidateImages[2],
    tag: "World Modeling"
  },
  ai: {
    title: "AI Alignment",
    img: candidateImages[3],
    tag: "AI"
  },
  practical: {
    title: "Practical",
    img: candidateImages[4],
    tag: "Practical"
  },
  misc: {
    title: "Miscellany",
    img: candidateImages[5],
    tag: null
  }
};

const yearGroupInfo = {
  2022: {
    img: candidateImages[0],
  },
  2021: {
    img: candidateImages[1],
  },
  2020: {
    img: candidateImages[2],
  },
  2019: {
    img: candidateImages[3],
  },
  2018: {
    img: candidateImages[4],
  },
};

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

const styles = (theme: ThemeType) => ({
  widerColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    width: 'min-content'
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
    '&:hover $imageGridHeader': {
      background: 'rgb(241 209 150 / 40%)'
    },
    '&:hover $toggleIcon': {
      opacity: 1
    },
    [theme.breakpoints.down(800)]: {
      flexDirection: "column",
    }
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
      transition: 'width 0.5s ease-in-out',
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
      background: 'rgb(241 209 150 / 75%)'
    },
    [theme.breakpoints.up(800)]: {
      width: 40,
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
    transition: 'width 0.5s ease-in-out',
    [theme.breakpoints.down(800)]: {
      transition: 'height 0.5s ease-in-out',
    }
  },
  imageGrid: {
    display: "grid",
    position: "absolute",
    top: 0,
    overflow: "hidden",
    gridAutoFlow: 'row',
    transition: 'left 0.5s ease-in-out',
    '&:hover $imageGridPostBackground': {
      transitionDelay: '0.2s'
    },
    '&:has($imageGridPost:hover) $imageGridBackground': {
      opacity: 0
    }
  },
  // If we want to display a grid with more than 6 items, increase this number
  ...Object.fromEntries(Array.from({ length: MAX_GRID_SIZE }, (_, i) => gridPositionToClassesEntry(theme, i))),
  imageGridBackground: {
    top: 0,
    right: 0,
    // height: "120%",
    // width: "100%",
    zIndex: -1,
    position: "absolute",
    objectFit: "cover",
    objectPosition: "right",
    transition: "opacity 0.2s ease-in",
    opacity: 1,
  },
  showAllBackgroundWrapper: {
    '&:hover $imageGridPostBackground': {
      display: "block",
      opacity: 1,
      transitionDelay: "0s",
      zIndex: 2
    },
    '&:hover $imageGridPostBackgroundBackground': {
      zIndex: 1,
      opacity: 1
    }
  },
  showAllPostItemWrapper: {
    height: 120,
    width: 120,
    position: 'relative',
  },
  collapseButtonWrapper: {
    height: 120,
    width: 120,
    position: 'relative',
  },
  showAllButton: {
    ...theme.typography.commentStyle,
    height: 120,
    width: 120,
    position: 'absolute',
    top: 0,
    background: theme.palette.greyAlpha(.8),
    color: theme.palette.text.invertedBackgroundText,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    cursor: 'pointer',
    opacity: .8,
    transition: "left 0.2s ease-in 0.5s",
    borderRight: "1px solid white",
    borderBottom: "1px solid white",
  },
  showAllButtonVisible: {
    left: 0
  },
  showAllButtonHidden: {
    left: 120,
    transition: 'left 0.2s ease-in 0s'
  },
  showAllPostItem: {
    height: 120,
    width: 120,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  imageGridPost: {
    ...theme.typography.commentStyle,
    color: "white",
    display: "flex",
    textWrap: "balance",
    cursor: "pointer",

    '&:hover': {
      opacity: 1 // Overwriting default <a> styles
    },
    
    '&:hover .hoverBackground': {
      opacity: 1
    },

    '&&&:hover $imageGridPostBackground': {
      display: "block",
      opacity: 1,
      transitionDelay: "0s",
      zIndex: 2
    },
    '&&&:hover $imageGridPostBackgroundBackground': {
      zIndex: 1,
      opacity: 1
    },
    // TODO: figure out how to also make this work correctly for the header
    // '&&:nth-child(4n + 1) $imageGridPostBody': {
    //   borderBottom: "none"
    // },

    height: 'inherit',
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
    padding: 4,
    paddingTop: 0,
    borderRight: "1px solid white",
    borderBottom: "1px solid white",
    background: "linear-gradient(0deg, #00000038,  transparent 50%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
    zIndex: 4,
    '&&&:hover': {
      background: "rgb(0 0 0 / 27%)",
      backdropFilter: "none",
      color: "white"
    },
    '&:hover $imageGridPostAuthor': {
      opacity: 1
    },
  },
  emptyGridCell: {
    borderRight: "1px solid white",
    borderBottom: "1px solid white",
    zIndex: 3,
  },
  imageGridPostBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    // We could do 100% here, but it would cause us to clip the bottom of the image in some 2 column cases
    width: 1080,
    opacity: 0,
    objectPosition: "right",
    zIndex: -1,
    transition: "opacity 0.2s ease-in",
    maskImage: "linear-gradient(rgba(0,0,0,1) 95%, rgba(0,0,0,0) 100%)",
  },
  imageGridPostBackgroundBackground: {
    bottom: 0,
    left: 0,
    filter: 'blur(50px)',
    position: 'absolute',
    opacity: 0,
    zIndex: -2,
  },
  imageGridPostAuthor: {
    opacity: 0,
    textAlign: "right",
    paddingTop: 2,
    fontWeight: 600,
    paddingRight: 2,
    transition: "opacity 0.2s ease-in",
    paddingLeft: 12
  },
  imageGridPostTitle: {
    transition: "opacity 0.2s ease-in",
    filter: "drop-shadow(0px 0px 2px black)",
  },
  // TODO: anything here?
  expandIcon: {}
});

function sortReviewWinners(reviewWinners: GetAllReviewWinnersQueryResult, sortOrder: LWReviewWinnerSortOrder) {
  const sortedReviewWinners = [...reviewWinners];
  switch (sortOrder) {
    case 'curated':
      return sortedReviewWinners.sort((a, b) => a.reviewWinner.curatedOrder - b.reviewWinner.curatedOrder);
    case 'year':
      return sortedReviewWinners.sort((a, b) => {
        const yearDiff = a.reviewWinner.reviewYear - b.reviewWinner.reviewYear;
        if (yearDiff === 0) {
          return a.reviewWinner.reviewRanking - b.reviewWinner.reviewRanking;
        }
        return yearDiff;
      });
  }
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

function getHiddenState(gridId: string, fullyOpenGridId?: string): HiddenState | undefined {
  if (!fullyOpenGridId) {
    return undefined;
  }

  return gridId === fullyOpenGridId ? 'full' : 'hidden';
}

function getCurrentPostGridHeight(isShowingAll: boolean, isExpanded: boolean, postGridRows: number, viewportHeight: number, bookGridColumns: number) {
  const isMobile = bookGridColumns === 1;
  // On mobile, the header is no longer transformed, and as such has its height take up space in the post grid
  const headerAdjustment = isMobile ? 40 : 0;

  // If we're in the "Show All" state, we want enough height to show every row
  if (isShowingAll) {
    return (postGridRows * 120) + headerAdjustment;
  }

  // If we're not on mobile, return height based on the default viewport "height" assigned to each post grid
  if (!isMobile) {
    return viewportHeight * 120;
  }

  // If we're on mobile and in the expanded state, we use the default viewport height
  if (isExpanded) {
    return (viewportHeight * 120) + headerAdjustment;
  }

  // Otherwise, we're in the unexpanded mobile state, which only has one row visible
  return 120 + headerAdjustment;
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

const TopPostsPage = ({ classes }: {classes: ClassesType<typeof styles>}) => {
  const location = useLocation();
  const { query } = location;

  const [expansionState, setExpansionState] = useState<Record<string, ExpansionState>>({});
  const [fullyOpenGridId, setFullyOpenGridId] = useState<string>();
  const handleToggleExpand = (id: string) => {
    const newState = getNewExpansionState(expansionState, id);

    // If any grid is in the "show all" state, collapse that before changing the expansion state of any grid
    if (fullyOpenGridId !== undefined) {
      setFullyOpenGridId(undefined);
    }

    setExpansionState(newState);
  }

  const toggleFullyOpenGridId = (id: string) => {
    if (id === fullyOpenGridId) {
      setFullyOpenGridId(undefined);
    } else {
      setFullyOpenGridId(id);
    }
  };

  const { currentSortOrder } = getCurrentTopPostDisplaySettings(query);

  const { SectionTitle, HeadTags, TopPostsDisplaySettings, ContentStyles, ContentItemBody } = Components;

  const { post: reviewDescriptionPost } = usePostBySlug({ slug: 'top-posts-review-description' });

  const { data } = useQuery(gql`
    query GetAllReviewWinners {
      GetAllReviewWinners {
        ...PostsTopItemInfo
      }
    }
    ${fragmentTextForQuery('PostsTopItemInfo')}
  `);

  const reviewWinnersWithPosts: GetAllReviewWinnersQueryResult = [...data?.GetAllReviewWinners ?? []];
  const sortedReviewWinners = sortReviewWinners(reviewWinnersWithPosts, currentSortOrder);

  function getPostsImageGrid(posts: PostsTopItemInfo[], img: string, header: string, id: string, gridPosition: number) {
    const props = {
      key: id,
      id,
      posts,
      classes,
      img,
      header,
      gridPosition,
      expansionState: expansionState[id],
      handleToggleExpand,
      handleToggleFullyOpen: toggleFullyOpenGridId,
      hiddenState: getHiddenState(id, fullyOpenGridId)
    };
    return <PostsImageGrid {...props} />;
  }

  const sectionGrid = Object.entries(sectionsInfo).map(([id, { title, img }], index) => {
    const posts = sortedReviewWinners.map((post) => post).filter(post => post.reviewWinner?.category === id);
    return getPostsImageGrid(posts, img, title, id, index);
  });

  const yearGrid = Object.entries(yearGroupInfo).sort(([a], [b]) => parseInt(b) - parseInt(a)).map(([year, { img }], index) => {
    const posts = sortedReviewWinners.filter(({ reviewWinner }) => reviewWinner?.reviewYear.toString() === year);
    return getPostsImageGrid(posts, img, year, year, index);
  });

  return (
    <>
      <HeadTags description={description} />
      {/** TODO: change pageContext when/if we rename component */}
      <AnalyticsContext pageContext="topPostsPage">
        
        <div className={classes.widerColumn}>
          <div className={classes.description}>
            <SectionTitle title={preferredHeadingCase("Best of LessWrong")} />
            <ContentStyles contentType="post">
              {reviewDescriptionPost && <ContentItemBody dangerouslySetInnerHTML={{__html: reviewDescriptionPost.contents?.html ?? ''}} description={`A description of the top posts page`}/>}
            </ContentStyles>
          </div>
          <div>
            <TopPostsDisplaySettings />
            <div className={classes.gridContainer}>
              {currentSortOrder === 'curated' ? sectionGrid : yearGrid}
            </div>
          </div>
        </div>
      </AnalyticsContext>
    </>
  );
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

function getPostGridContents(args: GetPostGridContentsArgs) {
  const { postsInGrid, ...cellArgs } = args;
  return postsInGrid.map((row, rowIdx) => row.map((post, columnIdx) => getPostGridCellContents({ post, rowIdx, columnIdx, ...cellArgs })));
}

function getPostGridCellContents(args: GetPostGridCellContentsArgs): JSX.Element {
  const { post, rowIdx, columnIdx, viewportHeight, postGridColumns, postGridRows, classes, id, handleToggleFullyOpen, isExpanded, isShowingAll, leftBookOffset, coversLoading } = args;
  const isLastCellInDefaultView = (rowIdx === (viewportHeight - 1)) && (columnIdx === (postGridColumns - 1));
  const isLastCellInShowingAllView = (rowIdx === (postGridRows - 1)) && (columnIdx === (postGridColumns - 1));

  // TODO: style with appropriate width/height for offsetting the collapse-all button
  const emptyCellElement = <div key={`empty-${rowIdx}-${columnIdx}`} className={classes.emptyGridCell} />;

  // TODO: replace this functionality (incl. in any components that use it) with the actual image url from the post/review winner
  const backgroundImageIndex = (rowIdx * postGridRows) + columnIdx;

  if (!post) {
    return emptyCellElement;
  }

  const reviewWinnerArt = post.reviewWinner?.reviewWinnerArt ?? undefined;
  const imgSrc = coversLoading ? getSplashArtUrl({ reviewWinnerArt, leftBookOffset, fallbackUrl: '' }) : '';

  if (isLastCellInDefaultView) {

    const imageGridPostElement = <ImageGridPost
      key={post._id}
      post={post}
      imgSrc={imgSrc}
      classes={classes}
      index={backgroundImageIndex}
      leftBookOffset={leftBookOffset}
    />;

    // TODO: make the background image show for the show all/post item button wrapper
    // TODO: hide the post title when the show all button is visible
    return <ShowAllPostItem
      key="show-all"
      imageGridId={id}
      imageGridPost={imageGridPostElement}
      handleToggleFullyOpen={handleToggleFullyOpen}
      showAllVisible={isExpanded && !isShowingAll}
      backgroundImageIndex={backgroundImageIndex}
      imgSrc={imgSrc}
      classes={classes}
    />;
  } else if (isShowingAll && isLastCellInShowingAllView) {
    return (
      <div
        key="collapse-all"
        className={classes.collapseButtonWrapper}
      >
        <div
          className={classNames(classes.showAllButton, classes.showAllButtonVisible)}
          onClick={() => handleToggleFullyOpen(id)}>
          Collapse
        </div>
      </div>
    );
  }



  return (
    <ImageGridPost
      key={post._id}
      post={post}
      imgSrc={imgSrc}
      classes={classes}
      index={backgroundImageIndex}
      leftBookOffset={leftBookOffset}
    />
  );
}

function getPostGridTemplateDimensions({ postGridRows, postGridColumns }: PostGridDimensions) {
  return {
    gridTemplateRows: `repeat(${postGridRows}, 120px)`,
    gridTemplateColumns: `repeat(${postGridColumns}, 120px)`
  };
}

function getSplashArtUrl({ reviewWinnerArt, leftBookOffset, fallbackUrl }: GetSplashArtUrlArgs) {
  if (!reviewWinnerArt) {
    return fallbackUrl;
  }

  let coordinatePosition: CoordinatePosition | undefined = BOOK_OFFSETS_TO_COORDINATE_POSITIONS[leftBookOffset];
  if (!coordinatePosition) {
    console.error(`Invalid leftBookOffset ${leftBookOffset} used to derive coordinate position`);
    coordinatePosition = 'left';
  }

  const {
    splashArtImageUrl,
    activeSplashArtCoordinates,
  } = reviewWinnerArt;

  const  {
    [`${coordinatePosition}XPct` as const]: xPct,
    [`${coordinatePosition}YPct` as const]: yPct,
    [`${coordinatePosition}WidthPct` as const]: widthPct,
    [`${coordinatePosition}HeightPct` as const]: heightPct,
    [`${coordinatePosition}Flipped` as const]: flipped,
  } = activeSplashArtCoordinates ?? DEFAULT_SPLASH_ART_COORDINATES;

  const newXPct = xPct - (widthPct * leftBookOffset); 
  const newWidthPct = widthPct*3; // this will break the url if it goes above 1, but it shouldn't
  const newHeightPct = 1 - yPct; // I think we just want the full image to flow down below

  const cropPathParam = `c_crop,h_${newHeightPct},w_${newWidthPct},x_${newXPct},y_${yPct}`;
  const croppedImageUrl = splashArtImageUrl.replace('upload/', `upload/${cropPathParam}/`).replace('upload/', `upload/${flipped ? 'a_hflip/' : ''}`);

  return croppedImageUrl;
}

const PostsImageGrid = ({ posts, classes, img, header, id, gridPosition, expansionState, handleToggleExpand, handleToggleFullyOpen, hiddenState }: {
  posts: PostsTopItemInfo[],
  classes: ClassesType<typeof styles>,
  img: string,
  header: string,
  id: string,
  gridPosition: number,
  expansionState: ExpansionState,
  handleToggleExpand: (id: string) => void,
  handleToggleFullyOpen: (id: string) => void,
  hiddenState?: 'hidden' | 'full',
}) => {
  const screenWidth = useWindowWidth(2000);
  /** 
   * The number of grids we'll show horizontally before wrapping over to the next "row" of grids on the screen.
   * 
   * width < 800px:             1,
   * 800px >= width < 1200px:   2,
   * 1200px >= width:           3
   */
  const horizontalBookGridCount = Math.min(Math.max(Math.floor(screenWidth / 400), 1), 3);

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

  const [coversLoading, setCoversLoading] = useState(false);

  const postGridContents = getPostGridContents({
    postsInGrid,
    viewportHeight,
    postGridColumns,
    postGridRows,
    classes,
    id,
    handleToggleFullyOpen,
    isExpanded,
    isShowingAll,
    leftBookOffset,
    coversLoading
  });

  // TODO: figure out if we get 5 rows sometimes when we should be getting 4?
  const gridTemplateDimensions = getPostGridTemplateDimensions({ postGridRows, postGridColumns });

  const postGridHeight = getCurrentPostGridHeight(isShowingAll, isExpanded, postGridRows, viewportHeight, horizontalBookGridCount);
  const gridContainerHeight = horizontalBookGridCount === 1 ? postGridHeight - 40 : postGridHeight;
  const gridPositionClass = gridPositionToClassName(gridPosition) as keyof ClassesType<typeof styles>;

  const gridWrapperClassName = classNames(classes.postsImageGrid, {
    [classes.expandedImageGrid]: isExpanded, 
    [classes.collapsedImageGrid]: isCollapsed,
    [classes.showAllImageGrid]: isShowingAll,
  });

  const gridClassName = classNames(classes.imageGrid, classes[gridPositionClass]);

  useEffect(() => {
    setCoversLoading(true);
  }, [])

  return <div className={gridWrapperClassName} id={`PostsImageGrid-${id}`} style={{ height: postGridHeight }}>
    <div className={classes.imageGridHeader} onClick={() => handleToggleExpand(id)}>
      <span className={classes.toggleIcon}>
        <span className={classes.expandIcon}>+</span>
      </span>
      <h2 className={classes.imageGridHeaderTitle}>{header}</h2>
    </div>
    <div className={classes.imageGridContainer} style={{ height: gridContainerHeight }}>
      <div className={gridClassName} style={gridTemplateDimensions}> 
        <img src={img} className={classes.imageGridBackground} />
        {postGridContents}
      </div>
    </div>
  </div>;
}

const ShowAllPostItem = ({ imageGridId, imageGridPost, showAllVisible, handleToggleFullyOpen, backgroundImageIndex, imgSrc, classes }: {
  imageGridId: string,
  imageGridPost: JSX.Element,
  showAllVisible: boolean,
  handleToggleFullyOpen: (id: string) => void,
  backgroundImageIndex: number,
  imgSrc: string,
  classes: ClassesType<typeof styles>
}) => {
  const postItemClassName = classNames(classes.showAllPostItem, {
    [classes.imageGridPostHidden]: showAllVisible
  });

  const showAllElementClassName = classNames(classes.showAllButton, {
    [classes.showAllButtonVisible]: showAllVisible,
    [classes.showAllButtonHidden]: !showAllVisible
  });

  return <div className={classes.showAllBackgroundWrapper}>
    <div className={classes.showAllPostItemWrapper}>
      <div className={postItemClassName}>
        {imageGridPost}
      </div>
      <div
        key="show-all"
        className={showAllElementClassName}
        onClick={() => handleToggleFullyOpen(imageGridId)}>
          Show All
      </div>
    </div>
    <img className={classes.imageGridPostBackground} src={imgSrc}/>
  </div>;
};

const ImageGridPost = ({ post, index, leftBookOffset, imgSrc, classes, offscreen = false, hidden = false }: {
  post: PostsTopItemInfo,
  index: number,
  leftBookOffset: number,
  imgSrc: string,
  classes: ClassesType<typeof styles>,
  offscreen?: boolean,
  hidden?: boolean,
}) => {
  const titleClassName = classNames(classes.imageGridPostTitle, {
    [classes.imageGridPostOffscreen]: offscreen && !hidden,
    [classes.imageGridPostHidden]: hidden
  });

  return <Link className={classes.imageGridPost} key={post._id} to={postGetPageUrl(post)}>
    <div className={classes.imageGridPostBody}>
      <div className={classes.imageGridPostAuthor}>
        {post?.user?.displayName}
      </div>
      <div className={titleClassName}>
        {post.title}
      </div>
    </div>
    <img className={classes.imageGridPostBackground} src={imgSrc}/>
    <img className={classes.imageGridPostBackgroundBackground} src={imgSrc}/>
  </Link>;
}

const TopPostsPageComponent = registerComponent(
  "TopPostsPage",
  TopPostsPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    TopPostsPage: typeof TopPostsPageComponent
  }
}
