import React, { useCallback, useState, useMemo } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";
import { isLWorAF } from "../../lib/instanceSettings";
import classNames from "classnames";
import DeferRender from "../common/DeferRender";
import { DisplayFeedComment } from "./ultraFeedTypes";
import { defineStyles, useStyles } from "../hooks/useStyles";

// Helper function to estimate word count from HTML content
const getWordCount = (html: string): number => {
  // Remove HTML tags and count words
  const text = html.replace(/<\/?[^>]+(>|$)/g, " ");
  return text.split(/\s+/).filter(Boolean).length;
};

export const SINGLE_LINE_PADDING_TOP = 5;

// Styles for the UltraFeedCommentItem component
const styles = defineStyles("UltraFeedCommentItem", (theme: ThemeType) => ({
  expandedRoot: {
    position: "relative",
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : 0,
    backgroundColor: theme.palette.panelBackground.default,
    marginBottom: 4,
    "& .comments-node-root": {
      marginBottom: 4,
      ...(isLWorAF ? {
        paddingTop: 0,
        // This is to cause the "scroll to parent" sidebar to be positioned with respect to the top-level comment node, rather than the entire section
        position: 'relative',
      } : {}),
    },
  },
  hidden: {
    display: 'none',
  },
  // Styles for the collapsed comment based on SingleLineComment
  collapsedRoot: {
    position: "relative",
    cursor: "pointer",
    borderRadius: isFriendlyUI ? theme.borderRadius.small : 0,
    backgroundColor: theme.palette.panelBackground.default,
  },
  collapsedCommentInfo: {
    display: "flex",
    borderRadius: isFriendlyUI ? theme.borderRadius.small : 0,
    backgroundColor: theme.palette.panelBackground.default,
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.darken05,
    },
    marginTop: 0,
    marginBottom: 0,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    color: theme.palette.text.normal,
    whiteSpace: "nowrap",
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  karma: {
    textAlign: "center",
    paddingTop: SINGLE_LINE_PADDING_TOP,
    paddingRight: SINGLE_LINE_PADDING_TOP,
    flexGrow: 0,
    flexShrink: 0,
  },
  username: {
    padding: SINGLE_LINE_PADDING_TOP,
    '& a, & a:hover': {
      color: theme.palette.link.unmarked,
    },
    fontWeight: 600,
    // marginRight: 10,
  },
  date: {
    padding: SINGLE_LINE_PADDING_TOP,
    paddingRight: theme.spacing.unit,
    paddingLeft: theme.spacing.unit
  },
  truncatedContent: {
    padding: SINGLE_LINE_PADDING_TOP,
    display: "inline",
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 0,
    marginBottom: 0,
    '& *': {
      display: "inline"
    },
    '& blockquote, & br, & figure, & img': {
      display: "none"
    },
    '& p': {
      marginRight: 6,
      marginTop: 0,
      marginBottom: 0,
    },
    '& strong': {
      fontWeight: theme.typography.body2.fontWeight
    }
  },
  // Styles for expanded comment
  expandedCommentHeader: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8,
    color: theme.palette.text.dim,
    paddingTop: "0.6em",
    marginRight: isFriendlyUI ? 40 : 20,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.2rem',
    rowGap: "6px",
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: isFriendlyUI ? undefined : `${theme.palette.linkHover.dim} !important`,
    },
  },
  expandedUsername: {
    fontWeight: 600,
    marginRight: 10,
    color: theme.palette.text.normal,
  },
  expandedKarma: {
    marginRight: 10,
    color: theme.palette.text.dim,
  },
  expandedDate: {
    color: theme.palette.text.dim,
  },
  expandedContent: {
    ...theme.typography.commentStyle,
    marginBottom: 16,
  },
  contentWrapper: {
    cursor: "pointer",
  },
  truncatedExpandedContent: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 4,
  },
  replyLink: {
    marginRight: 8,
    display: "inline",
    fontWeight: isFriendlyUI ? 600 : theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    fontSize: isFriendlyUI ? "1.1rem" : undefined,
    cursor: "pointer",
  },
  commentBottom: {
    marginBottom: 4,
  },
  voteContainer: {
    marginLeft: 10,
  },
  ufCommentsItemMeta: {
    display: "flex",
    alignItems: "center",
  },
  menu: {
    marginLeft: 10,
  }
}));




const UltraFeedCommentsItemMeta = ({comment, post, hideActionsMenu}: {
  comment: DisplayFeedComment,
  post: PostsMinimumInfo,
  hideActionsMenu: boolean,
}) => {
  const classes = useStyles(styles);
  const { ContentStyles, CommentsMenu } = Components;

  return (
    <div className={classes.ufCommentsItemMeta}>




      {!hideActionsMenu &&
        <AnalyticsContext pageElementContext="tripleDotMenu">
          {/* menu goes here */}
          ...
        </AnalyticsContext>
      }
  
    </div>
  )
}















// Collapsed Item Definition
const UltraFeedCollapsedCommentItem = ({comment, setExpanded}: {
  comment: DisplayFeedComment,
  setExpanded: (value: boolean) => void
}) => {
  const classes = useStyles(styles);
  const { ContentStyles } = Components;
  
  const handleClick = useCallback(() => {
    setExpanded(true);
  }, [setExpanded]);
  
  
  return (
    <div className={classes.collapsedRoot} onClick={handleClick}>
      <ContentStyles contentType="comment" className={classes.collapsedCommentInfo}>
        <span className={classes.karma}>
          {comment.comment.baseScore}
        </span>
        <span className={classes.username}>
          {comment.comment.user?.displayName || "Anonymous"}
        </span>
        {/* <span className={classes.date}>
          <Components.FormatDate date={comment.postedAt} tooltip={false}/>
        </span> */}
        <ContentStyles contentType="comment" className={classes.truncatedContent}>
          <div dangerouslySetInnerHTML={{ __html: comment.comment.contents?.html || '' }} />
        </ContentStyles>
      </ContentStyles>
    </div>
  );
}

// Expanded Item Definition
const UltraFeedExpandedCommentItem = ({comment, setExpanded, shouldTruncate}: {
  comment: DisplayFeedComment,
  setExpanded: (value: boolean) => void,
  shouldTruncate: boolean
}) => {
  const classes = useStyles(styles);
  const { ContentStyles, SmallSideVote } = Components;
  const [contentTruncated, setContentTruncated] = useState(shouldTruncate);
  
  const handleContentClick = useCallback(() => {
    setContentTruncated(false);
  }, []);

  // Create a simple comment object for SmallSideVote

  const { baseScore, user, postedAt } = comment.comment;
  
  
  return (
    <div className={classes.expandedRoot}>
      <div className={classes.expandedCommentHeader}>
        <span className={classes.expandedKarma}>
          {baseScore}
        </span>
        <span className={classes.expandedUsername}>
          {user?.displayName || "Anonymous"}
        </span>
        <span className={classes.expandedDate}>
          <Components.FormatDate date={postedAt} tooltip={false}/>
        </span>
        <span className={classes.voteContainer}>
          <SmallSideVote
            document={comment.comment as any}
            collectionName="Comments"
          />
        </span>
      </div>
      
      <div 
        className={classes.contentWrapper}
        onClick={contentTruncated ? handleContentClick : undefined}
      >
        <ContentStyles 
          contentType="comment" 
          className={classNames(
            classes.expandedContent,
            contentTruncated && classes.truncatedExpandedContent
          )}
        >
          <div dangerouslySetInnerHTML={{ __html: comment.comment.contents?.html || '' }} />
        </ContentStyles>
      </div>
      
      <div className={classes.commentBottom}>
        <span className={classes.replyLink}>
          Reply
        </span>
      </div>
    </div>
  );
}


// Main component definition
const UltraFeedCommentItem = ({comment}: {
  comment: DisplayFeedComment, // Comment from HydratedFeedItem.primaryComment
}) => {
  const classes = useStyles(styles);
  const {captureEvent} = useTracking();

  const { comment: commentForVoting } = comment;
  const initialExpanded = comment.metaInfo.displayStatus === "expanded";
  
  // Calculate if content should be truncated (over 500 words)
  const shouldTruncate = useMemo(() => {
    return ((comment.comment.contents?.wordCount ?? 0 > 500) && comment.metaInfo.displayStatus === 'collapsed') || (comment.metaInfo.displayStatus === 'expanded');
  }, [comment.metaInfo.displayStatus, comment.comment.contents?.wordCount]);

  const [expanded, setExpanded] = useState(initialExpanded);
  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "ultraFeedCommentExpanded" : "ultraFeedCommentCollapsed");
  }, [captureEvent, setExpanded]);

  // We're doing both a NoSSR + conditional `display: 'none'` to toggle between the collapsed & expanded quick take
  // This is to eliminate a loading spinner (for the child comments) when someone expands a quick take,
  // while avoiding the impact to the home page SSR speed for the large % of users who won't interact with quick takes at all
  const expandedComment = (
    <DeferRender ssr={false}>
      <div className={classNames({ [classes.hidden]: !expanded })}>
        <UltraFeedExpandedCommentItem 
          comment={comment} 
          setExpanded={wrappedSetExpanded} 
          shouldTruncate={shouldTruncate}
        />
      </div>
    </DeferRender>
  );

  const collapsedComment = (
    <div className={classNames({ [classes.hidden]: expanded })}>
      <UltraFeedCollapsedCommentItem comment={comment} setExpanded={wrappedSetExpanded} />
    </div>
  );

  return <>
    {expandedComment}
    {collapsedComment}
  </>;
}

const UltraFeedCommentItemComponent = registerComponent("UltraFeedCommentItem", UltraFeedCommentItem);

export default UltraFeedCommentItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedCommentItem: typeof UltraFeedCommentItemComponent
  }
}
