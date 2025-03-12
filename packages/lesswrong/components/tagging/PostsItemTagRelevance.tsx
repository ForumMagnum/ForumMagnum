import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useVote } from '../votes/withVote';
import { useCurrentUser } from '../common/withUser';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import classNames from 'classnames';
import Tooltip from '@/lib/vendor/@material-ui/core/src/Tooltip';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import { forumSelect } from '@/lib/forumTypeUtils';

const styles = (theme: ThemeType) => ({
  root: {
    width: 30,
    position: "absolute",
    textAlign: "center",
    top: "51%",
    right: 'calc(100% - 2px)',
    marginTop: -10,
  },
  voteButton: {
    fontSize: 25,
  },
  // these interact with whether the vote icons are solid or hollow (i.e. different components). Not ideally set up, so nb. 
  vertLayoutVoteUp: {
    position: "absolute",
    left: isFriendlyUI ? 9 : 10,
    top: forumSelect({
      LessWrong: -17,
      AlignmentForum: -15,
      default: -15
    })
  },
  // these interact with whether the vote icons are solid or hollow (i.e. different components). Not ideally set up, so nb. 
  vertLayoutVoteDown: {
    position: "absolute",
    left: isFriendlyUI ? 9 : 10,
    top: forumSelect({
      LessWrong: 8,
      AlignmentForum: 10,
      default: 10
    })
  },
  score: {
    width: "100%",
    fontSize: 11
  },
});

const PostsItemTagRelevance = ({tagRel, classes}: {
  tagRel: WithVoteTagRel,
  classes: ClassesType<typeof styles>,
}) => {
  const { OverallVoteButton, PostsItem2MetaInfo } = Components;
  const voteProps = useVote(tagRel, "TagRels");
  const currentUser = useCurrentUser();
  const {fail, reason: whyYouCantVote} = voteButtonsDisabledForUser(currentUser);
  const canVote = !fail;
  
  const tooltip = <div>
    <div>{tagRel.baseScore} Relevance</div>
    <div>({tagRel.voteCount} {tagRel.voteCount === 1 ? "vote" : "votes"})</div>
    {!canVote && whyYouCantVote}
  </div>

  const solidArrow = isBookUI;

  return <PostsItem2MetaInfo className={classes.root}>
    <Tooltip title={tooltip} placement="left-end">
      <span>
        <div className={classNames(classes.voteButton, classes.vertLayoutVoteDown)}>
          <OverallVoteButton
            orientation="down"
            color="error"
            upOrDown="Downvote"
            solidArrow={solidArrow}
            enabled={canVote}
            {...voteProps}
          />
        </div>
        
        <div className={classes.score}>
          {voteProps.baseScore}
        </div>
      
        <div className={classNames(classes.voteButton, classes.vertLayoutVoteUp)}>
          <OverallVoteButton
            orientation="up"
            color="secondary"
            upOrDown="Upvote"
            solidArrow={solidArrow}
            enabled={canVote}
            {...voteProps}
          />
        </div>
      </span>
      </Tooltip>
    </PostsItem2MetaInfo>
}

const PostsItemTagRelevanceComponent = registerComponent("PostsItemTagRelevance", PostsItemTagRelevance, {styles});

declare global {
  interface ComponentTypes {
    PostsItemTagRelevance: typeof PostsItemTagRelevanceComponent
  }
}
