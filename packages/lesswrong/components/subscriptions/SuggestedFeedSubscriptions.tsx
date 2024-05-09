import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { useMessages } from '../common/withMessages';
import { useCreate } from '../../lib/crud/withCreate';
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { userGetDisplayNameById } from '../../lib/vulcan-users';
import { Link } from '../../lib/reactRouterWrapper';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { useEAOnboarding } from '../ea-forum/onboarding/useEAOnboarding';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
    marginBottom: 10,
    background: theme.palette.panelBackground.recentDiscussionThread,
    paddingTop: 18,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
    borderRadius: 3,

  },
  titleRow: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",

  },
  titleAndManageLink: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexGrow: 1
  },
  sectionTitle: {
    ...theme.typography.postStyle,
    marginBottom: 5,
    display: "block",
    fontSize: "1.5rem",
  },
  manageSubscriptionsLink: {
    padding: 8,
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    opacity: 0.7,
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
      opacity: 1.0,
    }
  },
  hideButton: {
    ...theme.typography.commentStyle,
    padding: 8,
    borderRadius: 3,
    fontSize: "1rem",
    opacity: 0.7,
    display: "flex",
    alignItems: "center",
    flexWrap: "nowrap",
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
      opacity: 1.0,
    }
  },
  userSubscribeButtons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  subscribeButton: {
    display: "flex",
    padding: 2,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "space-between",
    ...theme.typography.commentStyle,
    fontSize: "0.9rem",
    opacity: 0.9,
    background: theme.palette.grey[200]
  },
  buttonDisplayName: {
    marginLeft: 5,
    marginRight: 5,
  },
  icon: {
    width: 17,
    marginBottom: -3,
    cursor: "pointer",
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    }
  }
});


const SubscriptionButton = ({user, handleSubscribeOrDismiss, classes}: {
  user: UsersMinimumInfo, 
  handleSubscribeOrDismiss: (user: UsersMinimumInfo, dismiss?: boolean) => void, 
  classes: ClassesType<typeof styles>,
}) => {
  const { UsersName, ForumIcon, LWTooltip } = Components;

  const nameLengthLimit = 20;
  const completeName = userGetDisplayName(user)
  const truncatedName = completeName.slice(0, nameLengthLimit);
  const overlyLongName = completeName.length > nameLengthLimit;

  return <div className={classes.subscribeButton}>
    <div onClick={() => handleSubscribeOrDismiss(user)}>
      <LWTooltip title={`Subscribe to ${userGetDisplayName(user)}`} placement="bottom">
        <ForumIcon icon='Check' className={classes.icon} />
      </LWTooltip>
    </div>

    <span className={classes.buttonDisplayName} >
      {/* {overlyLongName ? truncatedName.slice(0,17) + '...': truncatedName} */}
      <UsersName user={user} />
    </span>

    <div onClick={() => handleSubscribeOrDismiss(user, true)}>
      <LWTooltip title="Dismiss" placement="bottom">
        <ForumIcon icon='Close' className={classes.icon} />
      </LWTooltip>
    </div>
  </div>;
}

export const SuggestedFeedSubscriptions = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  const [ widgetOpen, setWidgetOpen ] = useState(true);

  const { results, refetch } = usePaginatedResolver({
    fragmentName: "UsersMinimumInfo",
    resolverName: "SuggestedFeedSubscriptionUsers",
    limit: 15,
    itemsPerPage: 10,
  });

  const [ suggestedUsers, setSuggestedUsers ] = useState<UsersMinimumInfo[]>();
  const { captureEvent } = useTracking();
  const { flash } = useMessages();

  const { create: createSubscription } = useCreate({
    collectionName: 'Subscriptions',
    fragmentName: 'SubscriptionState',
  });

  useEffect(() => {
    console.log("in useEffect", {availableUsers, suggestedUsers, results})
    setSuggestedUsers(results);
  }, [results]);

  const availableUsers = suggestedUsers ?? results ?? [];

  const subscribeToUser = async (user: UsersMinimumInfo, dismiss=false) => {

      const newSubscription = {
        state: dismiss ? 'suppressed' : 'subscribed',
        documentId: user._id,
        collectionName: "Users",
        type: "newActivityForFeed",
      } as const;

      void createSubscription({data: newSubscription}).then(() => refetch());
      captureEvent("subscribedToUserFeedActivity", {subscribedUserId: user._id, state: newSubscription.state})
      
      const username = userGetDisplayName(user)
      const successMessage = dismiss ? `Successfully dismissed ${username}` : `Successfully subscribed to ${username}`
      flash({messageString: successMessage});

      console.log("Subscribed to user", user._id, "with state", newSubscription.state)
      console.log("in subscribeToUser", {availableUsers, suggestedUsers, results})
      setSuggestedUsers(availableUsers.filter((suggestedUser) => suggestedUser._id !== user._id));
  }

  return <div className={classes.root}>
    <div className={classes.titleRow}>
      <div className={classes.hideButton} onClick={()=> setWidgetOpen(!widgetOpen)}>
        {widgetOpen ? "Hide" : "Show Suggested Users"}
      </div>
      {widgetOpen && <div className={classes.titleAndManageLink}>
        <div className={classes.sectionTitle}>
          Suggested Users for You
        </div>
        <Link to="/manageSubscriptions" className={classes.manageSubscriptionsLink}>
          {preferredHeadingCase("Manage Subscriptions")}
        </Link>
      </div>}
    </div>
    {widgetOpen && <div className={classes.userSubscribeButtons}>
      {availableUsers && availableUsers?.slice(0,12).map((user) => <SubscriptionButton 
        user={user} 
        key={user._id} 
        handleSubscribeOrDismiss={subscribeToUser}
        classes={classes}
      />)}
    </div>}
  </div>;
}

const SuggestedFeedSubscriptionsComponent = registerComponent('SuggestedFeedSubscriptions', SuggestedFeedSubscriptions, {styles});

declare global {
  interface ComponentTypes {
    SuggestedFeedSubscriptions: typeof SuggestedFeedSubscriptionsComponent
  }
}
