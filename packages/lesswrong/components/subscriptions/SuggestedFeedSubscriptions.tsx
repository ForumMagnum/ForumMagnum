import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { useMessages } from '../common/withMessages';
import { useCreate } from '../../lib/crud/withCreate';
import { UserDisplayNameInfo, userGetDisplayName } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import classNames from 'classnames';
import { apolloSSRFlag } from '@/lib/helpers';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginTop: 10,
    background: theme.palette.panelBackground.recentDiscussionThread,
    borderRadius: 3,
  },
  widgetOpen: {
    paddingTop: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
    marginBottom: 10,
    width: "100%",
  },
  widgetClosed: {
    opacity: 0.8,
    background: "none",
    textShadow: `2px 2px 20px ${theme.palette.background.default}`
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
    [theme.breakpoints.down('xs')]: {
      fontSize: "1.3rem",
    }
  },
  manageSubscriptionsLink: {
    padding: 8,
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    opacity: 0.7,
    '&:hover': {
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
      opacity: 0.7,
    }
  },
  userSubscribeButtons: {
    display: "flex",
    flexWrap: "wrap",
    overflow: "hidden",
    alignContent: "start",
    gap: "4px",
    height: 164,
    ['@media(max-width: 409px)']: {
      width: 302,
    },
  },
  suggestedUserListItem: {
    transition: "all .5s ease-out",
    listStyle: "none",
    height: 80,
    width: 118,
    ['@media(max-width: 409px)']: {
      width: 98,
    },
  },
  removedSuggestedUserListItem: {
    width: 0,
    opacity: 0,
  },
  suggestedUser: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    border: theme.palette.border.normal,
    height: "100%",
    borderRadius: 4,
    padding: 5,
  },
  suggestedUserButtons: {
    display: "flex",
    gap: "4px",
  },
  subscribeButton: {
    display: "flex",
    padding: 5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    ...theme.typography.commentStyle,
    fontSize: "0.8rem",
    opacity: 0.9,
    background: theme.palette.grey[200],
    cursor: "pointer",
    width: 52,
    ['@media(max-width: 409px)']: {
      width: 42,
    },
  },
  buttonDisplayName: {
    ...theme.typography.commentStyle,
    width: "100%",
    flexGrow: 1,
  },
  clampedUserName: {
    // This entire setup allows us to do a graceful truncation after 2 lines (which some longer display names hit)
    // Browser support is _basically_ good: https://caniuse.com/?search=line-clamp
    height: "2lh",
    display: "-webkit-box",
    overflow: "hidden",
    textOverflow: "ellipsis",
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': "vertical",
    // Some single-word display names are longer than the width of the container
    overflowWrap: "break-word",
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


const SubscriptionButton = ({user, handleSubscribeOrDismiss, hidden, classes}: {
  user: UsersMinimumInfo, 
  handleSubscribeOrDismiss: (user: UsersMinimumInfo, dismiss?: boolean) => void,
  hidden?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { UsersName } = Components;

  return (<li className={classNames(classes.suggestedUserListItem, { [classes.removedSuggestedUserListItem]: hidden })}>
    <div className={classes.suggestedUser}>
      <div className={classes.buttonDisplayName} >
        <UsersName user={user} className={classes.clampedUserName} />
      </div>
      <div className={classes.suggestedUserButtons}>
        <div className={classes.subscribeButton}>
          <div onClick={() => handleSubscribeOrDismiss(user)}>
            Follow
          </div>
        </div>
        <div className={classes.subscribeButton}>
          <div onClick={() => handleSubscribeOrDismiss(user, true)}>
            Dismiss
          </div>
        </div>
      </div>
    </div>
  </li>);
}

export const SuggestedFeedSubscriptions = ({refetchFeed, classes}: {
  refetchFeed: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, UserSelect } = Components;

  const [cookies, setCookie] = useCookiesWithConsent([HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS])
  const [widgetOpen, setWidgetOpen] = useState(cookies[HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS] !== "true");

  const [suggestedUsers, setSuggestedUsers] = useState<UsersMinimumInfo[]>();
  const [hiddenSuggestionIdx, setHiddenSuggestionIdx] = useState<number>();

  const { captureEvent } = useTracking();
  const { flash } = useMessages();

  const displayedSuggestionLimit = 12;

  const toggleWidgetOpen = () => {
    setWidgetOpen(!widgetOpen);
    setCookie(HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS, widgetOpen ? "true" : "false")
  }

  const { results, loading } = usePaginatedResolver({
    fragmentName: "UsersMinimumInfo",
    resolverName: "SuggestedFeedSubscriptionUsers",
    limit: 15,
    itemsPerPage: 10,
    ssr: apolloSSRFlag(false),
  });

  const { create: createSubscription } = useCreate({
    collectionName: 'Subscriptions',
    fragmentName: 'SubscriptionState',
  });

  useEffect(() => {
    setSuggestedUsers(results);
  }, [results]);

  const availableUsers = suggestedUsers ?? results ?? [];

  const subscribeToUser = (user: HasIdType & UserDisplayNameInfo, index?: number, dismiss = false) => {
    const newSubscription = {
      state: dismiss ? 'suppressed' : 'subscribed',
      documentId: user._id,
      collectionName: "Users",
      type: "newActivityForFeed",
    } as const;

    void createSubscription({data: newSubscription});
    captureEvent("subscribedToUserFeedActivity", {subscribedUserId: user._id, state: newSubscription.state})
    
    const username = userGetDisplayName(user)
    const successMessage = dismiss ? `Successfully dismissed ${username}` : `Successfully subscribed to ${username}`
    flash({messageString: successMessage});

    // This plus the conditional styling on the list items is to allow for a smoother collapse animation
    // General approach taken from https://css-tricks.com/animation-techniques-for-adding-and-removing-items-from-a-stack/#aa-the-collapse-animation
    setHiddenSuggestionIdx(index);
    setTimeout(() => {
      setHiddenSuggestionIdx(undefined);
      setSuggestedUsers(availableUsers.filter((suggestedUser) => suggestedUser._id !== user._id));
    }, 700);
    if (!dismiss) {
      void refetchFeed();
    }
  };

  return <div className={classNames(classes.root, {[classes.widgetOpen]: widgetOpen, [classes.widgetClosed]: !widgetOpen})}>
    <div className={classes.titleRow}>
      <div className={classes.hideButton} onClick={toggleWidgetOpen}>
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
    {widgetOpen && loading && <Loading />}
    {widgetOpen && !loading && <div className={classes.userSubscribeButtons}>
      {availableUsers.slice(0, displayedSuggestionLimit).map((user, idx) => <SubscriptionButton 
        user={user} 
        key={user._id}
        hidden={idx === hiddenSuggestionIdx}
        handleSubscribeOrDismiss={(user, dismiss) => subscribeToUser(user, idx, dismiss)}
        classes={classes}
      />)}
    </div>}
    {widgetOpen && <UserSelect value={null} setValue={(_, user) => user && subscribeToUser(user)} label='Subscribe to user' />}
  </div>;
}

const SuggestedFeedSubscriptionsComponent = registerComponent('SuggestedFeedSubscriptions', SuggestedFeedSubscriptions, {styles});

declare global {
  interface ComponentTypes {
    SuggestedFeedSubscriptions: typeof SuggestedFeedSubscriptionsComponent
  }
}
