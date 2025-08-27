import React from 'react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import moment from '../../lib/moment-timezone';
import { useCurrentUser } from '../common/withUser';
import { isAF } from '../../lib/instanceSettings';
import { useVoteButtonsDisabled } from './useVoteButtonsDisabled';
import type { VotingProps } from './votingProps';
import OverallVoteButton, { OverallVoteButtonProps } from './OverallVoteButton';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import { defineStyles, useStyles } from '../hooks/useStyles';
import UsersName from "../users/UsersName";
import LWTooltip from "../common/LWTooltip";

const styles = defineStyles('OverallVoteAxis', theme => ({
  overallSection: {
    display: 'inline-block',
    height: 24,
    paddingTop: theme.isFriendlyUI ? 2.5 : 0
  },
  overallSectionBox: {
    marginLeft: 8,
    outline: theme.palette.border.commentBorder,
    borderRadius: theme.isFriendlyUI ? theme.borderRadius.small : 2,
    textAlign: 'center',
    minWidth: 60
  },
  vote: {
    fontSize: 25,
    lineHeight: 0.6,
    whiteSpace: "nowrap",
    display: "inline-block",
  },
  voteScore: { 
    lineHeight: 1,
    fontSize: '1.1rem',
    margin: '0 4px',
    verticalAlign: 'baseline',
  },
  secondarySymbol: {
    fontFamily: theme.typography.body1.fontFamily,
  },
  secondaryScore: {
    marginLeft: 2,
    marginRight: 14,
    fontSize: '1.1rem',
    display: 'initial',
  },
  secondaryScoreNumber: {
    marginLeft: 3,
  },
  tooltipHelp: {
    fontSize: '1rem',
    fontStyle: "italic"
  },
  tooltip: {
    transform: "translateY(-10px)",
  },
  lwTooltip: {
    transform: "translateY(-3px)",
  },
  verticalArrows: {
    "& .LWTooltip-root": {},
    "& $voteScore": {
      display: "block",
    },
  },
}));

const getKarmaQuestion = () => isFriendlyUI() ? 'Is this a valuable contribution?' : 'How much do you like this overall?'

const OverallVoteAxis = ({
  document,
  hideKarma = false,
  voteProps,
  showBox = false,
  verticalArrows,
  largeArrows,
  hideAfScore,
  className,
  voteScoreClassName,
  secondaryScoreClassName,
}: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  showBox?: boolean,
  verticalArrows?: boolean,
  largeArrows?: boolean,
  hideAfScore?: boolean,
  className?: string,
  voteScoreClassName?: string,
  secondaryScoreClassName?: string,
}) => {
  const classes = useStyles(styles);
  const collectionName = voteProps.collectionName;
  const extendedScore = voteProps.document?.extendedScore
  const voteCount = extendedScore && ("approvalVoteCount" in extendedScore)
    ? extendedScore.approvalVoteCount
    : (voteProps.voteCount || 0);
  const karma = voteProps.baseScore;
  const {fail, reason: whyYouCantVote} = useVoteButtonsDisabled();
  const canVote = !fail;

  let documentTypeName = "comment";
  if (collectionName === "Posts") {
    documentTypeName = "post";
  }
  if (collectionName === "Revisions") {
    documentTypeName = "revision";
  }

  const af = (document as any).af;
  const afBaseScore = voteProps.document.afBaseScore;

  const karmaTooltipTitle = React.useMemo(() =>  hideKarma
    ? 'This post has disabled karma visibility'
    : <div>This {documentTypeName} has {karma} <b>overall</b> karma ({voteCount} {voteCount === 1 ? "Vote" : "Votes"})</div>
  , [hideKarma, documentTypeName, karma, voteCount])

  const TooltipIfDisabled = React.useMemo(() => canVote
    ? ({children}: {children: React.ReactNode}) => <>{children}</>
    : ({children}: {children: React.ReactNode}) => <LWTooltip
      placement="top"
      popperClassName={classes.tooltip}
      title={<>
        <div>{whyYouCantVote}</div>
        <div>{karmaTooltipTitle}</div>
      </>}
    >
      {children}
    </LWTooltip>
  , [canVote, karmaTooltipTitle, whyYouCantVote, classes.tooltip])
  
  const TooltipIfEnabled = React.useMemo(() => canVote
    ? ({children, ...props}: React.ComponentProps<typeof LWTooltip>) =>
      <LWTooltip {...props} popperClassName={classes.tooltip}>
        {children}
      </LWTooltip>
    : ({children}: {children: React.ReactNode}) => <>{children}</>
  , [canVote, classes.tooltip])


  // Moved down here to allow for useMemo hooks
  if (!document) return null;

  const tooltipPlacement = "top"

  const buttonProps: Partial<OverallVoteButtonProps<VoteableTypeClient>> = {largeArrow: largeArrows};
  if (verticalArrows) {
    buttonProps.solidArrow = true;
  }

  return <TooltipIfDisabled>
    <span className={classes.vote}>
      {!!af && !isAF() && !hideAfScore &&
        <LWTooltip
          placement={tooltipPlacement}
          popperClassName={classes.tooltip}
          title={
            <div>
              <p>AI Alignment Forum Karma</p>
              <MoveToAFInfo collectionName={collectionName} document={document} />
            </div>
          }
        >
          <span className={classNames(classes.secondaryScore, secondaryScoreClassName)}>
            <span className={classes.secondarySymbol}>Ω</span>
            <span className={classes.secondaryScoreNumber}>{afBaseScore || 0}</span>
          </span>
        </LWTooltip>
      }
      {!af && isAF() &&
        <LWTooltip
          title="LessWrong Karma"
          placement={tooltipPlacement}
          className={classes.lwTooltip}
        >
          <span className={classNames(classes.secondaryScore, secondaryScoreClassName)}>
            <span className={classes.secondarySymbol}>LW</span>
            <span className={classes.secondaryScoreNumber}>{document.baseScore || 0}</span>
          </span>
        </LWTooltip>
      }
      {(!isAF() || !!af) &&
        <span className={classNames(classes.overallSection, className, {
          [classes.overallSectionBox]: showBox,
          [classes.verticalArrows]: verticalArrows,
        })}>
          <TooltipIfEnabled
            title={<div><b>Overall Karma: Downvote</b><br />{getKarmaQuestion()}<br /><em>For strong downvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement={tooltipPlacement}
          >
            <OverallVoteButton
              orientation={verticalArrows ? "down" : "left"}
              color="error"
              upOrDown="Downvote"
              enabled={canVote}
              {...voteProps}
              {...buttonProps}
            />
          </TooltipIfEnabled>
          <TooltipIfEnabled title={karmaTooltipTitle} placement={tooltipPlacement}>
            {hideKarma
              ? <span>{' '}</span>
              : <span className={classNames(classes.voteScore, voteScoreClassName)}>
                  {karma}
                </span>
            }
          </TooltipIfEnabled>
          <TooltipIfEnabled
            title={<div><b>Overall Karma: Upvote</b><br />{getKarmaQuestion()}<br /><em>For strong upvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement={tooltipPlacement}
          >
            <OverallVoteButton
              orientation={verticalArrows ? "up" : "right"}
              color="secondary"
              upOrDown="Upvote"
              enabled={canVote}
              {...voteProps}
              {...buttonProps}
            />
          </TooltipIfEnabled>
        </span>
      }
    </span>
  </TooltipIfDisabled>
}

const MoveToAFInfo = ({collectionName, document}: {
  collectionName: CollectionNameString,
  document: VoteableTypeClient,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  let moveToAlignnmentUserId: string | null = "";
  if (collectionName === "Comments") {
    const comment = document as CommentsList
    moveToAlignnmentUserId = comment.moveToAlignmentUserId
  }

  const afDate = (document as any).afDate;

  return userIsAdmin(currentUser) && !!moveToAlignnmentUserId && (
    <div className={classes.tooltipHelp}>
      <span>Moved to AF by <UsersName documentId={moveToAlignnmentUserId }/> on { afDate && moment(new Date(afDate)).format('YYYY-MM-DD') }</span>
    </div>
  )

}

export default OverallVoteAxis;

