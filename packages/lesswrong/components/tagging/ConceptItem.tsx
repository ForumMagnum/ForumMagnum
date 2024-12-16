import React, { useState } from 'react';
import classNames from 'classnames';
import { Components, RouterLocation, registerComponent   } from '../../lib/vulcan-lib';
import { isFriendlyUI } from '@/themes/forumTheme';
import CommentIcon from '@material-ui/icons/ModeComment';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { ArbitalLogo } from '../icons/ArbitalLogo';
import DescriptionIcon from '@material-ui/icons/Description';
import TagIcon from '@material-ui/icons/LocalOffer';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { WikiTagMockup, WikiTagNode } from './types';

const ITEM_WIDTH = 400;


const ARBITAL_GREEN_DARK = "#004d40"

const styles = defineStyles("ConceptItem", (theme: ThemeType) => ({

  details: {
    flexGrow: 1,
    minWidth: 0, // flexbox black magic
  },
  titleWrapper: {
    display: "inline",
  },

  titleCardView: {
    // When card view is active, *all* post items change font weight,
    // even those that are not a card, so that all titles are consistent.
    fontWeight: 700,
  },
  titleCard: {
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    [theme.breakpoints.down("xs")]: {
      "-webkit-line-clamp": 3,
    },
  },
  meta: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  root: {
    maxWidth: ITEM_WIDTH,
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    // marginBottom: 6,
  },
  item: {
    cursor: "pointer",
    minHeight: 16,
    width: ITEM_WIDTH,
    maxWidth: ITEM_WIDTH,
    borderRadius: theme.borderRadius.default,
    padding: "2px 14px 2px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    // backgroundColor: "white",
    // boxShadow: "0 1px 5px rgba(0,0,0,.075)",
    // "&:hover .ConceptItem-wordCount": {
    //   opacity: 1,
    // },
    // transition: "background-color 0.1s ease",
    // "&:hover": {
    //   backgroundColor: theme.palette.grey[200],
    // },
  },
  wikiItem: {
    // backgroundColor: theme.palette.grey[100],
    // fontWeight: 700,
  },
  titleWikiItem: {
    // fontWeight: 500,
  },

  leftSideItems: {
    display: "flex",
    alignItems: "center",
    // gap: "8px",
    overflow: "hidden",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  baseScore: {
    minWidth: 20,
    fontSize: 13,
    color: theme.palette.grey[700],
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontWeight: 400,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: 13,
    fontFamily: theme.palette.fonts.sansSerifStack,
    // overflow: "hidden",
    minWidth: 0,
    opacity: 0.95,
    marginBottom: 1,
    display: "flex",
    alignItems: "baseline",
    lineHeight: "1.4",
  },
  titleText: {
    wordBreak: "break-word",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    overflow: "ellipsis",
    // '&:hover': {
    //   overflow: "visible",
    //   width: 500,
    //   backgroundColor: theme.palette.background.default,
    // },
  },
  karma: {
    fontSize: 12,
    color: theme.palette.grey[700],
    width: 20,
    marginBottom: 0,
    textAlign: "left",
  },
  postCount: {
    fontSize: 10,
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    gap: "2px",
    whiteSpace: "nowrap",
    marginTop: 0,
    marginLeft: 6,
    opacity: 0.9,
  },
  postCountNumber: {
    marginTop: 0,
  },
  rightSideItems: {
    display: "flex",
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    alignItems: "center",
    gap: "4px",
    color: theme.palette.grey[600],
  },
  wordCount: {
    width: 40,
    fontSize: 11,
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    // gap: "2px",
  },
  icons: {
    height: "0.8rem",
    width: "0.8rem",
    opacity: 0.5,
    marginRight: 2,
    // position: "relative",
  },


  titleItemRoot: {
    marginBottom: 24,
  },
  titleItem: {
    marginBottom: -16,
    backgroundColor: "unset",
    width: '100%',
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    // "&:hover $titlePostCount": {
    //   opacity: 1,
    // },
  },
  titleItemTitle: {
    fontWeight: 600,
    fontSize: 24,
    fontFamily: theme.palette.fonts.serifStack,
    fontVariant: "small-caps",
    whiteSpace: "nowrap",
    marginRight: 12,
  },
  titlePostCount: {
    fontSize: 12,
    color: theme.palette.grey[700],
    opacity: 0,
    transition: "opacity 0.1s ease",
  },
  // groupingItem: {
  //   backgroundColor: "unset",
  //   width: '100%',
  //   // borderRadius: theme.borderRadius.default,
  //   // padding: "0px 8px",
  //   display: "flex",
  //   alignItems: "center",
  //   justifyContent: "space-between",
  //   // marginBottom: 4,
  //   // boxShadow: "0 1px 5px rgba(0,0,0,.075)",
  //   // "&:hover .ConceptItem-wordCount": {
  //   //   opacity: 1,
  //   // },
  // },
  // groupingTitle: {
  //   fontWeight: 700,
  //   fontSize: 10,
  //   marginBottom: 4,
  //   fontVariant: "all-petite-caps",
  // },
  // groupingRightSideItems: {
  //   display: "flex",
  //   flexGrow: 0,
  //   flexShrink: 0,
  //   flexBasis: "auto",
  //   alignItems: "center",
  //   gap: "4px",
  //   // color: theme.palette.grey[600],
  // },
  // groupingItemChildrenCount: {
  //   fontSize: 9,
  //   fontWeight: 400,
  //   marginRight: 2,
  //   marginBottom: 3,
  //   color: theme.palette.grey[600],
  // },




  collapse: {
    marginRight: 7,
    opacity: 0,
    display: "flex",
    verticalAlign: "middle",
    // make the cursor change to pointer
    cursor: "pointer",

    "& span": {
      fontFamily: "monospace",
    },
  },
  collapseChevron: {
    width: 10,
    transition: "transform 0.2s",
    transform: "rotate(90deg)",
  },
  collapseChevronOpen: {
    transform: "rotate(180deg)",
  },
  collapseCharacter: {
    transform: 'translateY(0.75px)',
  },
  children: {
    marginLeft: 8,
    width: "calc(100vw - 16px)",
  },
  childrenContainer: {
    width: "100%",
    position: "relative",
  },
  childrenList: {
    marginTop: 12,
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    rowGap: "24px",
    maxWidth: ITEM_WIDTH * 4 + 36,
  },
  column: {
    display: "flex",
    flexDirection: "column",
    // gap: "1px",
    width: ITEM_WIDTH,
    flex: "0 0 auto",
  },
  showMoreChildren: {
    marginBottom: 8,
    marginTop: 8,
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontVariant: "normal",
    color: theme.palette.grey[600],
    fontWeight: 500,
    marginLeft: 8, // Adjust spacing as needed
    // marginBottom: 14,
  },
  showMoreChildrenInline: {
    fontSize: 11,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontVariant: "normal",
    color: theme.palette.grey[600],
    fontWeight: 400,
    marginLeft: 8, // Adjust spacing as needed
    // marginBottom: 14,
    cursor: "pointer",
    display: "inline", // Ensure it appears inline with the title
  },
  collapseInvisible: {
    opacity: 0,
    pointerEvents: "none",
  },
  childrenCount: {
    fontSize: 11,
    color: theme.palette.grey[600],
  },
  clickToPin: {
    fontSize: 11,
    color: theme.palette.primary.main,
    // fontWeight: 700,
    cursor: "pointer",
    opacity: 0,
    transition: "opacity 0.05s ease",
    "&:hover": {
      opacity: 1,
    },

  },
  itemPinned: {
    backgroundColor: theme.palette.grey[800],
    "& $title": {
      color: theme.palette.grey[100],
    },
    "& $rightSideItems": {
      color: theme.palette.grey[300],
    },
    "& $icons": {
      opacity: 0.7,
    },
    "& $clickToPin": {
      color: theme.palette.grey[300],
    },
    "&:hover": {
      backgroundColor: theme.palette.grey[900],
    },
  },
  tooltipHoverTitle: {
    margin: '0 24px',
    // marginRight: 32,
  },
  tooltipHoverPostCount: {
    // margin: '0 32px',
    // margin: 16,
    // marginLeft: 64,
  },
  arbitalIcon: {
    height: 10,
    width: 10,
    // color: theme.palette.primary.dark,
    // color: theme.palette.grey[500],
    color: ARBITAL_GREEN_DARK,
    // opacity: 0.9,
    marginLeft: 4,
    position: "relative",
    // top: 1,
    // backgroundColor: "darkgreen",
    // marginBottom: -5,
  },
  arbitalGreenColor: {
    color: ARBITAL_GREEN_DARK,
  },
}));



interface ConceptItemProps {
  wikitag: WikiTagNode;
  nestingLevel: number;
  index?: number;
  onHover?: (wikitag: WikiTagMockup | null) => void;
  onClick?: (wikitag: WikiTagMockup) => void;
  pinnedWikiTag?: WikiTagMockup | null;
  showArbitalIcon?: boolean;
}
  

// Helper function to split items into columns
function splitIntoColumns(items: WikiTagNode[], itemsPerColumn = 12): WikiTagNode[][] {
  const columns: WikiTagNode[][] = [];
  for (let i = 0; i < items.length; i += itemsPerColumn) {
    columns.push(items.slice(i, i + itemsPerColumn));
  }
  return columns;
}

const ConceptItem = ({
  wikitag,
  nestingLevel,
  index,
  onHover,
  onClick,
  pinnedWikiTag,
  showArbitalIcon
}: ConceptItemProps) => {
  const classes = useStyles(styles);
  const defaultCollapsed = index !== undefined && index >= 3 && index < 6;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showingAllChildren, setShowingAllChildren] = useState(false);

  const { ForumIcon, TagsTooltip, LWTooltip } = Components;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    if (collapsed) {
      setShowingAllChildren(false);
    }
  };

  const hasChildren = wikitag.children && wikitag.children.length > 0;
  const isPinned = pinnedWikiTag?._id === wikitag._id;

  const totalChildren = wikitag.children?.length || 0;

  // Constants
  const ITEMS_PER_COLUMN = 8;
  const MAX_INITIAL_COLUMNS = 3; // Adjust as needed
  const MAX_INITIAL_ITEMS = ITEMS_PER_COLUMN * MAX_INITIAL_COLUMNS; // Calculate based on columns

  // Calculate the number of items to show
  const showingAllItems = showingAllChildren || totalChildren <= MAX_INITIAL_ITEMS;

  const itemsToShowCount = showingAllItems
    ? totalChildren
    : MAX_INITIAL_ITEMS;

  // Sort and slice the children
  const sortedChildren = wikitag.children
    .sort((a, b) => (b.baseScore || 0) - (a.baseScore || 0))
    .slice(0, itemsToShowCount);

  // Split into columns
  const columns = splitIntoColumns(sortedChildren, ITEMS_PER_COLUMN);

  const remainingItems = totalChildren - itemsToShowCount;

  const isWikiItem = wikitag.description_length > 2000;

  // Title item (for nestingLevel === 0)
  const titleItem = (
    <div className={classes.titleItem}>
      {/* {collapseToggle} */}
      <div className={classes.leftSideItems}>
        <div className={classes.titleItemTitle}>
          {wikitag.name}
        </div>
        <div className={classes.titlePostCount}>{wikitag.postCount} posts</div>
      </div>
    </div>
  );

  // Regular item (for nestingLevel > 0)
  const regularItem = (
    // <TagsTooltip tagSlug={wikitag.slug} hash={wikitag.slug} noPrefetch previewPostCount={0}>
      <div
        className={classNames(classes.item, {
          [classes.itemPinned]: isPinned,
          [classes.wikiItem]: isWikiItem,
        })}
      >
        {/* {collapseToggle} */}
        <div className={classes.leftSideItems}>
          <div className={classes.karma}>{wikitag.baseScore || 0}</div>
          {/* {showArbitalIcon && wikitag.isArbitalImport && <LWTooltip title="This content was imported in part or entirely from Arbital.com" placement="right-start">
            <ArbitalLogo className={classes.arbitalIcon} strokeWidth={0.7} />
          </LWTooltip>} */}
          <div className={classNames(classes.title, { [classes.titleWikiItem]: isWikiItem })}>
            <TagsTooltip
              tagSlug={wikitag.slug}
              hash={wikitag.slug}
              noPrefetch
              previewPostCount={0}
              placement='right-start'
              popperClassName={classes.tooltipHoverTitle}
            >
              <span className={classNames(classes.titleText, { [classes.arbitalGreenColor]: wikitag.isArbitalImport })}>{wikitag.name}</span>
            </TagsTooltip>
            {wikitag.postCount > 0 && (
              <span className={classes.postCount}>
                <TagsTooltip
                  tagSlug={wikitag.slug}
                  hash={wikitag.slug}
                  noPrefetch
                  previewPostCount={8}
                  hideDescription
                  placement='bottom-start'
                  popperClassName={classes.tooltipHoverPostCount}
                >
                  (<span className={classes.postCountNumber}>{wikitag.postCount}</span>)
                </TagsTooltip>
              </span>
            )}
            {showArbitalIcon && wikitag.isArbitalImport && <LWTooltip title="This content was imported in part or entirely from Arbital.com" placement="right-start">
              <ArbitalLogo className={classes.arbitalIcon} strokeWidth={0.7} />
            </LWTooltip>}
          </div>
        </div>
      </div>
    // </TagsTooltip>
  );

  // Decide which item to render
  const itemToRender = nestingLevel === 0 ? titleItem : regularItem;

  return (
    <div
      className={classNames(classes.root, { [classes.titleItemRoot]: nestingLevel === 0 })}
    >
      {itemToRender}

      {/* Render Children */}
      {!collapsed && hasChildren && (
        <div className={classes.children}>
          <div className={classes.childrenContainer}>
            <div className={classes.childrenList}>
              {columns.map((columnItems, columnIndex) => (
                <div key={columnIndex} className={classes.column}>
                  {columnItems.map((childPage, idx) => (
                    <ConceptItem
                      key={childPage._id}
                      wikitag={childPage}
                      nestingLevel={nestingLevel + 1}
                      index={idx}
                      onHover={onHover}
                      onClick={onClick}
                      pinnedWikiTag={pinnedWikiTag}
                      showArbitalIcon={showArbitalIcon}
                    />
                  ))}
                </div>
              ))}
            </div>
            {/* Show "Show more"/"Show less" button for all nesting levels */}
            {hasChildren && totalChildren > MAX_INITIAL_ITEMS && (
              <div
                className={classes.showMoreChildren}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showingAllItems) {
                    setShowingAllChildren(true);
                  } else {
                    setShowingAllChildren(false);
                  }
                }}
              >
                {!showingAllItems
                  ? `Show ${remainingItems} more`
                  : 'Show less'
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ConceptItemComponent = registerComponent('ConceptItem', ConceptItem);

export default ConceptItemComponent;

declare global {
  interface ComponentTypes {
    ConceptItem: typeof ConceptItemComponent
  }
}
function useRouter(): { location: any; } {
  throw new Error('Function not implemented.');
}

