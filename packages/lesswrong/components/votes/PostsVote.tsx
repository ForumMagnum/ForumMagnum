import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';
import { useVote } from './withVote';
import { forumTypeSetting } from '../../lib/instanceSettings';
import FavoriteIcon from '@material-ui/icons/Favorite'
import { enableGoodHeartProject, goodHeartStartDate } from '../seasonal/AprilFools2022';

const styles = (theme: ThemeType): JssStyles => ({
  upvote: {
    marginBottom: -22
  },
  downvote: {
    marginTop: -25
  },
  voteScores: {
    margin:"15%",
  },
  voteScore: {
    color: theme.palette.grey[500],
    paddingLeft: 1, // For some weird reason having this padding here makes it look more centered
    position: 'relative',
    zIndex: theme.zIndexes.postsVote,
    fontSize: '55%',
  },
  voteScoreGoodHeart: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    fontSize: '45%',
    textAlign: "center",
  },
  secondaryVoteScore: {
    fontSize: '35%',
    marginBottom: 2,
  },
  voteBlock: {
    width: 50,
  },
  tooltip: {
    color: theme.palette.grey[500],
    fontSize: '1rem',
    backgroundColor: 'white',
    transition: 'opacity 150ms cubic-bezier(0.4, 0, 1, 1) 0ms',
    marginLeft: 0
  },
  goodHeartWrapper: {
    position: "relative",
    marginTop: 18,
    marginBottom: 18
  },
  goodHeartIcon: {
    position: "absolute",
    height: 60,
    width: 60,
    left: -12,
    top: -12,
    color: "rgba(0,0,0,.1)"
  }
})

const PostsVote = ({ post, classes }: {
  post: PostsWithVotes,
  classes: ClassesType
}) => {
  const voteProps = useVote(post, "Posts");
  const {OverallVoteButton, Typography} = Components;

  // return to normal after April fools
  const nonAprilFoolsVoteScore = <div className={classes.voteScores}>
    <Tooltip
      title={`${voteProps.voteCount} ${voteProps.voteCount == 1 ? "Vote" : "Votes"}`}
      placement="right"
      classes={{tooltip: classes.tooltip}}
    >
      <div> 
        {/* Have to make sure to wrap this in a div because Tooltip requires a child that takes refs */}
        <Typography variant="headline" className={classes.voteScore}>{voteProps.baseScore}</Typography>
      </div>
    </Tooltip>
    {!!post.af && !!post.afBaseScore && forumTypeSetting.get() !== 'AlignmentForum' &&
      <Tooltip
        title="AI Alignment Forum karma"
        placement="right"
        classes={{tooltip: classes.tooltip}}
      >
        <Typography
          variant="headline"
          className={classNames(classes.voteScore, classes.secondaryVoteScore)}>
          Ω {post.afBaseScore}
        </Typography>
      </Tooltip>
    }
  </div>

  const goodHeartEnabled = enableGoodHeartProject.get()
  const goodHeart = goodHeartEnabled && new Date(post.postedAt) > goodHeartStartDate

  const voteStyling = goodHeart ? <div className={classes.goodHeartWrapper}> 
    <Typography variant="headline" className={classNames(classes.voteScore, classes.voteScoreGoodHeart)}>${voteProps.baseScore}</Typography>
    <FavoriteIcon className={classes.goodHeartIcon}/>
  </div> : <div> 
    {/* Have to make sure to wrap this in a div because Tooltip requires a child that takes refs */}
    <Typography variant="headline" className={classes.voteScore}>{voteProps.baseScore}</Typography>
  </div>

  return (
      <div className={classes.voteBlock}>
        <Tooltip
          title="Click-and-hold for strong vote"
          placement="right"
          classes={{tooltip: classes.tooltip}}
        >
          <div className={classes.upvote}>
            <OverallVoteButton
              orientation="up"
              color="secondary"
              upOrDown="Upvote"
              {...voteProps}
            />
          </div>
        </Tooltip>
        <div className={classes.voteScores}>
          <Tooltip
            title={`${voteProps.baseScore} Good Heart tokens (${voteProps.voteCount} ${voteProps.voteCount == 1 ? "Vote" : "Votes)"}`}
            placement="right"
          >
            {voteStyling}
          </Tooltip>
          {!!post.af && !!post.afBaseScore && forumTypeSetting.get() !== 'AlignmentForum' &&
            <Tooltip
              title="AI Alignment Forum karma"
              placement="right"
              classes={{tooltip: classes.tooltip}}
            >
              <Typography
                variant="headline"
                className={classNames(classes.voteScore, classes.secondaryVoteScore)}>
                Ω {post.afBaseScore}
              </Typography>
            </Tooltip>
          }
        </div>
        <Tooltip
          title="Click-and-hold for strong vote"
          placement="right"
          classes={{tooltip: classes.tooltip}}
        >
          <div className={classes.downvote}>
            <OverallVoteButton
              orientation="down"
              color="error"
              upOrDown="Downvote"
              {...voteProps}
            />
          </div>
        </Tooltip>
      </div>)
}

const PostsVoteComponent = registerComponent('PostsVote', PostsVote, {styles});

declare global {
  interface ComponentTypes {
    PostsVote: typeof PostsVoteComponent
  }
}

