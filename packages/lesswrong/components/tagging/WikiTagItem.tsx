import React, { useState } from 'react';
import classNames from 'classnames';
import { Components, registerComponent   } from '../../lib/vulcan-lib';
import { isFriendlyUI } from '@/themes/forumTheme';
import { ArbitalPageNode } from './WikiTagNestedList';
import CommentIcon from '@material-ui/icons/ModeComment';
import { defineStyles, useStyles } from '../hooks/useStyles';
// Import styles as needed

const KARMA_WIDTH = 50;
const CARD_IMG_HEIGHT = 80;
const CARD_IMG_WIDTH = 160;
const SECTION_WIDTH = 768;

const styles = defineStyles("WikiTagItem", (theme: ThemeType) => ({

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
  secondaryContainer: {
    display: "flex",
    alignItems: "center",
  },
  secondaryContainerCard: {
    alignSelf: "flex-start",
  },
  comments: {
    minWidth: 58,
    marginLeft: 4,
    display: "flex",
    alignItems: "center",
    "& svg": {
      height: 18,
      marginRight: 1,
    },
    "&:hover": {
      color: theme.palette.grey[800],
      opacity: 1,
    },
    [theme.breakpoints.up("sm")]: {
      padding: '10px 0',
    }
  },
  commentsCard: {
    [theme.breakpoints.up("sm")]: {
      padding: 0,
    },
  },
  newComments: {
    fontWeight: 700,
    color: theme.palette.grey[1000],
  },
  postActions: {
    minWidth: 20,
    marginLeft: -5,
    "& .PostActionsButton-icon": {
      fontSize: 20,
    },
    "&:hover .PostActionsButton-icon": {
      color: theme.palette.grey[700],
    },
  },
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  onlyMobile: {
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  expandedComments: {
    padding: "0 12px 8px",
  },
  interactionWrapper: {
    "&:hover": {
      opacity: 1,
    },
  },
  karmaDisplay: {
    width: KARMA_WIDTH,
    minWidth: KARMA_WIDTH,
  },
  card: {
    padding: `0 20px 16px ${KARMA_WIDTH}px`,
    cursor: "pointer",
    display: "flex",
    alignItems: "flex-end",
    gap: "47px",
    [theme.breakpoints.down("xs")]: {
      gap: "12px",
    },
  },
  karmaDisplayInner: {
    color: theme.palette.grey[600],
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0px 8px",
  },
  voteArrow: {
    color: theme.palette.grey[400],
    margin: "-6px 0 2px 0",
  },
  root: {
    maxWidth: SECTION_WIDTH,
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    // justifyContent: "space-between",
  },
  item: {
    width: '100%',
    borderRadius: theme.borderRadius.default,
    padding: "6px 8px 6px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    // background: theme.palette.grey[100],
    marginBottom: 4,
    // boxShadow: theme.palette.boxShadow.default,
    boxShadow: "0 1px 5px rgba(0,0,0,.075)",
  },
  titleAndOneLiner: {
    flexGrow: 1,
    minWidth: 0,
    marginRight: 8,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginBottom: 3
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
    marginRight: 10,
    opacity: 0.95
  },
  rightSideItems: {
    display: "flex",
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    alignItems: "center",
    gap: "8px",
    color: theme.palette.grey[600],
  },
  wordCount: {
    fontSize: 11,
    minWidth: 10,
    display: "flex",
    justifyContent: "flex-end",
  },
  wordCountSeparator: {
    fontSize: 11,
    opacity: 0.5,
  },
  mainAuthor: {
    fontSize: 11,
    // color: theme.palette.grey[400],
  },
  oneLiner: {
    fontSize: 11,
    color: theme.palette.grey[600],
    //text overflow ellipsis
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commentCount: {
    position:"absolute",
    right:"50%",
    top:"50%",
    transform:"translate(50%, -50%)",
    color: theme.palette.icon.commentsBubble.commentCount,
    fontVariantNumeric:"lining-nums",
    ...theme.typography.commentStyle,
  },
  commentCountIcon: {
    position:"absolute",
    right:"50%",
    top:"50%",
    transform:"translate(50%, -50%)",
    width:30,
    height:30,
    color: theme.palette.grey[400],
  },  
  commentsIconSmall: {
    width: 12,
    height: 18,
    fontSize: 9,
    fontWeight: 600,
    top: 2.5,
    position: "relative",
    flexShrink: 0,
    marginRight: 4,
    
    "& .MuiSvgIcon-root": {
      height: "100%",
    },
    '& div': {
      marginTop: -2,
    }
  },
  collapse: {
    marginRight: 7,
    opacity: 0.6,
    display: "flex",
    verticalAlign: "middle",

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
  showMoreChildren: {
    fontSize: 12,
    fontWeight: 400,
    color: "#426c46",
    marginBottom: 8,
    marginTop: 2,
    marginLeft: 16,
  },
  collapseInvisible: {
    opacity: 0,
    pointerEvents: "none",
  },
  oneLinerInvisible: {
    opacity: 0,
    pointerEvents: "none",
  },
}));


// const samplePage = {
//   _id: "samplePage",
//   title: "The Shutdown Problem",
//   oneLiner: "How to build an AGI that lets you shut it down, despite the obvious fact that this will interfere with whatever the AGI's goals are.",
//   wordCount: 416,
//   baseScore: 4,
//   commentsCount: 11,
//   mainAuthor: "Eliezer Yudkowsky",
// }

interface WikiTagItemProps {
  page: ArbitalPageNode;
  nestingLevel: number;
}


const WikiTagItem = ({ page, nestingLevel }: WikiTagItemProps) => {
  const classes = useStyles(styles);

  const [collapsed, setCollapsed] = useState(nestingLevel > 0);

  const { ForumIcon, ArbitalPreview, LWTooltip } = Components;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const hasChildren = page.children && page.children.length > 0;

  // if (!hasChildren) {
  //   return null;
  // }

  const oneLinerText = page.oneLiner || "filler text will be invisible"
  console.log({title: page.title, oneLinerText, pageOneLiner: page.oneLiner});

  const wordCountFormatted = `${page.text_length/6 >= 1000 ? `${(page.text_length/6/1000).toFixed(1)}k` : Math.round(page.text_length/6)}`;

  //random number between 0 and 3
  const randomNumber = Math.random() < 0.8 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2) + 2;

  const authorList = `${page.authorName}${randomNumber > 0 ? `\u2009+\u2009${randomNumber}` : ""}`
        
  const commentCountNode = !!(page.commentCount && page.commentCount > 0) && <div className={classes.commentsIconSmall}>
    <CommentIcon className={classes.commentCountIcon}/>
    <div className={classes.commentCount}>
      {page.commentCount}
    </div>
  </div>

  const countOfChildrenAllTheWayDown = page.children?.reduce((acc, child) => acc + (child.children?.length || 0), 0);

  return (
    <div className={classes.root}>
      <div className={classes.item}>
        <div className={classNames(classes.collapse, {[classes.collapseInvisible]: !hasChildren})} 
             onClick={hasChildren ? toggleCollapse : undefined}>
          <ForumIcon
            icon="SoftUpArrow"
            className={classNames(
              classes.collapseChevron,
              !collapsed && classes.collapseChevronOpen
            )}
          />
        </div>
        {/* Title and One-liner */}
        <div className={classes.titleAndOneLiner}>
          <div className={classes.titleRow}>
            <div className={classes.title}>
              <ArbitalPreview href={`https://www.arbital.com/p/${page.pageId}`}>
                {page.title}
              </ArbitalPreview>
            </div>
            <div className={classes.rightSideItems}>
              {commentCountNode}
              <LWTooltip title={`${page.authorName}, Nate Soares, Daniel Dennett, and ${randomNumber*2} other contributors`}>
                <div className={classes.mainAuthor}>{authorList}</div>
              </LWTooltip>
              {/* <div className={classes.wordCountSeparator}>|</div> */}
              <div className={classes.wordCount}>{wordCountFormatted}</div>
            </div>
          </div>
          <div className={classNames(classes.oneLiner, {[classes.oneLinerInvisible]: !page.oneLiner})}>
            {oneLinerText}
          </div>
        </div>



      </div>
      {/* Render Children */}
      {!collapsed && hasChildren && (<div className={classes.children}>
        <div>
          {page.children.slice(0, 5).map(childPage => (
            <WikiTagItem key={childPage.pageId} page={childPage} nestingLevel={nestingLevel + 1} />
          ))}
        </div>
        {page.children.length > 5 && <div className={classes.showMoreChildren}>
          {`Show more (${countOfChildrenAllTheWayDown} nested pages)`}
        </div>}
      </div>)}
    </div>
  );
};

const WikiTagItemComponent = registerComponent('WikiTagItem', WikiTagItem);

export default WikiTagItemComponent;

declare global {
  interface ComponentTypes {
    WikiTagItem: typeof WikiTagItemComponent
  }
}
