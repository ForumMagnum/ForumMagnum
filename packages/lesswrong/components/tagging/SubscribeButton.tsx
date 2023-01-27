import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useTracking } from "../../lib/analyticsEvents";
import { useSubscribeUserToTag } from '../../lib/filterSettings';
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema';
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.up('sm')]: {
      marginTop: 8,
    }
  },
  notifyMeButton: {
    marginLeft: 12,
  },
})

const SubscribeButton = ({
  tag,
  userTagRel,
  subscribeMessage,
  unsubscribeMessage,
  className,
  classes,
}: {
  tag: TagBasicInfo,
  userTagRel?: UserTagRelDetails,
  subscriptionType?: string,
  subscribeMessage?: string,
  unsubscribeMessage?: string,
  className?: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { isSubscribed, subscribeUserToTag } = useSubscribeUserToTag(tag)
  const { flash } = useMessages();
  const { captureEvent } = useTracking()
  const { LWTooltip, NotifyMeButton, SubforumNotificationSettings } = Components

  const onSubscribe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      e.preventDefault();

      const newMode = isSubscribed ? "Default" : "Subscribed";
      captureEvent('newSubscribeClicked', {tagId: tag._id, newMode});

      if (currentUser) {
        subscribeUserToTag(tag, newMode);
        flash({messageString: isSubscribed ? "Unsubscribed" : "Subscribed"});
      } else {
        openDialog({
          componentName: "LoginPopup",
          componentProps: {}
        });
      }
    } catch(error) {
      flash({messageString: error.message});
    }
  }

  const postsWording = taggingNameIsSet.get() ? `posts tagged with this ${taggingNameSetting.get()}` : "posts with this tag"

  // TODO: should this all live under NotifyMeButton?
  // NotifyMeButton is doing a lot of other stuff
  // Make SubforumNotificationSettings fall back to NotifyMeButton if not a subforum
  return <div className={classNames(className, classes.root)}>
    <LWTooltip title={isSubscribed ?
      `Remove homepage boost for ${postsWording}` :
      `See more ${postsWording} on the homepage`
    }>
      <Button variant="outlined" onClick={onSubscribe}>
        <span className={classes.subscribeText}>{ isSubscribed ? unsubscribeMessage : subscribeMessage}</span>
      </Button>
    </LWTooltip>
    <SubforumNotificationSettings
      startOpen={false}
      tag={tag}
      userTagRel={userTagRel}
      currentUser={currentUser}
      isFrontpageSubscribed={!!isSubscribed}
      className={classes.notifyMeButton}
    />
    {/* {tag.isSubforum && currentUser && userTagRel && isSubscribed ? (
        <SubforumNotificationSettings
          startOpen={false}
          tag={tag}
          userTagRel={userTagRel}
          currentUser={currentUser}
          className={classes.notificationSettings}
        />
      ) : (
        <NotifyMeButton
          document={tag}
          tooltip={`Click to toggle notifications for ${postsWording}`}
          showIcon
          hideLabel
          hideIfNotificationsDisabled={!isSubscribed}
          subscriptionType={subscriptionTypes.newTagPosts}
          className={classes.notifyMeButton}
        />
      )} */}
  </div>
}

const SubscribeButtonComponent = registerComponent('SubscribeButton', SubscribeButton, {styles});

declare global {
  interface ComponentTypes {
    SubscribeButton: typeof SubscribeButtonComponent
  }
}
