import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { Link } from "../../lib/reactRouterWrapper";
import classNames from "classnames";
import { postGetLink } from "@/lib/collections/posts/helpers";
import { AnalyticsContext } from "../../lib/analyticsEvents";

// Styles for the UltraFeedPostItem component
const styles = defineStyles("UltraFeedPostItem", (theme: ThemeType) => ({
  root: {
    position: "relative",
    padding: theme.spacing.unit*1.5,
    borderRadius: 4,
    backgroundColor: theme.palette.panelBackground.default,
    borderBottom: theme.palette.border.itemSeparatorBottom,
    // marginBottom: 4,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  },
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.2rem',
    fontWeight: 500,
    lineHeight: 1.15,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    textAlign: 'left',
    width: '100%',
    '&:hover': {
      textDecoration: 'underline',
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
    marginTop: 12,
    display: 'flex',
    justifyContent: 'space-between',
  },
}));

// Main component definition
const UltraFeedPostItem = ({
  post,
  initiallyExpanded = false,
}: {
  post: PostsListWithVotes,
  initiallyExpanded?: boolean,
}) => {
  const classes = useStyles(styles);
  const {captureEvent} = useTracking();
  const { FeedPostsHighlight, UltraFeedPostItemMeta, PostActionsButton } = Components;

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
        // <div className={classes.content}>
        //   <ContentStyles contentType="comment">
        //     <div dangerouslySetInnerHTML={{ __html: html }} />
        //   </ContentStyles>
        // </div>
        <FeedPostsHighlight post={post} maxCollapsedLengthWords={40} />
      )}
      
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