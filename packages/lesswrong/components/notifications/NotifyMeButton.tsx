import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import ListItemIcon from '@/lib/vendor/@material-ui/core/src/ListItemIcon';
import classNames from 'classnames';
import { SubscriptionType } from '../../lib/collections/subscriptions/helpers';
import { useNotifyMe } from '../hooks/useNotifyMe';
import { isFriendlyUI } from '../../themes/forumTheme';
import LWTooltip from "../common/LWTooltip";
import Loading from "../vulcan-core/Loading";
import ForumIcon from "../common/ForumIcon";
import { MenuItem } from "../common/Menus";
import EAButton from "../ea-forum/EAButton";

// Note: We're changing 'subscribe' to refer to the frontpage bump of tags, this
// component still talks about 'subscriptions', but we're moving to calling them
// 'notifications enabled'

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    '&:hover': {
      opacity: 0.5
    }
  },
  icon: isFriendlyUI ? {
    color: theme.palette.grey[900],
    fontSize: 16,
    marginRight: 6,
  } : {},
  hideLabelOnMobile: {
    [theme.breakpoints.down('sm')]: { //optimized for tag page
      display: "none"
    }
  },
  hideLabel: {
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
  hideForLoggedOutUsers = false,
  hideFlashes = false,
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
  classes: ClassesType<typeof styles>,
  showIcon?: boolean,
  hideLabel?: boolean,
  hideLabelOnMobile?: boolean
  hideIfNotificationsDisabled?: boolean,
  // by default, we show the button to logged out users so that we can prompt them to login/sign up when they click it
  hideForLoggedOutUsers?: boolean,
  hideFlashes?: boolean,
  // uses <a> by default, set this to use <button>
  asButton?: boolean,
  // display this component if the user is already subscribed, instead of the unsubscribeMessage
  componentIfSubscribed?: React.JSX.Element,
}) => {
  const {loading, disabled, isSubscribed, onSubscribe} = useNotifyMe({
    document,
    overrideSubscriptionType,
    hideIfNotificationsDisabled,
    hideForLoggedOutUsers,
    hideFlashes,
  });

  if (disabled) {
    return null;
  }
  const icon = showIcon && <ListItemIcon>
    {loading
      ? <Loading/>
      : (isSubscribed
        ? <ForumIcon icon="Bell" className={classes.icon} />
        : <ForumIcon icon="BellBorder" className={classes.icon} />
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

  // Determine if this component should look like a link (default), menu item, or button
  let maybeMenuItemButton = null;
  if (asMenuItem) {
    maybeMenuItemButton = <MenuItem onClick={onSubscribe}>
      <a className={classNames(classes.root, className)}>
        {button}
      </a>
    </MenuItem>
  } else if (asButton) {
    maybeMenuItemButton = isFriendlyUI ? (
      <EAButton style="grey" onClick={onSubscribe}>{button}</EAButton>
    ) : (
      <button onClick={onSubscribe} className={classNames(className, classes.root)}>
        {button}
      </button>
    )
  } else {
    maybeMenuItemButton = <a onClick={onSubscribe} className={classNames(className, classes.root)}>
      {button}
    </a>
  }

  const maybeToolipButton = tooltip ? <LWTooltip title={tooltip}>
      {maybeMenuItemButton}
    </LWTooltip> :
    maybeMenuItemButton

  return componentIfSubscribed && isSubscribed
    ? componentIfSubscribed
    : maybeToolipButton;
}

export default registerComponent(
  'NotifyMeButton',
  NotifyMeButton,
  {styles},
);


