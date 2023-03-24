import React, { useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { useSubscribeUserToTag } from '../../lib/filterSettings';
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import { Link } from '../../lib/reactRouterWrapper';
import { useMulti } from '../../lib/crud/withMulti';
import { useCreate } from '../../lib/crud/withCreate';
import { userIsDefaultSubscribed } from '../../lib/subscriptionUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  button: {
    textTransform: 'none',
    boxShadow: 'none',
    padding: 0,
    fontSize: '14px',
    alignItems: 'unset', // required for vertical bar
    minHeight: 32,
  },
  buttonSection: {
    display: 'flex',
    alignItems: 'center'
  },
  dropdownArrowContainer: {
    borderLeft: "solid 1px",
    borderColor: theme.palette.grey[300],
    padding: "0px 8px 0px 8px",
  },
  buttonLabelContainer: {
    padding: '0px 9px 0px 8px',
  },
  subscribedButton: {
    backgroundColor: theme.palette.grey[200],
    color: 'default'
  },
  notSubscribedButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  notificationBell: {
    width: 17,
    height: 17,
    marginRight: 5,
  },
  dropdownArrow: {
    width: 16,
    height: 16,
  },
  popout: {
    padding: "4px 0px 4px 0px",
    marginTop: 8,
    maxWidth: 220,
    '& .form-input': {
      marginTop: 0,
    },
    '& .form-input:last-child': {
      marginBottom: 4,
    }
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    marginRight: 24,
    "& .MuiButtonBase-root": {
      padding: 6,
    },
    "& .Typography-root": {
      cursor: "default",
    },
  },
  accountLink: {
    borderTop: "solid 1px",
    borderColor: theme.palette.grey[300],
    margin: "4px 4px 0px 4px",
    padding: "4px 4px 0px 4px",
    fontSize: 13,
    color: theme.palette.primary.main
  }
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
  const [open, setOpen] = useState(false);
  const anchorEl = useRef(null);

  const { LWClickAwayListener, LWPopper, Typography, LWTooltip, ForumIcon } = Components;
  
  // Get existing subscription, if there is one
  const subscriptionType = "newTagPosts"
  const { results: notifSubscriptions, loading: loadingNotifSettings } = useMulti({
    terms: {
      view: "subscriptionState",
      documentId: tag._id,
      userId: currentUser?._id,
      type: subscriptionType,
      collectionName: "Tags",
      limit: 1
    },
    collectionName: "Subscriptions",
    fragmentName: 'SubscriptionState',
    enableTotal: false,
  });
  const { create: createSubscription } = useCreate({
    collectionName: 'Subscriptions',
    fragmentName: 'SubscriptionState',
  });

  const isSubscribedToPosts = useMemo(() => {
    const relevantSubscriptions = notifSubscriptions?.filter(s => ["subscribed", "suppressed"].includes(s.state));

    if (relevantSubscriptions?.length !== 1) { // due to `limit: 1` above, this should only happen if there is no subscription
      return userIsDefaultSubscribed({
        user: currentUser,
        subscriptionType, collectionName: "Tags", document: tag
      });
    }

    return relevantSubscriptions[0].state === "subscribed";
  }, [notifSubscriptions, currentUser, tag]);

  const togglePostNotifsSubscribed = async (e) => {
    try {
      e.preventDefault();
      const subscriptionState = isSubscribedToPosts ? 'suppressed' : 'subscribed'
      captureEvent("subscribeClicked", {state: subscriptionState}) // TODO capture better events

      const newSubscription = {
        state: subscriptionState,
        documentId: tag._id,
        collectionName: "Tags",
        type: subscriptionType,
      } as const;

      await createSubscription({data: newSubscription})
    } catch(error) {
      flash({messageString: error.message});
    }
  }

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

  return (
    <div className={classNames(className, classes.root)}>
      <Button
        variant="contained"
        onClick={onSubscribe}
        className={classNames(classes.button, {
          [classes.subscribedButton]: isSubscribed,
          [classes.notSubscribedButton]: !isSubscribed,
        })}
      >
        <LWTooltip
          title={
            isSubscribed
              ? `Remove homepage boost for ${taggedPostWording}`
              : `See more ${taggedPostWording} on the homepage`
          }
          className={classNames(classes.buttonSection, classes.buttonLabelContainer)}
        >
          <ForumIcon icon="BellBorder" className={classes.notificationBell} />
          <span className={classes.subscribeText}>{isSubscribed ? unsubscribeMessage : subscribeMessage}</span>
        </LWTooltip>
        {isSubscribed && (
          <div
            ref={anchorEl}
            className={classNames(classes.buttonSection, classes.dropdownArrowContainer)}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
          >
            <ForumIcon icon="ThickChevronDown" className={classes.dropdownArrow} />
          </div>
        )}
      </Button>
      {/* TODO check this works correctly for logged out users */}
      {/* TODO add analytics back in */}
      <LWPopper open={!!anchorEl.current && isSubscribed && open} anchorEl={anchorEl.current} placement="bottom-start">
        <LWClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper className={classes.popout}>
            <span className={classes.checkbox}>
              <Checkbox checked={isSubscribedToPosts} onChange={togglePostNotifsSubscribed} disableRipple />
              <Typography variant="body2">Notify me of new posts</Typography>
            </span>
            <Typography variant="body2" className={classes.accountLink}>
              <Link to={"/account?highlightField=notificationSubscribedTagPost"}>
                Change notification batching in account settings
              </Link>
            </Typography>
          </Paper>
        </LWClickAwayListener>
      </LWPopper>
    </div>
  );
}

const SubscribeButtonComponent = registerComponent('SubscribeButton', SubscribeButton, {styles});

declare global {
  interface ComponentTypes {
    SubscribeButton: typeof SubscribeButtonComponent
  }
}
