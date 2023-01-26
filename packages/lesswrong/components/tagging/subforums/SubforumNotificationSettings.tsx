import React, { useEffect, useRef, useState } from "react";
import { Components, getFragment, registerComponent } from "../../../lib/vulcan-lib";
import NotificationsNoneIcon from "@material-ui/icons/NotificationsNone";
import NotificationsIcon from "@material-ui/icons/Notifications";
import Checkbox from '@material-ui/core/Checkbox';
import { AnalyticsContext, captureEvent } from "../../../lib/analyticsEvents";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import { useMulti } from "../../../lib/crud/withMulti";
import { Link } from "../../../lib/reactRouterWrapper";
import { useFilterSettings } from '../../../lib/filterSettings';
import { useMessages } from "../../common/withMessages";
import { userIsDefaultSubscribed } from "../../../lib/subscriptionUtil";
import { useCreate } from "../../../lib/crud/withCreate";
import { max } from "underscore";
import { useForceRerender } from "../../hooks/useFirstRender";
import { useUpdate } from "../../../lib/crud/withUpdate";

const styles = (theme: ThemeType): JssStyles => ({
  notificationsButton: {
    padding: 4,
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
});

const SubforumNotificationSettings = ({
  tag,
  userTagRel,
  currentUser,
  startOpen = false,
  className,
  classes,
}: {
  tag: TagBasicInfo;
  userTagRel: UserTagRelDetails;
  currentUser: UsersCurrent;
  startOpen?: boolean;
  className?: string;
  classes: ClassesType;
}) => {
  useForceRerender() // Required because anchorEl is not set on the first render
  const {filterSettings, setTagFilter} = useFilterSettings();
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(startOpen);
  const { flash } = useMessages();

  const { LWClickAwayListener, LWPopper, Typography, Loading } = Components;

  // Get existing subscription, if there is one
  const subscriptionType = "newTagPosts"
  const { results: subscriptions, loading: loadingSubscriptions } = useMulti({
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
  
  const { mutate: updateUserTagRel } = useUpdate({
    collectionName: 'UserTagRels',
    fragmentName: 'UserTagRelDetails',
  });

  const getIsSubscribedToPosts = () => {
    // Get the last element of the results array, which will be the most recent subscription
    if (subscriptions && subscriptions.length > 0) {
      // Get the newest subscription entry (Mingo doesn't enforce the limit:1)
      const currentSubscription = max(subscriptions, result=>new Date(result.createdAt).getTime());

      if (currentSubscription.state === "subscribed")
        return true;
      else if (currentSubscription.state === "suppressed")
        return false;
    }
    return userIsDefaultSubscribed({
      user: currentUser,
      subscriptionType, collectionName: "Tags", document: tag
    });
  }
  const isSubscribedToPosts = getIsSubscribedToPosts();

  const filterSetting = filterSettings?.tags?.find(({tagId}) => tag._id === tagId);
  const isFrontpageSubscribed = filterSetting?.filterMode === "Subscribed";

  const toggleIsFrontpageSubscribed = () => {
    setTagFilter({
      tagId: tag._id,
      tagName: tag.name,
      filterMode: isFrontpageSubscribed ? 0 : "Subscribed",
    });
  }

  const togglePostsSubscribed = async (e) => {
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
  
  const toggleDiscussionsSubscribed = async (e) => {
    try {
      e.preventDefault();
      await updateUserTagRel({selector: {_id: userTagRel._id}, data: {subforumEmailNotifications: !userTagRel.subforumEmailNotifications}})
    } catch(error) {
      flash({messageString: error.message});
    }
  }

  return (
    <AnalyticsContext pageSection="subforumNotificationSettings">
      <div className={className}>
        <div ref={anchorEl}>
          <IconButton onClick={() => setOpen(!open)} className={classes.notificationsButton}>
            {(!userTagRel.subforumShowUnreadInSidebar && !userTagRel.subforumEmailNotifications) ? (
              <NotificationsNoneIcon />
            ) : (
              <NotificationsIcon />
            )}
          </IconButton>
        </div>
        <LWPopper open={!!anchorEl.current && open} anchorEl={anchorEl.current} placement="bottom-end">
          <LWClickAwayListener onClickAway={() => setOpen(false)}>
            <Paper className={classes.popout}>
              {loadingSubscriptions ? (
                <Loading />
              ) : (
                <>
                  <span className={classes.checkbox}>
                    <Checkbox checked={isSubscribedToPosts} onChange={togglePostsSubscribed} disableRipple />
                    <Typography variant="body2">Notify me of new posts</Typography>
                  </span>
                  <span className={classes.checkbox}>
                    <Checkbox checked={userTagRel.subforumEmailNotifications} onChange={toggleDiscussionsSubscribed} disableRipple />
                    <Typography variant="body2">Notify me of new discussions</Typography>
                  </span>
                  <span className={classes.checkbox}>
                    <Checkbox checked={isFrontpageSubscribed} onChange={toggleIsFrontpageSubscribed} disableRipple />
                    <Typography variant="body2">Upweight on frontpage</Typography>
                  </span>
                  <Typography variant="body2" className={classes.accountLink}>
                    <Link to={"/account?highlightField=notificationSubscribedTagPost"}>Change notification batching and email vs on-site in account settings</Link>
                  </Typography>
                </>
              )}
            </Paper>
          </LWClickAwayListener>
        </LWPopper>
      </div>
    </AnalyticsContext>
  );
};

const SubforumNotificationSettingsComponent = registerComponent(
  "SubforumNotificationSettings",
  SubforumNotificationSettings,
  { styles, stylePriority: 1 }
);

declare global {
  interface ComponentTypes {
    SubforumNotificationSettings: typeof SubforumNotificationSettingsComponent;
  }
}
