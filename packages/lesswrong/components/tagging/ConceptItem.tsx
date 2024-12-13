import React, { useState } from 'react';
import classNames from 'classnames';
import { Components, RouterLocation, registerComponent   } from '../../lib/vulcan-lib';
import { isFriendlyUI } from '@/themes/forumTheme';
import CommentIcon from '@material-ui/icons/ModeComment';
import { defineStyles, useStyles } from '../hooks/useStyles';
import DescriptionIcon from '@material-ui/icons/Description';
import TagIcon from '@material-ui/icons/LocalOffer';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { Link } from '../../lib/reactRouterWrapper';
const ITEM_WIDTH = 300;


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
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    breakInside: "avoid-column",
    pageBreakInside: "avoid",
    WebkitColumnBreakInside: "avoid",
  },
  item: {
    width: ITEM_WIDTH,
    borderRadius: theme.borderRadius.default,
    padding: "1px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftSideItems: {
    display: "flex",
    maxWidth: `calc(${ITEM_WIDTH}px - 32px)`,
    alignItems: "flex-start",
    gap: "8px",
    overflow: "hidden",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  title: {
    fontWeight: 400,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: 13,
    fontFamily: theme.palette.fonts.sansSerifStack,
    overflow: "hidden",
    minWidth: 0,
    opacity: 0.95,
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
    gap: "4px",
    // fontVariant: "small-caps",
  },
  titleText: {
    wordBreak: "break-word",
    lineHeight: "1.2",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    overflow: "hidden",
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
  postCount: {
    fontSize: 11,
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    gap: "2px",
    whiteSpace: "nowrap",
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
    marginTop: 3,
  },



  titleItemRoot: {
    marginBottom: 12,
    width: '100%',
  },
  titleItem: {
    width: "100%",
    padding: "1px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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





  collapse: {    marginRight: 7,
    opacity: 0.5,
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
    // marginLeft: 16,
  },
  childrenList: {
    marginTop: 12,
    maxWidth: "100%",
    width: "100%",
    columnCount: 3,
    columnGap: 16,
  },
  showMoreChildren: {
    fontSize: 10,
    fontWeight: 400,
    color: "gray",
    cursor: "pointer",
    '&:hover': {
      textDecoration: 'underline',
    },
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
  karma: {
    fontSize: 11,
    color: theme.palette.grey[600],
    width: 20,
    marginBottom: 4,
  },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'none',
    },
  },
  postCountNumber: {
    marginTop: 1,
  },
}));


interface WikiTagMockup {
  "coreTag"?: string;
  _id: string;
  name: string;
  slug: string;
  postCount: number;
  description_html: string;
  description_length: number;
  viewCount?: number;
  parentTagId?: string | null;
}

interface WikiTagNode extends WikiTagMockup {
  children: WikiTagNode[];
}

interface ConceptItemProps {
  wikitag: WikiTagNode;
  nestingLevel: number;
  index?: number;
  score?: number;  // Add this line
  onHover?: (wikitag: WikiTagMockup | null) => void;
  onClick?: (wikitag: WikiTagMockup) => void;
  pinnedWikiTag?: WikiTagMockup | null;
}
  

const ConceptItem = ({ wikitag, nestingLevel, index, onHover, onClick, pinnedWikiTag, score }: ConceptItemProps) => {
  const classes = useStyles(styles);
  const defaultCollapsed = index !== undefined && index >= 3 && index < 6;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showingAllChildren, setShowingAllChildren] = useState(false);

  const { ForumIcon, TagHoverPreview } = Components;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleMouseEnter = () => {
    if (onHover) {
      onHover(wikitag);
    }
  };

  const handleMouseLeave = () => {
    if (onHover) {
      onHover(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to background
    if (onClick) {
      onClick(wikitag);
    }
  };

  const hasChildren = wikitag.children && wikitag.children.length > 0;
  const isPinned = pinnedWikiTag?._id === wikitag._id;

  const numDirectChildren = wikitag.children?.length;
  // get the post count of this wikitag and all its descendants
  const fullDescendantCount = wikitag.postCount + wikitag.children?.reduce((acc, child) => acc + child.postCount, 0);
  // const wordCountFormatted = `${wikitag.description_length/6 >= 100 ? `${(wikitag.description_length/6/1000).toFixed(1)}k ` : Math.round(wikitag.description_length/6)}`;
  const wordCountFormatted = `${Math.round(wikitag.description_length/6)}`;
  
  const collapseToggle = hasChildren && <div className={classNames(classes.collapse, {[classes.collapseInvisible]: !hasChildren})} 
       onClick={hasChildren ? toggleCollapse : undefined}>
    <ForumIcon
      icon="SoftUpArrow"
      className={classNames(
        classes.collapseChevron,
        !collapsed && classes.collapseChevronOpen
      )}
    />
  </div>

  // regularItem
  const regularItem = (
    <TagHoverPreview
      href={`/tag/${wikitag.slug}`}
      targetLocation={{ params: { slug: wikitag.slug }, hash: '', query: {} } as RouterLocation}
    >
      <div className={classNames(classes.item, { [classes.itemPinned]: isPinned })}>
        {/* {collapseToggle} */}
        <div className={classes.leftSideItems}>
          {<div className={classes.karma}>{score || 0}</div>}
          <div className={classNames(classes.title)}>
            <span className={classes.titleText}>{wikitag.name}</span>
            {wikitag.postCount > 0 && <span className={classes.postCount}>
              ( <span className={classes.postCountNumber}>{wikitag.postCount}</span>)
            </span>}
          </div>
        </div>
        <div className={classes.rightSideItems}>
          {/* Remove the post count from here */}
        </div>
      </div>
    </TagHoverPreview>
  );

  // titleItem
  const titleItem = (
    <TagHoverPreview
      href={`/tag/${wikitag.slug}`}
      targetLocation={{ params: { slug: wikitag.slug }, hash: '', query: {} } as RouterLocation}
    >
      <div className={classes.titleItem}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div className={classes.titleItemTitle}>
            {wikitag.name}
          </div>
          {!showingAllChildren && wikitag.children.length > 24 && (
            <div 
              className={classes.showMoreChildren}
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation
                e.stopPropagation();
                handleShowMore(e);
              }}
            >
              {`(Show ${wikitag.children.length - 24} more)`}
            </div>
          )}
        </div>
        <div className={classes.titlePostCount}>{wikitag.postCount} posts</div>
      </div>
    </TagHoverPreview>
  );

  // groupingItem
  // const groupingItem = <div className={classes.groupingItem}>
  //   {collapseToggle}
  //   <div className={classes.leftSideItems}>
  //     <div className={classes.groupingTitle}>
  //       {wikitag.name}
  //     </div>
  //   </div>
  //   <div className={classes.groupingRightSideItems}>
  //     {collapsed && <div className={classes.groupingItemChildrenCount}>{numDirectChildren} tags</div>}  
  //   </div>
  // </div>
        
  // if item is nesting level 0, render titleItem instead of regularItem
  // if item is nesting level 1, render groupingItem instead of regularItem
  // otherwise, render regularItem

  const itemToRender = nestingLevel === 0 ? titleItem : regularItem;

  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowingAllChildren(true);
  };

  return (
    <div 
      className={classNames(classes.root, {[classes.titleItemRoot]: nestingLevel === 0})}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {itemToRender}

      {/* Render Children */}
      {!collapsed && hasChildren && (
        <div className={classes.children}>
          <div className={classes.childrenList}>
            {wikitag.children
              .slice(0, showingAllChildren ? undefined : 24)
              .map((childPage, idx) => {
                // Generate a random decrease between 1 and 3
                const randomDecrease = Math.floor(Math.random() * 3) + 1;
                const childScore = score ? Math.max(0, score - (idx * randomDecrease)) : 0;
                
                return (
                  <ConceptItem
                    key={childPage._id}
                    wikitag={childPage}
                    nestingLevel={nestingLevel + 1}
                    index={idx}
                    score={childScore}
                    onHover={onHover}
                    onClick={onClick}
                    pinnedWikiTag={pinnedWikiTag}
                  />
                );
              })}
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

