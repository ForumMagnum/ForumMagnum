import React, { useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMessages } from '../common/withMessages';
import { useCreate } from '../../lib/crud/withCreate';
import { UserDisplayNameInfo, userGetDisplayName } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { preferredHeadingCase } from '../../themes/forumTheme';
import classNames from 'classnames';
import CloseIcon from '@material-ui/icons/Close';
import { PopperPlacementType } from '@material-ui/core/Popper';
import { useCurrentUser } from '../common/withUser';
import Paper from '@material-ui/core/Paper';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginTop: 10,
    background: theme.palette.panelBackground.recentDiscussionThread,
    borderRadius: 3,
    paddingTop: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
    marginBottom: 10,
  },
  titleRow: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  titleAndManageLink: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexGrow: 1
  },
  sectionTitle: {
    ...theme.typography.postStyle,
    display: "block",
    fontSize: "1.5rem",
    flexGrow: 1,
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
  userSubscribeCards: {
    display: "flex",
    flexWrap: "wrap",
    overflow: "hidden",
    alignContent: "start",
    gap: "6px",
    height: 180,
    marginTop: 8,
  },
  suggestedUserListItem: {
    transition: "all .5s ease-out",
    listStyle: "none",
    height: 85,
    minWidth: 145,
    flexGrow: 1,
    flexBasis: 145,
    ['@media(max-width: 500px)']: {
      minWidth: 98,
      flexBasis: 98,
    },
  },
  removedSuggestedUserListItem: {
    width: 0,
    opacity: 0,
  },
  suggestedUser: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: theme.palette.grey[100],
    gap: "4px",
    height: "100%",
    borderRadius: 4,
    padding: 8,
  },
  buttonUserInfo: {
    display: "flex",
    flexDirection: "column",
    // gap: "4px",
    // flexGrow: 1,
  },
  subscribeButton: {
    display: "flex",
    padding: 5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    ...theme.typography.commentStyle,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  followButton: {
    width: 70,
    color: theme.palette.grey['A400'],
    background: theme.palette.grey[300],
    '&:hover': {
      color: theme.palette.grey['A700'],
    }
  },
  buttonDisplayNameAndDismiss: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dismissButton: {
    width: 16,
    height: 16,
    color: theme.palette.grey[400],
    cursor: "pointer",
    '&:hover': {
      color: theme.palette.grey[900],
    }
  },
  buttonDisplayName: {
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    width: "100%",
    marginBottom: 4,
  },
  buttonMetaInfo: {
    color: theme.palette.grey[600],
    fontSize: "0.8rem",
  },
  buttonInfo: {
    "&&": {
      fontSize: "0.8rem",
      marginRight: 6,
      color: theme.palette.grey[600],
    }
  },
  clampedUserName: {
    // This entire setup allows us to do a graceful truncation after 2 lines (which some longer display names hit)
    // Browser support is _basically_ good: https://caniuse.com/?search=line-clamp
    height: "1lh",
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
  },
  subscriptionSearchRoot: {
    // display: "flex",
    // flexDirection: "column",
    // gap: 6,
    // width: "100%",
  },
  followUserSearchButton: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    display: "inline-block",
    textAlign: "center",
    "@media print": { display: "none" },
  },
  followUserSearchIcon: {
    width: 18,
    marginBottom: -3,
    marginRight: 2,
  },
  hideOnSmallScreens: {
    ['@media(max-width: 500px)']: {
      display: "none",
    }
  }
});


const SubscriptionButton = ({user, handleSubscribeOrDismiss, hidden, classes}: {
  user: UsersMinimumInfo, 
  handleSubscribeOrDismiss: (user: UsersMinimumInfo, dismiss?: boolean) => void,
  hidden?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { UsersName, UserMetaInfo } = Components;

  return (<li className={classNames(classes.suggestedUserListItem, { [classes.removedSuggestedUserListItem]: hidden })}>
    <div className={classes.suggestedUser}>

      <div className={classes.buttonUserInfo} >
        <div className={classes.buttonDisplayNameAndDismiss} >
          <div className={classes.buttonDisplayName} >
            <UsersName user={user} className={classes.clampedUserName} />
          </div>
          <CloseIcon onClick={() => handleSubscribeOrDismiss(user, true)} className={classes.dismissButton} />
        </div>
        <div className={classes.buttonMetaInfo}>
          <UserMetaInfo 
            user={user} 
            infoClassName={classes.buttonInfo} 
            hideAfKarma 
            hideWikiContribution 
            hideInfoOnSmallScreen
          />
        </div>
      </div>
      <div className={classNames(classes.subscribeButton, classes.followButton)}>
        <div onClick={() => handleSubscribeOrDismiss(user)}>
          Follow
        </div>
      </div>
    </div>
  </li>);
}


const FollowUserSearchButton = ({onUserSelected, tooltipPlacement = "bottom-end", classes}: {
  onUserSelected: (user: UsersMinimumInfo ) => void,
  tooltipPlacement?: PopperPlacementType,
  classes: ClassesType<typeof styles>,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchorEl = useRef<HTMLAnchorElement|null>(null);
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const { LWPopper, FollowUserSearch, LWClickAwayListener, ForumIcon } = Components

  if(!currentUser) {
    return null;
  }

  return <a
    onClick={() => {
      setIsOpen(true);
      captureEvent("followUserSearchClicked")
    }}
    className={classes.followUserSearchButton}
    ref={anchorEl}
  >
      <span className={classes.followUserSearchButton}>
        <ForumIcon icon="Search" className={classes.followUserSearchIcon}/>
      </span>
    <LWPopper
      open={isOpen}
      anchorEl={anchorEl.current}
      placement={tooltipPlacement}
      allowOverflow
    >
      <LWClickAwayListener
        onClickAway={() => setIsOpen(false)}
      >
        <Paper>
          <FollowUserSearch
            currentUser={currentUser}
            onUserSelected={(user: UsersMinimumInfo) => {
              setIsOpen(false);
              onUserSelected(user);
            }}
          />
        </Paper>
      </LWClickAwayListener>
    </LWPopper>
  </a>;
}


export const SuggestedFeedSubscriptions = ({ availableUsers, loadingSuggestedUsers, setAvailableUsers, loadMoreSuggestedUsers, refetchFeed, classes }: {
  availableUsers: UsersMinimumInfo[],
  loadingSuggestedUsers: boolean,
  setAvailableUsers: (updatedUsers: UsersMinimumInfo[]) => void,
  loadMoreSuggestedUsers: () => void,
  refetchFeed: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading } = Components;

  const [hiddenSuggestionIdx, setHiddenSuggestionIdx] = useState<number>();

  const { captureEvent } = useTracking();
  const { flash } = useMessages();

  const displayedSuggestionLimit = 12;

  const { create: createSubscription } = useCreate({
    collectionName: 'Subscriptions',
    fragmentName: 'SubscriptionState',
  });

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

    if (availableUsers.length < displayedSuggestionLimit + 2) {
      void loadMoreSuggestedUsers();
    }

    // This plus the conditional styling on the list items is to allow for a smoother collapse animation
    // General approach taken from https://css-tricks.com/animation-techniques-for-adding-and-removing-items-from-a-stack/#aa-the-collapse-animation
    setHiddenSuggestionIdx(index);
    setTimeout(() => {
      setHiddenSuggestionIdx(undefined);
      setAvailableUsers(availableUsers.filter((suggestedUser) => suggestedUser._id !== user._id));
    }, 700);
    if (!dismiss) {
      void refetchFeed();
    }
  };

  return <div className={classes.root}>
    <div className={classes.titleRow}>
      <div className={classes.titleAndManageLink}>
        <div className={classes.sectionTitle}>
          Suggested Users for You
        </div>
        <FollowUserSearchButton onUserSelected={subscribeToUser} classes={classes} />
        <Link to="/manageSubscriptions" className={classes.manageSubscriptionsLink}>
          {preferredHeadingCase("Manage")}
          <span className={classes.hideOnSmallScreens}>{preferredHeadingCase(" Subscriptions")}</span>
        </Link>
      </div>
    </div>
    {loadingSuggestedUsers && <Loading />}
    {!loadingSuggestedUsers && <div className={classes.userSubscribeCards}>
      {availableUsers.slice(0, displayedSuggestionLimit).map((user, idx) => <SubscriptionButton 
        user={user} 
        key={user._id}
        hidden={idx === hiddenSuggestionIdx}
        handleSubscribeOrDismiss={(user, dismiss) => subscribeToUser(user, idx, dismiss)}
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
