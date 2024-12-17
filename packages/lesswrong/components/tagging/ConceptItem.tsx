import React, { useState } from 'react';
import classNames from 'classnames';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { WikiTagNode } from './types';
import { ArbitalLogo } from '../icons/ArbitalLogo';
import { Link } from '@/lib/reactRouterWrapper';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { useWindowSize } from "@/components/hooks/useScreenWidth";

const ITEM_WIDTH = 300;
const COLUMN_GAP = 8;

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
  },
  item: {
    cursor: "pointer",
    minHeight: 16,
    width: ITEM_WIDTH,
    maxWidth: ITEM_WIDTH,
    borderRadius: theme.borderRadius.default,
    padding: "2px 0px",
    paddingLeft: '2px',
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wikiItem: {},
  titleWikiItem: {},

  leftSideItems: {
    display: "flex",
    alignItems: "center",
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
  },
  icons: {
    height: "0.8rem",
    width: "0.8rem",
    opacity: 0.5,
    marginRight: 2,
  },

  titleItemRoot: {
    marginBottom: 24,
  },
  titleItem: {
    backgroundColor: "unset",
    width: '100%',
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
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
    width: "calc(100vw - 16px)",
  },
  childrenContainer: {
    width: "100%",
    position: "relative",
  },
  childrenList: {
    width: "100%",
    display: "flex",
    gap: "8px",
    rowGap: "24px",
    maxWidth: (ITEM_WIDTH * 4) + 36,
  },
  column: {
    display: "flex",
    flexDirection: "column",
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
    marginLeft: 8,
  },
  showMoreChildrenInline: {
    fontSize: 11,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontVariant: "normal",
    color: theme.palette.grey[600],
    fontWeight: 400,
    marginLeft: 8,
    cursor: "pointer",
    display: "inline",
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
  },
  tooltipHoverPostCount: {},
  arbitalIcon: {
    height: 10,
    width: 10,
    color: ARBITAL_GREEN_DARK,
    marginLeft: 4,
    position: "relative",
  },
  arbitalGreenColor: {
    color: ARBITAL_GREEN_DARK,
  },
}));

interface ConceptItemProps {
  wikitag: WikiTagNode;
  nestingLevel: number;
  index?: number;
  onHover?: (wikitag: WikiTagNode | null) => void;
  onClick?: (wikitag: WikiTagNode) => void;
  pinnedWikiTag?: WikiTagNode | null;
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

  // First calculate visible columns and itemsToShowCount
  const windowSize = useWindowSize();
  const calculateVisibleColumns = () => {
    const availableWidth = windowSize.width - 32;
    const columnsWithGaps = Math.floor(availableWidth / (ITEM_WIDTH + COLUMN_GAP));
    // Ensure at least 1 column is shown
    return Math.max(1, Math.min(columnsWithGaps, MAX_INITIAL_COLUMNS));
  };
  const visibleColumns = calculateVisibleColumns();
  
  const itemsToShowCount = showingAllItems
    ? totalChildren
    : visibleColumns * ITEMS_PER_COLUMN;

  // Then use itemsToShowCount to sort and slice the children
  const sortedChildren = wikitag.children
    .sort((a, b) => (b.baseScore || 0) - (a.baseScore || 0))
    .slice(0, itemsToShowCount);

  // Then split into columns
  const columns = splitIntoColumns(sortedChildren, ITEMS_PER_COLUMN);

  const remainingItems = totalChildren - itemsToShowCount;

  const isWikiItem = (wikitag.description?.html?.length ?? 0) > 2000;

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
    <div
      className={classNames(classes.item, {
        [classes.itemPinned]: isPinned,
        [classes.wikiItem]: isWikiItem,
      })}
    >
      <div className={classes.leftSideItems}>
        <div className={classes.karma}>{wikitag.baseScore || 0}</div>
        <div className={classNames(classes.title, { [classes.titleWikiItem]: isWikiItem })}>
          <TagsTooltip
            tagSlug={wikitag.slug}
            hash={wikitag.slug}
            noPrefetch
            previewPostCount={0}
            placement='right-start'
            popperClassName={classes.tooltipHoverTitle}
          >
            <span className={classNames(classes.titleText, { [classes.arbitalGreenColor]: wikitag.isArbitalImport && showArbitalIcon })}>
              <Link to={tagGetUrl({slug: wikitag.slug})}>
                {wikitag.name}
              </Link>
            </span>
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
            <div className={classNames(classes.childrenList)} style={{forceWrap: showingAllChildren}}>
              {columns.slice(0, showingAllChildren ? columns.length : visibleColumns).map((columnItems, columnIndex) => (
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
            {/* Update the show more button text */}
            {hasChildren && totalChildren > itemsToShowCount && (
              <div
                className={classes.showMoreChildren}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowingAllChildren(!showingAllChildren);
                }}
              >
                {!showingAllChildren
                  ? `Show ${totalChildren - itemsToShowCount} more`
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

