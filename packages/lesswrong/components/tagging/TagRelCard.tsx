import React from 'react';
import { userCanVote } from '../../lib/collections/users/helpers';
import { taggingNameCapitalSetting, taggingNameSetting } from '../../lib/instanceSettings';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useVote } from '../votes/withVote';

const styles = (theme: ThemeType): JssStyles => ({
  relevance: {
    marginTop: 2,
    marginLeft: 16,
    ...theme.typography.commentStyle,
  },
  relevanceLabel: {
    marginRight: 8,
    color: theme.palette.grey[600]
  },
  voteButton: {
    display: "inline-block",
    fontSize: 25,
  },
  score: {
    marginLeft: 4,
    marginRight: 4,
  },
  removeButton: {
    float: "right",
    marginTop: 12
  },
  removed: {
    float: "right",
    marginTop: 12,
    marginRight: 16,
    color: theme.palette.grey[400]
  }
});

const TagRelCard = ({tagRel, classes, relevance=true}: {
  tagRel: TagRelMinimumFragment,
  classes: ClassesType,
  relevance?: boolean
}) => {
  const currentUser = useCurrentUser();
  const voteProps = useVote(tagRel, "TagRels");
  const newlyVoted = !!(tagRel.currentUserVote==="smallUpvote" && voteProps.voteCount === 1)

  // We check both whether the current user can vote at all, and whether they can specifically vote on this tagrel
  const {fail, reason: whyYouCantVote} = userCanVote(currentUser);
  const canVote = tagRel.currentUserCanVote && !fail;
  
  const TooltipIfDisabled = (canVote
    ? ({children}: {children: React.ReactNode}) => <>{children}</>
    : ({children}: {children: React.ReactNode}) => <LWTooltip
      placement="top"
      title={whyYouCantVote}
    >
      {children}
    </LWTooltip>
  )

  const { TagPreview, OverallVoteButton, TagRelevanceButton, LWTooltip } = Components;
  
  return <div>
    <div className={classes.relevance}>
      <LWTooltip title="How relevant is this tag to this post?" placement="top">
        <span className={classes.relevanceLabel}>
          Relevance
        </span>
      </LWTooltip>
      <TooltipIfDisabled>
        <div className={classes.voteButton}>
          <OverallVoteButton
            orientation="left"
            color="error"
            upOrDown="Downvote"
            enabled={canVote}
            {...voteProps}
          />
        </div>
      </TooltipIfDisabled>
      <span className={classes.score}>
        {voteProps.baseScore}
      </span>
      <TooltipIfDisabled>
        <div className={classes.voteButton}>
          <OverallVoteButton
            orientation="right"
            color="secondary"
            upOrDown="Upvote"
            enabled={canVote}
            {...voteProps}
          />
        </div>
      </TooltipIfDisabled>
      {newlyVoted && <span className={classes.removeButton}>
        <LWTooltip
          title={`Remove your relevance vote from this ${taggingNameSetting.get()}`}
          placement="top"
        >
          <TagRelevanceButton
            label={`Remove ${taggingNameCapitalSetting.get()}`}
            {...voteProps}
            voteType="smallUpvote"
            cancelVote
          />
        </LWTooltip>
      </span>}
      {voteProps.baseScore <= 0 && <span className={classes.removed}>Removed (refresh page)</span>}
    </div>
    {tagRel.tag && <TagPreview tag={tagRel.tag} autoApplied={tagRel.autoApplied}/>}
  </div>
}

const TagRelCardComponent = registerComponent("TagRelCard", TagRelCard, {styles});

declare global {
  interface ComponentTypes {
    TagRelCard: typeof TagRelCardComponent
  }
}
