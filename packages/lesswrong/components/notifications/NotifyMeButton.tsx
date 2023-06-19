import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import classNames from 'classnames';
import { SubscriptionType } from '../../lib/collections/subscriptions/schema';
import { useNotifyMe } from '../hooks/useNotifyMe';

// Note: We're changing 'subscribe' to refer to the frontpage bump of tags, this
// component still talks about 'subscriptions', but we're moving to calling them
// 'notifications enabled'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    '&:hover': {
      opacity: 0.5
    }
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: { //optimized for tag page
      display: "none"
    }
  },
  hide: {
    display: "none"
  },
})

const NotifyMeButton = ({
  document,
  subscriptionType: overrideSubscriptionType,
  subscribeMessage, unsubscribeMessage,
  tooltip,
  asMenuItem = false,
  className="",
  classes,
  showIcon,
  hideLabel = false,
  hideLabelOnMobile = false,
  hideIfNotificationsDisabled = false,
  asButton = false,
  componentIfSubscribed,
}: {
  document: AnyBecauseTodo,
  subscriptionType?: SubscriptionType,
  subscribeMessage?: string,
  tooltip?: string,
  asMenuItem?: boolean,
  unsubscribeMessage?: string,
  className?: string,
  classes: ClassesType,
  showIcon?: boolean,
  hideLabel?: boolean,
  hideLabelOnMobile?: boolean
  hideIfNotificationsDisabled?: boolean,
  // uses <a> by default, set this to use <button>
  asButton?: boolean,
  // display this component if the user is already subscribed, instead of the unsubscribeMessage
  componentIfSubscribed?: JSX.Element,
}) => {
  const {loading, disabled, isSubscribed, onSubscribe} = useNotifyMe({
    document,
    overrideSubscriptionType,
    hideIfNotificationsDisabled,
  });

  if (disabled) {
    return null;
  }

  const icon = showIcon && <ListItemIcon>
    {loading
      ? <Components.Loading/>
      : (isSubscribed
        ? <Components.ForumIcon icon="Bell" />
        : <Components.ForumIcon icon="BellBorder" />
      )
    }
  </ListItemIcon>

  const message = <span
    className={classNames({
      [classes.hideLabelOnMobile]: hideLabelOnMobile,
      [classes.hideLabel]: hideLabel,
    })}
  >
    { isSubscribed ? unsubscribeMessage : subscribeMessage}
  </span>

  const button = <>
    {icon}
    {message}
  </>

  const {MenuItem} = Components;
  const maybeMenuItemButton = asMenuItem ?
    <MenuItem onClick={onSubscribe}>
      <a className={classNames(classes.root, className)}>
        {button}
      </a>
    </MenuItem> : asButton ?
    <button onClick={onSubscribe} className={classNames(className, classes.root)}>
      {button}
    </button> :
    <a onClick={onSubscribe} className={classNames(className, classes.root)}>
      {button}
    </a>

  const maybeToolipButton = tooltip ? <Components.LWTooltip title={tooltip}>
      {maybeMenuItemButton}
    </Components.LWTooltip> :
    maybeMenuItemButton

  return componentIfSubscribed && isSubscribed
    ? componentIfSubscribed
    : maybeToolipButton;
}

const SubscribeToComponent = registerComponent(
  'NotifyMeButton',
  NotifyMeButton,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotifyMeButton: typeof SubscribeToComponent
  }
}
