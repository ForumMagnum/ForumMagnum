import React, { useEffect, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTracking } from "../../lib/analyticsEvents";
import { useMessages } from '../common/withMessages';
import { useCreate } from '../../lib/crud/withCreate';
import { UserDisplayNameInfo, userGetDisplayName } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { preferredHeadingCase } from '../../themes/forumTheme';
import classNames from 'classnames';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import type { Placement as PopperPlacementType } from "popper.js"
import { useCurrentUser } from '../common/withUser';
import { Paper }from '@/components/widgets/Paper';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import { userHasSubscribeTabFeed } from '@/lib/betas';
import shuffle from 'lodash/shuffle';
import { UsersName } from "../users/UsersName";
import { UserMetaInfo } from "../users/UserMetaInfo";
import { LWPopper } from "../common/LWPopper";
import { FollowUserSearch } from "./FollowUserSearch";
import { LWClickAwayListener } from "../common/LWClickAwayListener";
import { ForumIcon } from "../common/ForumIcon";
import { Loading } from "../vulcan-core/Loading";

const CARD_CONTAINER_HEIGHT = 180;
const DISMISS_BUTTON_WIDTH = 16;

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginTop: 6,
    background: theme.palette.panelBackground.recentDiscussionThread,
    borderRadius: 3,
    paddingTop: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
    marginBottom: 6,
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
      opacity: 0.5,
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
    height: CARD_CONTAINER_HEIGHT,
    marginTop: 8,
    transition: "height .5s ease-in-out",
  },
  suggestedUserListItem: {
    transition: "all .5s ease-out",
    listStyle: "none",
    height: 85,
    width: "178.75px",
    ['@media(min-width: 500px) and (max-width: 780px)']: {
      minWidth: 145,
      flexBasis: 145,
      flexGrow: 1,
    },
    ['@media(max-width: 500px)']: {
      minWidth: 98,
      flexBasis: 98,
      flexGrow: 1,
    },
  },
  removedSuggestedUserListItem: {
    opacity: 0,
    minWidth: 0,
    // Needed to override the dynamic width and flexBasis assigned in SuggestedFollowCard
    width: "0 !important",
    flexBasis: "0 !important",
    marginLeft: -6,
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
    width: DISMISS_BUTTON_WIDTH,
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
    // Account for the dismiss button width so that sufficiently long display names don't cause it to overflow
    width: `calc(100% - ${DISMISS_BUTTON_WIDTH}px)`,
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
    height: "1lh",
    display: "flex",
    overflow: "hidden",
  },
  icon: {
    width: 17,
    marginBottom: -3,
    cursor: "pointer",
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    }
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
    marginBottom: -4,
    marginRight: 4,
  },
  hideOnSmallScreens: {
    ['@media(max-width: 500px)']: {
      display: "none",
    }
  },
  showMoreContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "end",
    marginTop: 6,
  },
  showMoreButton: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    display: "inline-block",
    minHeight: 20,
  }
});

function useSuggestedUsers() {
  const currentUser = useCurrentUser();
  const [availableUsers, setAvailableUsers] = useState<UsersMinimumInfo[]>([]);

  const { results, loading, loadMore } = usePaginatedResolver({
    fragmentName: "UsersMinimumInfo",
    resolverName: "SuggestedFeedSubscriptionUsers",
    limit: 64,
    itemsPerPage: 16,
    ssr: false,
    skip: !currentUser || !userHasSubscribeTabFeed(currentUser),
  });

  useEffect(() => {
    setAvailableUsers(shuffle(results ?? []));
  }, [results]);

  return { availableUsers, setAvailableUsers, loadingSuggestedUsers: loading, loadMoreSuggestedUsers: loadMore };
}

const SuggestedFollowCard = ({user, handleSubscribeOrDismiss, hidden, classes}: {
  user: UsersMinimumInfo, 
  handleSubscribeOrDismiss: (user: UsersMinimumInfo, dismiss?: boolean) => void,
  hidden?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const cardRef = useRef<HTMLLIElement>(null);
  const [additionalStyling, setAdditionalStyling] = useState<React.CSSProperties>();

  // The entire container for suggested users is rendered once the tab is selected even if it's hidden
  // So we need to avoid setting the width of each card to 0 if we initially render in that state
  const zeroWidthBecauseHidden = !cardRef.current || cardRef.current.getBoundingClientRect().width === 0;

  // Set the width of each card to whatever width it initially renders as, depending on flexGrow (except for the zero-width condition above).
  // After that, we remove flexGrow to stop cards from expanding/contracting during transitions when users click follow or dismiss.
  useEffect(() => {
    // Here, we need to check against the card's live width, since checking zeroWidthBecauseHidden caused the cards to collapse after hiding the container once
    if (cardRef.current && cardRef.current.getBoundingClientRect().width !== 0) {
      const fixedWidth = cardRef.current.getBoundingClientRect().width;

      setAdditionalStyling({ width: fixedWidth, flexBasis: fixedWidth });

      // Setting flexGrow: 0 after a bit of a delay ensures the previous styling has taken effect,
      // which we need to prevent a weird reflow during the initial render
      setTimeout(() => {
        setAdditionalStyling({ width: fixedWidth, flexBasis: fixedWidth, flexGrow: 0 })
      }, 300);
    }
  }, [zeroWidthBecauseHidden]);

  return (<li ref={cardRef} className={classNames(classes.suggestedUserListItem, { [classes.removedSuggestedUserListItem]: hidden })} style={additionalStyling}>
    <div className={classes.suggestedUser}>
      <div className={classes.buttonUserInfo} >
        <div className={classes.buttonDisplayNameAndDismiss} >
          <div className={classes.buttonDisplayName} >
            <UsersName user={user} className={classes.clampedUserName} hideFollowButton/>
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
      <div 
        className={classNames(classes.subscribeButton, classes.followButton)} 
        onClick={() => handleSubscribeOrDismiss(user)}
      >
        Follow
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
  if (!currentUser) {
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


export const SuggestedFeedSubscriptionsInner = ({ refetchFeed, settingsButton, existingSubscriptions, classes }: {
  refetchFeed: () => void,
  settingsButton: React.ReactNode,
  existingSubscriptions?: SubscriptionState[],
  classes: ClassesType<typeof styles>,
}) => {
  const { availableUsers, setAvailableUsers, loadingSuggestedUsers } = useSuggestedUsers();

  const [hiddenSuggestionIdx, setHiddenSuggestionIdx] = useState<number>();
  const [expansionCount, setExpansionCount] = useState(0);

  const { captureEvent } = useTracking();
  const { flash } = useMessages();

  const renderedSuggestionLimit = (expansionCount + 1) * 16;

  const toggleShowMore = (e: React.MouseEvent) => {
    e.preventDefault();
    if (availableUsers.length <= (renderedSuggestionLimit - 16)) {
      setExpansionCount(0);
    } else {
      setExpansionCount(expansionCount + 1);
    }
  };

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

  const showLoadingState = loadingSuggestedUsers && !availableUsers.length;
  const expansionButtonText = renderedSuggestionLimit < availableUsers.length ? 'Show More' : 'Show Less';
  const cardContainerHeightStyling = expansionCount > 0 ? { height: CARD_CONTAINER_HEIGHT + (expansionCount * 364) } : {};

  return <div className={classes.root}>
    <div className={classes.titleRow}>
      <div className={classes.titleAndManageLink}>
        <div className={classes.sectionTitle}>
          Suggested Users for You
        </div>
        <FollowUserSearchButton onUserSelected={subscribeToUser} classes={classes} />
        <Link to="/manageSubscriptions" className={classes.manageSubscriptionsLink}>
          {preferredHeadingCase("Manage")}
          <span className={classes.hideOnSmallScreens}>{`${preferredHeadingCase(" Subscriptions")} (${existingSubscriptions?.length ?? 0})`}</span>
        </Link>
        {settingsButton}
      </div>
    </div>
    {showLoadingState && <Loading />}
    {!showLoadingState && (<>
      <div className={classNames(classes.userSubscribeCards)} style={cardContainerHeightStyling}>
        {availableUsers.slice(0, renderedSuggestionLimit).map((user, idx) => <SuggestedFollowCard 
          user={user} 
          key={user._id}
          hidden={idx === hiddenSuggestionIdx}
          handleSubscribeOrDismiss={(user, dismiss) => subscribeToUser(user, idx, dismiss)}
          classes={classes}
        />)}
      </div>
      <div className={classes.showMoreContainer}>
        <a className={classes.showMoreButton} onClick={toggleShowMore}>{expansionButtonText}</a>
      </div>
    </>)}
  </div>;
}

export const SuggestedFeedSubscriptions = registerComponent('SuggestedFeedSubscriptions', SuggestedFeedSubscriptionsInner, {styles});


