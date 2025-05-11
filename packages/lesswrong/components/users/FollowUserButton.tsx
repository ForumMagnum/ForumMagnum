import { useTracking } from '@/lib/analyticsEvents';
import { registerComponent } from '@/lib/vulcan-lib/components';
import React from 'react';
import { useNotifyMe } from '../hooks/useNotifyMe';
import { useOptimisticToggle } from '../hooks/useOptimisticToggle';
import classNames from 'classnames';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import { gql, useMutation } from '@apollo/client';
import LWTooltip from "../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    color: theme.palette.primary.main,
    cursor: "pointer",
  },
  subscribed: {
    color: "unset",
  }
});

export const FollowUserButton = ({user, classes}: {
  user: UsersMinimumInfo,
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

  const [sendNewFollowDM] = useMutation(gql`
    mutation sendEventTriggeredDM($eventType: String!) {
      sendEventTriggeredDM(eventType: $eventType)
    }
  `, {
    ignoreResults: true
  });

  const handleSubscribe = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    void toggleSubscribed(ev);
    captureEvent("followUserButtonClick", {subcribedToUser: user._id, subscribed: !subscribed})
  }

  const followTooltip = `${userGetDisplayName(user)}'s content will appear in your subscribed tab feed`

  if (disabled) {
    return null;
  }

  return <div className={classNames(classes.root, {[classes.subscribed]: subscribed})} onClick={handleSubscribe}>
    <LWTooltip title={followTooltip} placement="top" disabled={subscribed}>
      {subscribed ? "Unfollow" : "Follow"}
    </LWTooltip>
  </div>;
}

export default registerComponent('FollowUserButton', FollowUserButton, {styles});


