import { useTracking } from '@/lib/analyticsEvents';
import { Components, registerComponent } from '@/lib/vulcan-lib';
import React from 'react';
import { useNotifyMe } from '../hooks/useNotifyMe';
import { useOptimisticToggle } from '../hooks/useOptimisticToggle';
import classNames from 'classnames';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import { gql } from '@apollo/client';
import { useMutate } from '../hooks/useMutate';

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

  const { LWTooltip } = Components;
  const { captureEvent } = useTracking();
  const { mutate } = useMutate();

  const { isSubscribed, onSubscribe, disabled } = useNotifyMe({
    document: user,
    overrideSubscriptionType: "newActivityForFeed",
    hideFlashes: true,
  });

  const onSubscribeWithDM = async (ev: React.MouseEvent<Element, MouseEvent>) => {
    const onSubscribeNullSafe = onSubscribe ?? (() => Promise.resolve())

    await onSubscribeNullSafe(ev);
    return await mutate({
      mutation: gql`
        mutation sendEventTriggeredDM($eventType: String!) {
          sendEventTriggeredDM(eventType: $eventType)
        }
      `,
      variables: { eventType: "newFollowSubscription" },
      errorHandling: "flashMessageAndReturn",
    });
  }

  const [subscribed, toggleSubscribed] = useOptimisticToggle(
    isSubscribed ?? false,
    onSubscribeWithDM
  );

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

const FollowUserButtonComponent = registerComponent('FollowUserButton', FollowUserButton, {styles});

declare global {
  interface ComponentTypes {
    FollowUserButton: typeof FollowUserButtonComponent
  }
}
