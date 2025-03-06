import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useHover } from '../common/withHover';
import { useIsAboveScreenWidth } from '../hooks/useScreenWidth';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { useCurrentForumEvent } from '../hooks/useCurrentForumEvent';
import { POLL_MAX_WIDTH } from './ForumEventPoll';
import LWTooltip from "@/components/common/LWTooltip";
import UsersProfileImage from "@/components/users/UsersProfileImage";
import ForumEventResultPopper from "@/components/forumEvents/ForumEventResultPopper";

const styles = (theme: ThemeType) => ({
  voteCircle: {
    animation: 'results-fade-in 2s ease',
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    width: "100%",
    marginTop: -5,
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
      marginTop: -3,
    },
    [theme.breakpoints.down('sm')]: {
      marginTop: -1,
    },
  },
  '@keyframes results-fade-in': {
    '0%': {
      pointerEvents: "none",
    },
    '99%': {
      pointerEvents: "none",
    },
    '100%': {
      pointerEvents: "auto",
    }
  },
  voteTooltipBody: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '140%',
  },
  userResultsImage: {
    outline: `2px solid var(--forum-event-foreground)`,
    width: "100% !important",
    height: "unset !important",
  },
});

export type ForumEventVoteDisplay = {
  x: number,
  user: UsersMinimumInfo,
  comment: ShortformComments | null
}

const ForumEventResultIcon = ({
  vote,
  tooltipDisabled,
  classes,
}: {
  vote: ForumEventVoteDisplay;
  tooltipDisabled: boolean;
  classes: ClassesType<typeof styles>;
}) => {
  const isDesktop = useIsAboveScreenWidth(POLL_MAX_WIDTH);

  const { captureEvent } = useTracking();
  const { currentForumEvent } = useCurrentForumEvent();

  const { user, comment } = vote;

  const { eventHandlers, hover, anchorEl } = useHover();

  const [isPinned, setIsPinned] = useState(false);
  const [newRepliesCount, setNewRepliesCount] = useState(0);

  const popperOpen = hover || isPinned;

  if (!isDesktop) return null;

  return (
    <AnalyticsContext
      pageElementContext="forumEventResultIcon"
      forumEventId={currentForumEvent?._id}
      userIdDisplayed={vote.user._id}
    >
      <div key={vote.user._id} className={classes.voteCircle} {...eventHandlers}>
        <LWTooltip
          title={<div className={classes.voteTooltipBody}>{vote.user.displayName}</div>}
          disabled={!!vote.comment}
        >
          <UsersProfileImage
            user={vote.user}
            // The actual size gets overridden by the styles above. This
            // is still needed to get the right resolution from Cloudinary
            size={34}
            className={classes.userResultsImage}
          />
        </LWTooltip>
        {/*
          * Controlling whether the popper is open is done outside the component so that it fully
          * unmounts and clears all the state when closed
          */}
        {!tooltipDisabled && comment && popperOpen && (
          <ForumEventResultPopper
            anchorEl={anchorEl}
            user={user}
            comment={comment}
            captureEvent={captureEvent}
            setIsPinned={setIsPinned}
            isPinned={isPinned}
            newRepliesCount={newRepliesCount}
            setNewRepliesCount={setNewRepliesCount}
          />
        )}
      </div>
    </AnalyticsContext>
  );
};

const ForumEventResultIconComponent = registerComponent(
  'ForumEventResultIcon',
  ForumEventResultIcon,
  { styles }
);

declare global {
  interface ComponentTypes {
    ForumEventResultIcon: typeof ForumEventResultIconComponent;
  }
}

export default ForumEventResultIconComponent;
