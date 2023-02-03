import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useTracking } from "../../lib/analyticsEvents";
import { useSubscribeUserToTag } from '../../lib/filterSettings';
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.up('sm')]: {
      marginTop: 8,
    }
  },
})

export const taggedPostWording = taggingNameIsSet.get() ? `posts with this ${taggingNameSetting.get()}` : "posts with this tag"

const SubscribeButton = ({
  tag,
  userTagRel,
  subscribeMessage,
  unsubscribeMessage,
  showNotificationBell = true,
  className,
  classes,
}: {
  tag: TagBasicInfo,
  userTagRel?: UserTagRelDetails,
  subscriptionType?: string,
  subscribeMessage?: string,
  unsubscribeMessage?: string,
  showNotificationBell?: boolean,
  className?: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { isSubscribed, subscribeUserToTag } = useSubscribeUserToTag(tag)
  const { flash } = useMessages();
  const { captureEvent } = useTracking()
  const { LWTooltip, TagNotificationSettings } = Components

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

  return <div className={classNames(className, classes.root)}>
    <LWTooltip title={isSubscribed ?
      `Remove homepage boost for ${taggedPostWording}` :
      `See more ${taggedPostWording} on the homepage`
    }>
      <Button variant="outlined" onClick={onSubscribe}>
        <span className={classes.subscribeText}>{ isSubscribed ? unsubscribeMessage : subscribeMessage}</span>
      </Button>
    </LWTooltip>
    {showNotificationBell && currentUser && <TagNotificationSettings
      tag={tag}
      userTagRel={userTagRel}
      currentUser={currentUser}
      isFrontpageSubscribed={!!isSubscribed}
    />}
  </div>
}

const SubscribeButtonComponent = registerComponent('SubscribeButton', SubscribeButton, {styles});

declare global {
  interface ComponentTypes {
    SubscribeButton: typeof SubscribeButtonComponent
  }
}
