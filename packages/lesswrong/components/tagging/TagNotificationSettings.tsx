import React, { useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import NotificationsNoneIcon from "@material-ui/icons/NotificationsNone";
import NotificationsIcon from "@material-ui/icons/Notifications";
import Checkbox from '@material-ui/core/Checkbox';
import { AnalyticsContext, captureEvent } from "../../lib/analyticsEvents";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import { useMulti } from "../../lib/crud/withMulti";
import { Link } from "../../lib/reactRouterWrapper";
import { useMessages } from "../common/withMessages";
import { userIsDefaultSubscribed } from "../../lib/subscriptionUtil";
import { useCreate } from "../../lib/crud/withCreate";
import { max } from "underscore";
import { useForceRerender } from "../hooks/useFirstRender";
import { useUpdate } from "../../lib/crud/withUpdate";
import { subscriptionTypes } from "../../lib/collections/subscriptions/schema";
import { taggingNameIsSet, taggingNameSetting } from "../../lib/instanceSettings";
import { taggedPostWording } from "./SubscribeButton";

const styles = (theme: ThemeType): JssStyles => ({
  notificationsButton: {
    padding: 4,
  },
  nonSubforumButtonWrapper: {
    paddingLeft: 12,
  },
  subforumButtonWrapper: {
    paddingLeft: 8,
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

const TagNotificationSettings = ({
  tag,
  userTagRel,
  currentUser,
  isFrontpageSubscribed,
  classes,
}: {
  tag: TagBasicInfo;
  userTagRel?: UserTagRelDetails;
  currentUser: UsersCurrent;
  isFrontpageSubscribed: boolean;
  classes: ClassesType;
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const { flash } = useMessages();

  const { LWClickAwayListener, LWPopper, Typography, Loading, NotifyMeButton } = Components;

  const isSubforum = !!(tag.isSubforum && userTagRel)

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
    skip: !isSubforum
  });
  const { create: createSubscription } = useCreate({
    collectionName: 'Subscriptions',
    fragmentName: 'SubscriptionState',
  });
  
  const { mutate: updateUserTagRel } = useUpdate({
    collectionName: 'UserTagRels',
    fragmentName: 'UserTagRelDetails',
  });

  if (!isSubforum) {
    return (
      <AnalyticsContext pageSection="tagNotificationSettings">
        <NotifyMeButton
          document={tag}
          tooltip={`Click to toggle notifications for ${taggedPostWording}`}
          showIcon
          hideLabel
          hideIfNotificationsDisabled={!isFrontpageSubscribed}
          subscriptionType={subscriptionTypes.newTagPosts}
          className={classes.nonSubforumButtonWrapper}
        />
      </AnalyticsContext>
    )
  }

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
      <div className={classes.subforumButtonWrapper}>
        <div ref={anchorEl}>
          {/* Hide notification settings if not subscribed */}
          <div style={!isFrontpageSubscribed ? {display: 'none'} : {}}>
            <IconButton onClick={() => setOpen(!open)} className={classes.notificationsButton}>
              {(!userTagRel.subforumEmailNotifications && !isSubscribedToPosts) ? (
                <NotificationsNoneIcon />
              ) : (
                <NotificationsIcon />
              )}
            </IconButton>
          </div>
        </div>
        <LWPopper open={!!anchorEl.current && isFrontpageSubscribed && open} anchorEl={anchorEl.current} placement="bottom-end">
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

const TagNotificationSettingsComponent = registerComponent(
  "TagNotificationSettings",
  TagNotificationSettings,
  { styles, stylePriority: 1 }
);

declare global {
  interface ComponentTypes {
    TagNotificationSettings: typeof TagNotificationSettingsComponent;
  }
}
