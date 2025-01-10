import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps, reactBallotAxes, ReactBallotAxis, ReactBallotStandaloneReaction, reactBallotStandaloneReactions } from '../../lib/voting/votingSystems';
import { useVote } from './withVote';
import { useHover } from '../common/withHover';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import chunk from 'lodash/chunk';
import { VotingProps } from './votingProps';

const styles = (theme: ThemeType) => ({
  root: {
  },
  agreementSection: {
    display: "inline-block",
    fontSize: 25,
    marginLeft: 16,
    lineHeight: 0.6,
  },
  agreementScore: {
    fontSize: "1.1rem",
    marginLeft: 4,
    lineHeight: 1,
    marginRight: 4,
  },
  hoverBallot: {
    padding: 16,
    fontFamily: theme.typography.commentStyle.fontFamily,
    display: "inline-block",
  },
  voteButton: {
    display: "inline-block",
    width: 140,
    padding: 4,
    marginRight: 6,
    fontSize: 16,
    cursor: "pointer",
    
    "&:hover": {
      background: theme.palette.grey[250],
    },
  },
  buttonLabel: {
    marginLeft: 8,
  },
  voteArrow: {
    fontSize: 25,
    lineHeight: 0.6,
  },
  hoverBallotRow: {
  },
  goodVersion: {
  },
  badVersion: {
  },
  voteButtonSelected: {
    background: theme.palette.grey[200],
  },
  divider: {
    height: 12,
  },
  
  emoji: {
    display: "inline-block",
    padding: 6,
    paddingTop: 8,
    borderRadius: 3,
    marginRight: 4,
    border: theme.palette.border.extraFaint,
  },
  
  axisScores: {
    paddingLeft: 16,
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 12,
    lineHeight: 0.6,
  },
  axisScore: {
    display: "inline-block",
    padding: 6,
    paddingTop: 8,
    borderRadius: 3,
    marginRight: 4,
    border: theme.palette.border.extraFaint,
  },
  scoreNumber: {
    marginRight: 6,
  },
  
  axisLabel: {
  },
  standaloneReaction: {
  },
});

interface ReactBallotVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType<typeof styles>
}

const BallotRow = ({axis, voteProps, classes}: {
  axis: ReactBallotAxis,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.hoverBallotRow}>
    <AxisDirectionButton axis={axis} direction="up" voteProps={voteProps} classes={classes}/>
    <AxisDirectionButton axis={axis} direction="down" voteProps={voteProps} classes={classes}/>
  </div>
}

const AxisDirectionButton = ({axis, voteProps, direction, classes}: {
  axis: ReactBallotAxis,
  voteProps: VotingProps<VoteableTypeClient>,
  direction: "up"|"down",
  classes: ClassesType<typeof styles>,
}) => {
  const { AxisVoteButton } = Components;
  
  return (
    <AxisVoteButton
      VoteIconComponent={({eventHandlers, voted, ...rest}) => {
        return <div
          onMouseDown={eventHandlers.handleMouseDown}
          onMouseUp={eventHandlers.handleMouseUp}
          onMouseOut={eventHandlers.clearState}
          onClick={eventHandlers.handleClick}
          className={classNames(classes.voteButton, {
            [classes.goodVersion]: direction==="up",
            [classes.badVersion]: direction==="down",
            [classes.voteButtonSelected]: voted,
          })}
        >
          <span className={classes.voteArrow}>
            <Components.VoteArrowIcon eventHandlers={{}} voted={voted} {...rest} alwaysColored />
          </span>
          <span className={classes.buttonLabel}>
            {direction==="up" ? axis.goodLabel : axis.badLabel}
          </span>
        </div>
      }}
      axis={axis.name}
      orientation={direction}
      color={direction==="up" ? "secondary" : "error"}
      upOrDown={direction==="up" ? "Upvote" : "Downvote"}
      enabled
      {...voteProps}
    />
  );
}

const AxisScoreDisplay = ({axis, voteProps, classes}: {
  axis: ReactBallotAxis,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const score = voteProps?.document?.extendedScore?.[axis.name] || 0;
  if (score===0) return null;
  const label = axis.scoreLabel;
  
  return <div className={classes.axisScore}>
    <span className={classes.scoreNumber}>{score}</span>
    <span className={classes.axisLabel}>{label}</span>
  </div>;
}

const ReactionDisplay = ({reaction, voteProps, classes}: {
  reaction: ReactBallotStandaloneReaction,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const count = voteProps.document?.extendedScore?.[reaction.name] || 0;
  if (!count) return null;
  const emoji = reaction.icon;
  return <div className={classes.emoji}>{emoji} {count}</div>
}

const BallotStandaloneReaction = ({reaction, voteProps, classes}: {
  reaction: ReactBallotStandaloneReaction,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
}) => {
  const emoji = reaction.icon;
  const isSelected = !!voteProps.document?.currentUserExtendedVote?.[reaction.name];
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();
  
  return <div className={classNames(classes.voteButton, classes.standaloneReaction, {[classes.voteButtonSelected]: isSelected})} onClick={async ev => {
    if(!currentUser){
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    } else {
      await voteProps.vote({
        document: voteProps.document,
        voteType: voteProps.document.currentUserVote || null,
        extendedVote: {
          ...voteProps.document.currentUserExtendedVote,
          [reaction.name]: !isSelected,
        },
        currentUser,
      });
    }
  }}>
    {reaction.icon} {reaction.label}
  </div>
}

const ReactBallotVoteOnComment = ({document, hideKarma=false, collectionName, votingSystem, classes}: ReactBallotVoteOnCommentProps) => {
  const voteProps = useVote(document, collectionName, votingSystem);
  const { OverallVoteAxis, PopperCard } = Components;
  const { hover, anchorEl, eventHandlers } = useHover();
  
  return <span className={classes.root} {...eventHandlers}>
    <OverallVoteAxis
      document={document}
      hideKarma={hideKarma}
      voteProps={voteProps}
      showBox={false}
    />
    
    <span className={classes.axisScores}>
      {reactBallotAxes.map(axis =>
        <AxisScoreDisplay key={axis.name} axis={axis} voteProps={voteProps} classes={classes}/>
      )}
      {reactBallotStandaloneReactions.map(reaction =>
        <ReactionDisplay key={reaction.name} reaction={reaction} voteProps={voteProps} classes={classes}/>
      )}
    </span>
    
    {hover && <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom-start">
      <div className={classes.hoverBallot}>
        {reactBallotAxes.map(axis =>
          <BallotRow key={axis.name} axis={axis} voteProps={voteProps} classes={classes}/>
        )}
        <div className={classes.divider}/>
        {chunk(reactBallotStandaloneReactions, 2).map((row,i) => <div key={i} className={classes.hoverBallotRow}>
          {row.map(reaction => <BallotStandaloneReaction key={reaction.name} reaction={reaction} voteProps={voteProps} classes={classes}/>)}
        </div>)}
        
        <div className={classes.hoverBallotRow}>
          <span>Overall</span>
          <OverallVoteAxis
            document={document}
            hideKarma={hideKarma}
            voteProps={voteProps}
            showBox={false}
          />
        </div>
      </div>
    </PopperCard>}
  </span>
}


const ReactBallotVoteOnCommentComponent = registerComponent('ReactBallotVoteOnComment', ReactBallotVoteOnComment, {styles});

declare global {
  interface ComponentTypes {
    ReactBallotVoteOnComment: typeof ReactBallotVoteOnCommentComponent
  }
}

