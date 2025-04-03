import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import { VotingProps } from './votingProps';
import { isFriendlyUI } from '../../themes/forumTheme';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles('AgreementVoteAxis', (theme: ThemeType) => ({
  root: {
  },
  agreementSection: {
    display: "inline-block",
    fontSize: 25,
    lineHeight: 0.6,
    height: 24,
    minWidth: 60,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : 2,
    textAlign: 'center',
    whiteSpace: "nowrap",
  },
  agreementScore: {
    lineHeight: 1,
    margin: '0 7px',
  },
  agreementScoreSmall: {
    fontSize: "1.1rem",
    margin: '0 3px',
  },
  agreementScoreLarge: {
    fontSize: "1.3rem",
    margin: '0 7px',
  },
  tooltip: {
    transform: "translateY(-10px)",
  },
}));

const AgreementVoteAxis = ({ document, hideKarma=false, voteProps, size='small', }: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  size?: 'small' | 'large',
}) => {
  const { AxisVoteButton, LWTooltip } = Components;
  const classes = useStyles(styles);
  const voteCount = voteProps.document?.extendedScore?.agreementVoteCount || 0;
  const karma = voteProps.document?.extendedScore?.agreement || 0;
  const currentUser = useCurrentUser();
  const {fail, reason: whyYouCantVote} = voteButtonsDisabledForUser(currentUser);
  const canVote = !fail;

  let documentTypeName = "comment";
  if (voteProps.collectionName === "Posts") {
    documentTypeName = "post";
  }
  if (voteProps.collectionName === "Revisions") {
    documentTypeName = "revision";
  }
  
  const karmaTooltipTitle = React.useMemo(() => hideKarma
    ? 'This post has disabled karma visibility'
    : <div>This {documentTypeName} has {karma} <b>agreement</b> karma ({voteCount} {voteCount === 1 ? "Vote" : "Votes"})</div>
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
  , [canVote, karmaTooltipTitle, whyYouCantVote, classes.tooltip, LWTooltip])
  const TooltipIfEnabled = React.useMemo(() => canVote
    ? ({children, ...props}: React.ComponentProps<typeof LWTooltip>) =>
      <LWTooltip {...props} popperClassName={classes.tooltip}>
        {children}
      </LWTooltip>
    : ({children}: {children: React.ReactNode}) => <>{children}</>
  , [canVote, classes.tooltip, LWTooltip])

  const tooltipPlacement = "top";

  return <TooltipIfDisabled>
    <span className={classes.agreementSection}>
      <TooltipIfEnabled
        title={<div><b>Agreement: Downvote</b><br />How much do you <b>disagree</b> with this, separate from whether you think it's a good comment?<br /><em>For strong downvote, click-and-hold.<br />(Click twice on mobile)</em></div>}
        placement={tooltipPlacement}
      >
        <AxisVoteButton
          VoteIconComponent={Components.VoteAgreementIcon}
          axis="agreement"
          orientation="left" color="error" upOrDown="Downvote"
          enabled={canVote}
          {...voteProps}
        />
      </TooltipIfEnabled>

      <span className={classNames(
        classes.agreementScore,
        size === 'small' ? classes.agreementScoreSmall : classes.agreementScoreLarge
      )}>
        <TooltipIfEnabled title={karmaTooltipTitle} placement={tooltipPlacement}>
          {hideKarma
            ? <span>{' '}</span>
            : <span>
                {karma}
              </span>
          }
        </TooltipIfEnabled>
      </span>

      <TooltipIfEnabled
        title={<div><b>Agreement: Upvote</b><br />How much do you <b>agree</b> with this, separate from whether you think it's a good comment?<br /><em>For strong upvote, click-and-hold<br />(Click twice on mobile)</em></div>}
        placement={tooltipPlacement}
      >
        <AxisVoteButton
          VoteIconComponent={Components.VoteAgreementIcon}
          axis="agreement"
          orientation="right" color="secondary" upOrDown="Upvote"
          enabled={canVote}
          {...voteProps}
        />
      </TooltipIfEnabled>
    </span>
  </TooltipIfDisabled>
}


const AgreementVoteAxisComponent = registerComponent('AgreementVoteAxis', AgreementVoteAxis);

export default AgreementVoteAxisComponent;

declare global {
  interface ComponentTypes {
    AgreementVoteAxis: typeof AgreementVoteAxisComponent
  }
}
