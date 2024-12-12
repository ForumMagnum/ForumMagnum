import React, { useState } from 'react';
import classNames from 'classnames';
import { Components, RouterLocation, registerComponent   } from '../../lib/vulcan-lib';
import { isFriendlyUI } from '@/themes/forumTheme';
import CommentIcon from '@material-ui/icons/ModeComment';
import { defineStyles, useStyles } from '../hooks/useStyles';
import DescriptionIcon from '@material-ui/icons/Description';
import TagIcon from '@material-ui/icons/LocalOffer';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
const ITEM_WIDTH = 250;


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
    backgroundColor: "white",
    height: 32,
    width: ITEM_WIDTH,
    maxWidth: ITEM_WIDTH,
    // overflow: "hidden",
    borderRadius: theme.borderRadius.default,
    padding: "1px 14px 1px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    // marginBottom: 4,
    boxShadow: "0 1px 5px rgba(0,0,0,.075)",
    "&:hover .ConceptItem-wordCount": {
      opacity: 1,
    },
    transition: "background-color 0.1s ease",
    "&:hover": {
      backgroundColor: theme.palette.grey[200],
    },
  },
  wikiItem: {
    backgroundColor: theme.palette.grey[100],
  },

  leftSideItems: {
    display: "flex",
    maxWidth: `calc(${ITEM_WIDTH}px - 32px)`,
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
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
    opacity: 0.95,
    marginBottom: 2,
    
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
    width: 20,
    fontSize: 11,
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    // justifyContent: "flex-end",
    // gap: "1px",
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
    marginBottom: 12,
  },
  titleItem: {
    marginBottom: -8,
    backgroundColor: "unset",
    width: '100%',
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    "&:hover $titlePostCount": {
      opacity: 1,
    },
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
    marginLeft: 16,
    width: `calc(100% - 16px)`,
  },
  childrenList: {
    marginTop: 12,
    maxWidth: "100%",
    display: "grid",
    gridTemplateRows: "repeat(12, min-content)", // 8 items per column
    gridAutoFlow: "dense",
    width: "fit-content",
    rowGap: "4px",
    columnGap: "12px",
    // Creates columns of ITEM_WIDTH, up to 4 columns
    gridTemplateColumns: `repeat(6, ${ITEM_WIDTH}px)`,
    // Force a break after every 32 items (8 rows × 4 columns)
    "& > *:nth-child(32n+1)": {
      gridColumnStart: 1,
    },
  },
  showMoreChildren: {
    fontSize: 10,
    fontWeight: 400,
    color: "#426c46",
    marginBottom: 8,
    marginTop: 0,
    //position self to the right
    marginLeft: 'auto',
    display: "flex",
    justifyContent: "flex-end",

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
  baseScore: number;
}

interface WikiTagNode extends WikiTagMockup {
  children: WikiTagNode[];
}

interface ConceptItemProps {
  wikitag: WikiTagNode;
  nestingLevel: number;
  index?: number;
  onHover?: (wikitag: WikiTagMockup | null) => void;
  onClick?: (wikitag: WikiTagMockup) => void;
  pinnedWikiTag?: WikiTagMockup | null;
}
  

const ConceptItem = ({ wikitag, nestingLevel, index, onHover, onClick, pinnedWikiTag }: ConceptItemProps) => {
  const classes = useStyles(styles);
  const defaultCollapsed = index !== undefined && index >= 3 && index < 6;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showingAllChildren, setShowingAllChildren] = useState(false);

  const { ForumIcon, TagsTooltip } = Components;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
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

  const isWikiItem = wikitag.description_length > 1000;
  // regularItem
  const regularItem = <TagsTooltip tagSlug={wikitag.slug} hash={wikitag.slug} noPrefetch previewPostCount={0}>
    <div className={classNames(classes.item, { [classes.itemPinned]: isPinned, [classes.wikiItem]: isWikiItem })} >
      {collapseToggle}
      <div className={classes.leftSideItems}>
        <div className={classes.baseScore}>
          {wikitag.baseScore}
        </div>
        <div className={classNames(classes.title)}>
          {wikitag.name}
        </div>
        {/* <div className={classes.wordCount}>{wordCountFormatted}</div> */}
      </div>
      {/* <div className={classes.clickToPin}>Click to pin</div> */}
      <div className={classes.rightSideItems}>
        {/* <div className={classes.wordCount}>
          <EditOutlinedIcon className={classes.icons} />
          {wordCountFormatted}
        </div> */}
        <div className={classes.postCount}>
          <DescriptionIcon className={classes.icons} />
          {wikitag.postCount}
        </div>
      </div>
    </div>
  </TagsTooltip>

  // titleItem
  const titleItem = <div className={classes.titleItem}>
    {collapseToggle}
    {/* <div className={classes.leftSideItems}> */}
      <div className={classes.titleItemTitle}>
        {wikitag.name}
      </div>
    {/* </div> */}
    <div className={classes.titlePostCount}>{wikitag.postCount} posts</div>
  </div>

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
    >
      {itemToRender}

      {/* Render Children */}
      {!collapsed && hasChildren && (
        <div className={classes.children}>
          <div className={classes.childrenList}>
            {wikitag.children
              .slice(0, showingAllChildren ? undefined : 50)
              //if nesting level is 2 or greater, sort by baseScore descending
              .sort((a, b) => b.baseScore - a.baseScore)
              .map((childPage, idx) => (
                <ConceptItem
                  key={childPage._id}
                  wikitag={childPage}
                  nestingLevel={nestingLevel + 1}
                  index={idx}
                  onHover={onHover}
                  onClick={onClick}
                  pinnedWikiTag={pinnedWikiTag}
                />
            ))}
          </div>
          {!showingAllChildren && wikitag.children.length > 50 && (
            <div 
              className={classes.showMoreChildren}
              onClick={handleShowMore}
            >
              {`Show ${wikitag.children.length - 6} more`}
            </div>
          )}
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

