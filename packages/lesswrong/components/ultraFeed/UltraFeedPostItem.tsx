import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking, AnalyticsContext } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { Link } from "../../lib/reactRouterWrapper";
import classNames from "classnames";
import { postGetLink } from "@/lib/collections/posts/helpers";
import { FeedPostMetaInfo } from "./ultraFeedTypes";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { useUltraFeedSettings } from "../../lib/ultraFeedSettings";

// Styles for the UltraFeedPostItem component
const styles = defineStyles("UltraFeedPostItem", (theme: ThemeType) => ({
  root: {
    paddingTop: 24,
    // paddingLeft: 12,
    // paddingRight: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 4,
  },
  titleContainer: {
    flexGrow: 1,
    paddingRight: 8,
    marginBottom: 0,
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.6rem',
    fontWeight: 600,
    opacity: 0.8,
    lineHeight: 1.15,
    textWrap: 'balance',
    width: '100%',
    '&:hover': {
      opacity: 0.9,
    },
    // marginBottom: 4,
  },
  // Match the rightSection and menu classes from UltraFeedCommentsItemMeta
  rightSection: {
    display: "flex",
    flexGrow: 0,
  },
  tripleDotMenu: {
    marginLeft: 4,
    marginRight: -10,
    // Override the PostActionsButton icon styling to match CommentsMenu
    "& svg": {
      fontSize: "1.4rem",
      cursor: "pointer",
      color: theme.palette.text.dim,
    }
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.1rem',
  },
  metadata: {
    marginTop: 4,
    color: theme.palette.text.dim,
    fontSize: '0.9rem',
  },
  content: {
    marginTop: 8,
  },
  footer: {
    paddingBottom: 24,
  },
}));

// Main component definition
const UltraFeedPostItem = ({
  post,
  postMetaInfo,
  initiallyExpanded = false,
}: {
  post: PostsListWithVotes,
  postMetaInfo: FeedPostMetaInfo,
  initiallyExpanded?: boolean,
}) => {
  const classes = useStyles(styles);
  const {captureEvent} = useTracking();
  const { FeedPostsHighlight, UltraFeedPostItemMeta, PostActionsButton } = Components;
  const { settings } = useUltraFeedSettings();

  const [expanded, setExpanded] = useState(initiallyExpanded);
  
  const metaInfoProps = expanded ? {} : { hideVoteButtons: true, hideActionsMenu: true };

  const handleExpand = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (expanded) return;
    ev.preventDefault();
    ev.stopPropagation();
    setExpanded(true);
  };
  
  return (
    <div className={classes.root} onClick={handleExpand}>
      <div className={classes.header}>
        <div className={classes.titleRow}>
          <div className={classes.titleContainer}>
            <Link to={postGetLink(post)} className={classes.title}>{post.title}</Link>
          </div>
          <span className={classes.rightSection}>
            {expanded && <AnalyticsContext pageElementContext="tripleDotMenu">
              <PostActionsButton 
                post={post} 
                vertical={true}
                className={classes.tripleDotMenu}
              />
            </AnalyticsContext>}
          </span>
        </div>
        <UltraFeedPostItemMeta post={post} {...metaInfoProps} />
      </div>
      
      
      {post.contents && (
        <Components.FeedContentBody 
          post={post}
          html={post.contents.htmlHighlight || ""}
          breakpoints={settings.postTruncationBreakpoints} 
          initialExpansionLevel={0}
          wordCount={post.contents.wordCount || 0}
          linkToDocumentOnFinalExpand={true}
          nofollow={(post.user?.karma || 0) < nofollowKarmaThreshold.get()}
        />
      )}
      <div className={classes.footer} />
    </div>
  );
};

const UltraFeedPostItemComponent = registerComponent("UltraFeedPostItem", UltraFeedPostItem);

export default UltraFeedPostItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedPostItem: typeof UltraFeedPostItemComponent
  }
} 