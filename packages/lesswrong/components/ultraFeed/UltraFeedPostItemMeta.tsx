import React, { useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { postGetKarma } from "../../lib/collections/posts/helpers";
import { usePostsUserAndCoauthors } from "../posts/usePostsUserAndCoauthors";

const styles = defineStyles("UltraFeedPostItemMeta", (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: "6px",
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "1.3rem",
    "& > *": {
      marginRight: 5,
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    flex: "1 1 auto",
    flexWrap: "wrap",
    // rowGap: "0px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
    marginRight: 0,
  },
  karma: {
    display: "inline-block",
    textAlign: "center",
    flexGrow: 0,
    flexShrink: 0,
    paddingRight: 8,
    marginRight: 4,
  },
  username: {
    marginRight: 12,
    '& a, & a:hover': {
      color: theme.palette.link.unmarked,
    },
    color: theme.palette.text.dim,
    fontFamily: theme.palette.fonts.sansSerifStack,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  },
  coauthors: {
    marginLeft: 4,
    marginRight: 0,
    color: theme.palette.text.dim,
    whiteSpace: 'nowrap',
  },
  dateContainer: {
    marginRight: 8,
  },
  voteButtons: {
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 2,
  },
}));

const UltraFeedPostItemMeta = ({
  post,
  hideDate,
  hideVoteButtons,
}: {
  post: PostsListWithVotes,
  hideDate?: boolean,
  hideVoteButtons?: boolean,
}) => {
  const classes = useStyles(styles);
  const { FormatDate, UsersName, SmallSideVote } = Components;
  const authorExpandContainer = useRef(null);
  
  const currentUser = useCurrentUser();
  const { isAnon, authors } = usePostsUserAndCoauthors(post);

  const showKarma = hideVoteButtons && !post.rejected;
  const showVoteButtons = !hideVoteButtons && !post.rejected;

  // Simplified author display logic
  const renderAuthors = () => {
    if (isAnon || authors.length === 0) {
      return <Components.UserNameDeleted />;
    }
    
    const mainAuthor = authors[0];
    const additionalAuthorsCount = authors.length - 1;
    
    return (
      <span className={classes.username}>
        <UsersName user={mainAuthor} />
        {additionalAuthorsCount > 0 && (
          <span className={classes.coauthors}>+{additionalAuthorsCount}</span>
        )}
      </span>
    );
  };

  return (
    <div className={classes.root} ref={authorExpandContainer}>
      <span className={classes.leftSection}>
        {showKarma && <span className={classes.karma}>
          {postGetKarma(post)}
        </span>}
        {renderAuthors()}
        {!hideDate && post.postedAt && (
          <span className={classes.dateContainer}>
            <FormatDate date={post.postedAt} />
          </span>
        )}
      </span>
      {showVoteButtons && (
        <span className={classes.rightSection}>
          <div className={classes.voteButtons}>
            <SmallSideVote
              document={post}
              collectionName="Posts"
              hideKarma={false}
            />
          </div>
        </span>
      )}
    </div>
  );
};

const UltraFeedPostItemMetaComponent = registerComponent(
  "UltraFeedPostItemMeta",
  UltraFeedPostItemMeta
);

export default UltraFeedPostItemMetaComponent;

declare global {
  interface ComponentTypes {
    UltraFeedPostItemMeta: typeof UltraFeedPostItemMetaComponent
  }
} 