import { Components, registerComponent, getCollection } from '../../lib/vulcan-lib';
import React from 'react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import moment from '../../lib/moment-timezone';
import { useHover } from '../common/withHover';
import { useCurrentUser } from '../common/withUser';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Comments } from '../../lib/collections/comments/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import classNames from 'classnames';
import type { VotingProps } from './withVote';
import FavoriteIcon from '@material-ui/icons/Favorite'
import { goodHeartStartDate } from '../seasonal/AprilFools2022';

const styles = (theme: ThemeType): JssStyles => ({
  overallSection: {
    display: 'inline-block',
    height: 24,
    paddingTop: 2
  },
  overallSectionBox: {
    outline: `1px solid ${theme.palette.commentBorderGrey}`,
    textAlign: 'center',
    minWidth: 70
  },
  vote: {
    fontSize: 25,
    lineHeight: 0.6,
    display: "inline-block"
  },
  voteScore: {
    fontSize: '1.1rem',
    marginLeft: 4,
    marginRight: 4,
    lineHeight: 1,
  },
  secondarySymbol: {
    fontFamily: theme.typography.body1.fontFamily,
  },
  secondaryScore: {
    fontSize: '1.1rem',
    marginLeft: 2,
    marginRight: 14
  },
  secondaryScoreNumber: {
    marginLeft: 3,
  },
  tooltipHelp: {
    fontSize: '1rem',
    fontStyle: "italic"
  },
  goodHeartScoreWrapper: {
    position: "relative",
    width: 45,
    display: "inline-block",
    textAlign: "center"
  },
  goodHeartIcon: {
    height: 45,
    width: 45,
    opacity: .35,
    left:0,
    top:-9,
    position: "absolute",
    color: "rgba(0,0,0,.2)",
    
  }
})

const isPostOrComment = (document: VoteableTypeClient) : document is (PostsDetails | CommentsList) => {
  if ((document as any)?.postedAt) return true 
  return false
}

const OverallVoteAxis = ({ document, hideKarma=false, voteProps, classes, showBox=false }: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  showBox?: boolean
}) => {
  const currentUser = useCurrentUser();
  const {eventHandlers, hover} = useHover();
  
  if (!document) return null;

  const { OverallVoteButton, LWTooltip } = Components

  const collection = getCollection(voteProps.collectionName);
  const voteCount = voteProps.voteCount;
  const karma = voteProps.baseScore;

  let moveToAlignnmentUserId = ""
  let documentTypeName = "comment";
  if (collection == Comments) {
    const comment = document as CommentsList
    moveToAlignnmentUserId = comment.moveToAlignmentUserId
  }
  if (collection == Posts) {
    documentTypeName = "post";
  }
  if (collection == Revisions) {
    documentTypeName = "revision";
  }

  const af = (document as any).af;
  const afDate = (document as any).afDate;
  const afBaseScore = (document as any).afBaseScore;
  
  const moveToAfInfo = userIsAdmin(currentUser) && !!moveToAlignnmentUserId && (
    <div className={classes.tooltipHelp}>
      {hover && <span>Moved to AF by <Components.UsersName documentId={moveToAlignnmentUserId }/> on { afDate && moment(new Date(afDate)).format('YYYY-MM-DD') }</span>}
    </div>
  )

  const goodHeart = isPostOrComment(document) && new Date(document.postedAt) > goodHeartStartDate

  return (
    <span className={classes.vote} {...eventHandlers}>
      {!!af && forumTypeSetting.get() !== 'AlignmentForum' &&
        <LWTooltip placement="bottom" title={<div>
            <p>AI Alignment Forum Karma</p>
            { moveToAfInfo }
        </div>}>
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>Ω</span>
            <span className={classes.secondaryScoreNumber}>{afBaseScore || 0}</span>
          </span>
        </LWTooltip>
      }
      {!af && (forumTypeSetting.get() === 'AlignmentForum') &&
        <LWTooltip title="LessWrong Karma" placement="bottom">
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>LW</span>
            <span className={classes.secondaryScoreNumber}>{document.baseScore || 0}</span>
          </span>
        </LWTooltip>
      }
      {(forumTypeSetting.get() !== 'AlignmentForum' || !!af) &&
        <span className={classNames(classes.overallSection, {[classes.overallSectionBox]: showBox})}>
          <LWTooltip
            title={<div><b>Overall Karma: downvote</b><br />How much do you like this overall?<br /><em>For strong downvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement="bottom"
          >
            <OverallVoteButton
              orientation="left"
              color="error"
              upOrDown="Downvote"
              {...voteProps}
            />
          </LWTooltip>
          {/* regular voting UI, disabled during April Fools */}
          {hideKarma && <LWTooltip title={'The author of this post has disabled karma visibility'}>
              <span>{' '}</span>
            </LWTooltip>}
          
          {!hideKarma && !goodHeart && <LWTooltip title={<div>This {documentTypeName} has {karma} <b>overall</b> karma ({voteCount} {voteCount == 1 ? "Vote" : "Votes"})</div>} placement="bottom">
                  <span className={classes.voteScore}>
                    {karma} 
                  </span>
              </LWTooltip> 
          }

          {!hideKarma && goodHeart && <LWTooltip title={<div>This {documentTypeName} has {karma} <b>overall</b> Good Heart Tokens ({voteCount} {voteCount == 1 ? "Vote" : "Votes"})</div>} placement="bottom">
              <span className={classes.goodHeartScoreWrapper}>
                <span className={classes.voteScore}>
                  ${karma} 
                </span>
                <FavoriteIcon className={classes.goodHeartIcon}/>
              </span>
            </LWTooltip>}

          <LWTooltip
            title={<div><b>Overall Karma: upvote</b><br />How much do you like this overall?<br /><em>For strong upvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement="bottom"
          >
            <OverallVoteButton
              orientation="right"
              color="secondary"
              upOrDown="Upvote"
              {...voteProps}
            />
          </LWTooltip>
        </span>
      }
    </span>
  )
}

const OverallVoteAxisComponent = registerComponent('OverallVoteAxis', OverallVoteAxis, {styles});

declare global {
  interface ComponentTypes {
    OverallVoteAxis: typeof OverallVoteAxisComponent
  }
}

