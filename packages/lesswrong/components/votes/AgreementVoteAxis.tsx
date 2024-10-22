import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { CommentVotingComponentProps } from '../../lib/voting/votingSystems';
import { useCurrentUser } from '../common/withUser';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import { VotingProps } from './votingProps';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  agreementSection: {
    display: "inline-block",
    fontSize: 25,
    marginLeft: 4,
    lineHeight: 0.6,
    height: 24,
    minWidth: 60,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : 2,
    textAlign: 'center',
    whiteSpace: "nowrap",
  },
  agreementScore: {
    fontSize: "1.1rem",
    marginLeft: 3,
    lineHeight: 1,
    marginRight: 3,
  },
  tooltip: {
    transform: isFriendlyUI ? "translateY(-10px)" : undefined,
  },
});

interface TwoAxisVoteOnCommentProps extends CommentVotingComponentProps {
  classes: ClassesType
}

const AgreementVoteAxis = ({ document, hideKarma=false, voteProps, classes }: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
}) => {
  const { AxisVoteButton, LWTooltip } = Components;
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
  
  const karmaTooltipTitle = hideKarma
    ? 'This post has disabled karma visibility'
    : <div>This {documentTypeName} has {karma} <b>agreement</b> karma ({voteCount} {voteCount === 1 ? "Vote" : "Votes"})</div>

  const TooltipIfDisabled = (canVote
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
  )
  const TooltipIfEnabled = (canVote
    ? ({children, ...props}: React.ComponentProps<typeof LWTooltip>) =>
      <LWTooltip {...props} popperClassName={classes.tooltip}>
        {children}
      </LWTooltip>
    : ({children}: {children: React.ReactNode}) => <>{children}</>
  );

  const tooltipPlacement = isFriendlyUI ? "top" : "bottom";

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

      <span className={classes.agreementScore}>
        <TooltipIfEnabled title={karmaTooltipTitle} placement={tooltipPlacement}>
          {hideKarma
            ? <span>{' '}</span>
            : <span className={classes.voteScore}>
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


const AgreementVoteAxisComponent = registerComponent('AgreementVoteAxis', AgreementVoteAxis, {styles});

declare global {
  interface ComponentTypes {
    AgreementVoteAxis: typeof AgreementVoteAxisComponent
  }
}
