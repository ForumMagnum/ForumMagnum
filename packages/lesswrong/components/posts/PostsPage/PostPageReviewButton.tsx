import React from "react";
import { forumTitleSetting } from "@/lib/instanceSettings";
import { canNominate, REVIEW_YEAR, postEligibleForReview } from "@/lib/reviewUtils";
import { useCurrentUser } from "@/components/common/withUser";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

const styles = defineStyles("PostPageReviewButton", (theme: ThemeType) => ({
  reviewVoting: {
    padding: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*6,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewButton: {
    border: `solid 1px ${theme.palette.primary.main}`,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    marginTop: theme.spacing.unit,
    display: "inline-block",
    borderRadius: 3
  }
}))

function PostPageReviewButtonInner({post}: {post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsList}) {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  if (!postEligibleForReview(post)) return null;

  const { ReviewVotingWidget, ReviewPostButton, LWTooltip } = Components;

  return (
    <div className={classes.reviewVoting}>
      {canNominate(currentUser, post) && <ReviewVotingWidget post={post}/>}
      <ReviewPostButton post={post} year={REVIEW_YEAR+""} reviewMessage={<LWTooltip title={`Write up your thoughts on what was good about a post, how it could be improved, and how you think stands the tests of time as part of the broader ${forumTitleSetting.get()} conversation`} placement="bottom">
        <div className={classes.reviewButton}>Review</div>
      </LWTooltip>}/>
    </div>
  )
}

export const PostPageReviewButton = registerComponent('PostPageReviewButton', PostPageReviewButtonInner);

declare global {
  interface ComponentTypes {
    PostPageReviewButton: typeof PostPageReviewButton
  }
}
