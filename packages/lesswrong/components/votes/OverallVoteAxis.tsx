import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import moment from '../../lib/moment-timezone';
import { useCurrentUser } from '../common/withUser';
import { isAF } from '../../lib/instanceSettings';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import type { VotingProps } from './votingProps';
import type { OverallVoteButtonProps } from './OverallVoteButton';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

/* -- Helper Tooltip Components -- */
function TooltipIfDisabled({
  canVote,
  children,
  LWTooltip,
  classes,
  whyYouCantVote,
  karmaTooltipTitle,
  tooltipPlacement = 'top',
}: {
  canVote: boolean;
  children: React.ReactNode;
  classes: ClassesType<typeof styles>;
  LWTooltip: React.ComponentType<any>;
  whyYouCantVote: string | undefined;
  karmaTooltipTitle: React.ReactNode;
  tooltipPlacement?: string;
}) {
  if (canVote) {
    // If they can vote, we just return the children
    return <>{children}</>;
  }
  // Otherwise, wrap them in a tooltip explaining why
  return (
    <LWTooltip
      placement={tooltipPlacement}
      popperClassName={classes.tooltip}
      title={
        <>
          <div>{whyYouCantVote}</div>
          <div>{karmaTooltipTitle}</div>
        </>
      }
    >
      {children}
    </LWTooltip>
  );
}

function TooltipIfEnabled({
  canVote,
  children,
  LWTooltip,
  classes,
  tooltipPlacement = 'top',
  ...restProps
}: {
  canVote: boolean;
  children: React.ReactNode;
  classes: ClassesType<typeof styles>;
  LWTooltip: React.ComponentType<any>;
  tooltipPlacement?: string;
  [key: string]: any; // for e.g. "title", "popperClassName", etc.
}) {
  if (canVote) {
    // Only wrap in LWTooltip if they can vote
    return (
      <LWTooltip placement={tooltipPlacement} popperClassName={classes.tooltip} {...restProps}>
        {children}
      </LWTooltip>
    );
  }
  // If they can't vote, we just return children unwrapped
  return <>{children}</>;
}

/* -- JSS Styles -- */
const styles = (theme: ThemeType) => ({
  overallSection: {
    display: 'inline-block',
    height: 24,
    paddingTop: isFriendlyUI ? 2.5 : 0
  },
  overallSectionBox: {
    marginLeft: 8,
    outline: theme.palette.border.commentBorder,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : 2,
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
    fontSize: '1.1rem',
    margin: '0 4px',
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
});

/* -- Main Component -- */
const OverallVoteAxis = ({
  document,
  hideKarma = false,
  voteProps,
  classes,
  showBox = false,
  verticalArrows,
  largeArrows,
  className,
}: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType<typeof styles>,
  showBox?: boolean,
  verticalArrows?: boolean,
  largeArrows?: boolean,
  className?: string,
}) => {
  const currentUser = useCurrentUser();

  const { OverallVoteButton, LWTooltip } = Components;

  const collectionName = voteProps.collectionName;
  const extendedScore = voteProps.document?.extendedScore;
  const voteCount = extendedScore && ("approvalVoteCount" in extendedScore)
    ? extendedScore.approvalVoteCount
    : (voteProps.voteCount || 0);
  const karma = voteProps.baseScore;

  const { fail, reason: whyYouCantVote } = voteButtonsDisabledForUser(currentUser);
  const canVote = !fail;

  let moveToAlignnmentUserId = "";
  let documentTypeName = "comment";
  if (collectionName === "Comments") {
    const comment = document as CommentsList;
    moveToAlignnmentUserId = comment.moveToAlignmentUserId;
  }
  if (collectionName === "Posts") {
    documentTypeName = "post";
  }
  if (collectionName === "Revisions") {
    documentTypeName = "revision";
  }

  const af = (document as any).af;
  const afDate = (document as any).afDate;
  const afBaseScore = voteProps.document.afBaseScore;

  const moveToAfInfo = userIsAdmin(currentUser) && !!moveToAlignnmentUserId && (
    <div className={classes.tooltipHelp}>
      <span>
        Moved to AF by <Components.UsersName documentId={moveToAlignnmentUserId} /> on{' '}
        {afDate && moment(new Date(afDate)).format('YYYY-MM-DD')}
      </span>
    </div>
  );

  const karmaTooltipTitle = hideKarma
    ? 'This post has disabled karma visibility'
    : (
      <div>
        This {documentTypeName} has {karma} <b>overall</b> karma ({voteCount} {voteCount === 1 ? "Vote" : "Votes"})
      </div>
    );

  // Moved these tooltip gates to separate components above, removing inline creation.
  const tooltipPlacement = "top";

  // Return null if no document
  if (!document) return null;

  const buttonProps: Partial<OverallVoteButtonProps<VoteableTypeClient>> = { largeArrow: largeArrows };
  if (verticalArrows) {
    buttonProps.solidArrow = true;
  }

  return (
    <TooltipIfDisabled
      canVote={canVote}
      LWTooltip={LWTooltip}
      classes={classes}
      whyYouCantVote={whyYouCantVote}
      karmaTooltipTitle={karmaTooltipTitle}
      tooltipPlacement={tooltipPlacement}
    >
      <span className={classes.vote}>
        {!!af && !isAF && (
          <LWTooltip
            placement={tooltipPlacement}
            popperClassName={classes.tooltip}
            title={
              <div>
                <p>AI Alignment Forum Karma</p>
                {moveToAfInfo}
              </div>
            }
          >
            <span className={classes.secondaryScore}>
              <span className={classes.secondarySymbol}>Ω</span>
              <span className={classes.secondaryScoreNumber}>{afBaseScore || 0}</span>
            </span>
          </LWTooltip>
        )}

        {!af && isAF && (
          <LWTooltip
            title="LessWrong Karma"
            placement={tooltipPlacement}
            className={classes.lwTooltip}
          >
            <span className={classes.secondaryScore}>
              <span className={classes.secondarySymbol}>LW</span>
              <span className={classes.secondaryScoreNumber}>{document.baseScore || 0}</span>
            </span>
          </LWTooltip>
        )}

        {(!isAF || !!af) && (
          <span
            className={classNames(classes.overallSection, className, {
              [classes.overallSectionBox]: showBox,
              [classes.verticalArrows]: verticalArrows,
            })}
          >
            <TooltipIfEnabled
              canVote={canVote}
              LWTooltip={LWTooltip}
              classes={classes}
              tooltipPlacement={tooltipPlacement}
              title={
                <div>
                  <b>Overall Karma: Downvote</b>
                  <br />
                  How much do you like this overall?
                  <br />
                  <em>For strong downvote, click-and-hold
                  <br />
                  (Click twice on mobile)</em>
                </div>
              }
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

            <TooltipIfEnabled
              canVote={canVote}
              LWTooltip={LWTooltip}
              classes={classes}
              tooltipPlacement={tooltipPlacement}
              title={karmaTooltipTitle}
            >
              {hideKarma ? (
                <span> </span>
              ) : (
                <span className={classes.voteScore}>{karma}</span>
              )}
            </TooltipIfEnabled>

            <TooltipIfEnabled
              canVote={canVote}
              LWTooltip={LWTooltip}
              classes={classes}
              tooltipPlacement={tooltipPlacement}
              title={
                <div>
                  <b>Overall Karma: Upvote</b>
                  <br />
                  How much do you like this overall?
                  <br />
                  <em>For strong upvote, click-and-hold
                  <br />
                  (Click twice on mobile)</em>
                </div>
              }
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
        )}
      </span>
    </TooltipIfDisabled>
  );
};

const OverallVoteAxisComponent = registerComponent('OverallVoteAxis', OverallVoteAxis, { styles });

declare global {
  interface ComponentTypes {
    OverallVoteAxis: typeof OverallVoteAxisComponent;
  }
}

export default OverallVoteAxisComponent;
