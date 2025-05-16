import React, { useMemo, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import classNames from 'classnames';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { FilterMode, useSubscribeUserToTag } from '../../lib/filterSettings';
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';
import { Paper }from '@/components/widgets/Paper';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { Link } from '../../lib/reactRouterWrapper';
import { useMulti } from '../../lib/crud/withMulti';
import { useCreate } from '../../lib/crud/withCreate';
import { userIsDefaultSubscribed } from '../../lib/subscriptionUtil';
import LoginPopup from "../users/LoginPopup";
import LWClickAwayListener from "../common/LWClickAwayListener";
import LWPopper from "../common/LWPopper";
import { Typography } from "../common/Typography";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
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
    borderColor: theme.palette.grey[400],
    padding: "0px 8px 0px 8px",
  },
  buttonLabelContainer: {
    padding: '0px 9px 0px 8px',
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
    maxWidth: 260,
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
  },
})

export const taggedPostWording = taggingNameIsSet.get() ? `posts on this ${taggingNameSetting.get()}` : "posts with this tag"

const SubscribeButton = ({
  tag,
  subscribeMessage,
  unsubscribeMessage,
  isSubscribedOverride,
  subscribeUserToTagOverride,
  className,
  classes,
}: {
  tag: TagBasicInfo,
  subscriptionType?: string,
  subscribeMessage?: string,
  unsubscribeMessage?: string,
  isSubscribedOverride?: boolean,
  subscribeUserToTagOverride?: (tag: TagBasicInfo, filterMode: FilterMode) => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  // useSubscribeUserToTag ultimately uses a useState to store the filter settings internally,
  // this means that updates here do not affect the isSubscribed of other places this hook is used.
  // This is currently only a problem in TagSubforumPage2, so I have added a way to override the
  // isSubscribed and subscribeUserToTag functions here as a workaround. If this causes problems
  // elsewhere we should probably fix the useSubscribeUserToTag hook to use a ref instead of a state.
  const subscribeHook = useSubscribeUserToTag(tag)
  const { isSubscribed, subscribeUserToTag } = {
    isSubscribed: isSubscribedOverride ?? subscribeHook.isSubscribed,
    subscribeUserToTag: subscribeUserToTagOverride ?? subscribeHook.subscribeUserToTag,
  }

  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { flash } = useMessages();
  const { captureEvent } = useTracking()
  const [open, setOpen] = useState(false);
  const anchorEl = useRef(null);
  // Get existing NOTIFICATIONS subscription, if there is one
  const subscriptionType = "newTagPosts"
  const { results: notifSubscriptions } = useMulti({
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

  const isSubscribedToPostNotifs = useMemo(() => {
    if (notifSubscriptions?.length !== 1) { // due to `limit: 1` above, this should only happen if there is no subscription
      return userIsDefaultSubscribed({
        user: currentUser,
        subscriptionType, collectionName: "Tags", document: tag
      });
    }

    return notifSubscriptions[0].state === "subscribed";
  }, [notifSubscriptions, currentUser, tag]);

  const togglePostNotifsSubscribed = async (e: AnyBecauseTodo) => {
    try {
      e.preventDefault();
      const subscriptionState = isSubscribedToPostNotifs ? 'suppressed' : 'subscribed'
      captureEvent("subscribeClicked", {state: subscriptionState})

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
          name: "LoginPopup",
          contents: ({onClose}) => <LoginPopup onClose={onClose} />
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
        color={isSubscribed ? undefined : "primary"}
        onClick={onSubscribe}
        className={classes.button}
      >
        <LWTooltip
          title={
            isSubscribed
              ? `Unsubscribe to remove Frontpage boost for ${taggedPostWording}`
              : `See more ${taggedPostWording} on the Frontpage`
          }
          className={classNames(classes.buttonSection, classes.buttonLabelContainer)}
        >
          <ForumIcon icon="BellBorder" className={classes.notificationBell} />
          <span>{isSubscribed ? unsubscribeMessage : subscribeMessage}</span>
        </LWTooltip>
        {isSubscribed && (
          <div
            ref={anchorEl}
            className={classNames(classes.buttonSection, classes.dropdownArrowContainer)}
            onClick={(e) => {
              e.stopPropagation();
              captureEvent('notificationsMenuOpened', {tagId: tag._id, newState: open ? "closed" : "open"});
              setOpen((prev) => !prev);
            }}
          >
            <ForumIcon icon="ThickChevronDown" className={classes.dropdownArrow} />
          </div>
        )}
      </Button>
      <LWPopper open={!!anchorEl.current && isSubscribed && open} anchorEl={anchorEl.current} placement="bottom-start">
        <LWClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper className={classes.popout}>
            <span className={classes.checkbox}>
              <Checkbox checked={isSubscribedToPostNotifs} onChange={togglePostNotifsSubscribed} disableRipple />
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

export default registerComponent('SubscribeButton', SubscribeButton, {styles});


