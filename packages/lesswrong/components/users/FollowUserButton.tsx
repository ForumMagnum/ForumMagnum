import { useTracking } from '@/lib/analyticsEvents';
import { registerComponent } from '@/lib/vulcan-lib/components';
import React from 'react';
import { useNotifyMe } from '../hooks/useNotifyMe';
import { useOptimisticToggle } from '../hooks/useOptimisticToggle';
import classNames from 'classnames';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import { useMutationNoCache } from '@/lib/crud/useMutationNoCache';
import { gql } from '@/lib/generated/gql-codegen';
import LWTooltip from "../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    color: theme.palette.primary.main,
    cursor: "pointer",
  },
  subscribed: {
    color: "unset",
  },
  ultraFeedRoot: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    width: 90,
    padding: '0 8px',
    borderRadius: 4,
    fontSize: 16,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    border: 'none',
    '&:hover': {
      opacity: 0.9,
    },
  },
  ultraFeedSubscribed: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[500],
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
      color: theme.palette.grey[900],
    },
  },
});

export const FollowUserButton = ({user, styleVariant = "default", classes}: {
  user: UsersMinimumInfo,
  styleVariant?: "default" | "ultraFeed",
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking();

  const { isSubscribed, onSubscribe, disabled } = useNotifyMe({
    document: user,
    overrideSubscriptionType: "newActivityForFeed",
    hideFlashes: true,
  });

  const onSubscribeWithDM = async (ev: React.MouseEvent<Element, MouseEvent>) => {
    const onSubscribeNullSafe = onSubscribe ?? (() => Promise.resolve())

    await onSubscribeNullSafe(ev);
    return await sendNewFollowDM({ variables: { eventType: "newFollowSubscription" } });
  }

  const [subscribed, toggleSubscribed] = useOptimisticToggle(
    isSubscribed ?? false,
    onSubscribeWithDM
  );

  const [sendNewFollowDM] = useMutationNoCache(gql(`
    mutation sendEventTriggeredDM($eventType: String!) {
      sendEventTriggeredDM(eventType: $eventType)
    }
  `));

  const handleSubscribe = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    void toggleSubscribed(ev);
    captureEvent("followUserButtonClick", {subcribedToUser: user._id, subscribed: !subscribed})
  }

  const followTooltip = `${userGetDisplayName(user)}'s content will appear in your feed`

  if (disabled) {
    return null;
  }

  const rootStyle = styleVariant === "ultraFeed" ? classes.ultraFeedRoot : classes.root;
  const subscribedStyle = styleVariant === "ultraFeed" ? classes.ultraFeedSubscribed : classes.subscribed;

  return <div 
    className={classNames(rootStyle, {[subscribedStyle]: subscribed})} 
    onClick={handleSubscribe}
  >
    <LWTooltip title={followTooltip} placement="top" disabled={subscribed}>
      {subscribed ? "Following" : "Follow"}
    </LWTooltip>
  </div>;
}

export default registerComponent('FollowUserButton', FollowUserButton, {styles});


