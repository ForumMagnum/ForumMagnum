import React, { useState } from 'react';
import classNames from 'classnames';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Link } from '@/lib/reactRouterWrapper';
import { WikiTagNode } from './types';

const KARMA_WIDTH = 50;
const SECTION_WIDTH = 768;
const CHILDREN_INDENT = 16;

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
  },
  tooltip: {
    width: '100%',
  },
  item: {
    background: theme.palette.panelBackground.default,
    minHeight: 48,
    width: '100%',
    borderRadius: theme.borderRadius.default,
    padding: "5px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    boxShadow: "0 1px 5px rgba(0,0,0,.075)",
    "&:hover .WikiTagItem-wordCount": {
      opacity: 1,
    },
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
    marginBottom: 0
  },
  leftSideItems: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflow: "hidden",
  },
  title: {
    fontWeight: 400,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: 14,
    fontFamily: theme.palette.fonts.sansSerifStack,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    opacity: 0.95
  },
  titleLink: {
    color: theme.palette.link.color,
    opacity: 1,
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
    fontSize: 11,
    minWidth: 10,
    display: "flex",
    justifyContent: "start",
    opacity: 0,
    transition: "opacity 0.2s ease",
    color: theme.palette.grey[600],
  },
  wordCountSeparator: {
    fontSize: 11,
    opacity: 0.5,
  },
  mainAuthor: {
    fontSize: 11,
    color: theme.palette.grey[600],
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  oneLiner: {
    fontSize: 12,
    color: theme.palette.grey[600],
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
    width: 18,
    height: 18,
    fontSize: 9,
    fontWeight: 600,
    top: 1,
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
    opacity: 0.5,
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
    marginLeft: CHILDREN_INDENT,
    width: `calc(100% - ${CHILDREN_INDENT}px)`,
  },
  childrenList: {
    display: "flex",
    flexDirection: "column",
  },
  showMoreChildren: {
    fontSize: 12,
    fontWeight: 400,
    color: "#426c46",
    marginBottom: 8,
    marginTop: 2,
    marginLeft: CHILDREN_INDENT,
  },
  collapseInvisible: {
    opacity: 0,
    pointerEvents: "none",
  },
  oneLinerInvisible: {
    display: 'none',
  },
  contributorTooltip: {
    whiteSpace: 'nowrap',
  },
}));

interface WikiTagItemProps {
  page: WikiTagNode;
  nestingLevel: number;
  options?: {
    sort?: (a: WikiTagNode, b: WikiTagNode) => number;
    defaultCollapseAfterLevel?: number;
    // Future options can be added here
  };
  className?: string;
}

const WikiTagItem = ({ page, nestingLevel, options = {} }: WikiTagItemProps) => {
  const classes = useStyles(styles);

  const [collapsed, setCollapsed] = useState(
    options.defaultCollapseAfterLevel !== undefined && 
    nestingLevel >= options.defaultCollapseAfterLevel
  );

  const { ForumIcon, TagsTooltip, WikiTagNestedList } = Components;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const hasChildren = page.children && page.children.length > 0;

  const descriptionLength = page.description?.html?.length ?? 0;

  const wordCountFormatted = `${descriptionLength / 6 >= 100 ? `${(descriptionLength / 6 / 1000).toFixed(1)}k ` : Math.round(descriptionLength / 6)} words`;

  return (
    <div className={classes.root}>
      <TagsTooltip tagSlug={page.slug} noPrefetch className={classes.tooltip}>
        <div className={classes.item}>
          <div
            className={classNames(classes.collapse, { [classes.collapseInvisible]: !hasChildren })}
            onClick={hasChildren ? toggleCollapse : undefined}
          >
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
              <div className={classes.leftSideItems}>
                <div className={classes.title}>
                  <Link to={`/tag/${page.slug}`} doOnDown={true} className={classes.titleLink}>
                    {page.name}
                  </Link>
                </div>
                <div className={classes.wordCount}>{wordCountFormatted}</div>
              </div>
            </div>
          </div>
        </div>
      </TagsTooltip>

      {!collapsed && hasChildren && (
        <WikiTagNestedList 
          pages={page.children} 
          nestingLevel={nestingLevel + 1}
        />
      )}
    </div>
  );
};

const WikiTagItemComponent = registerComponent('WikiTagItem', WikiTagItem);

export default WikiTagItemComponent;

declare global {
  interface ComponentTypes {
    WikiTagItem: typeof WikiTagItemComponent;
  }
}
