import React, { useEffect, useRef, useState } from 'react';
import { useTracking } from "../../lib/analyticsEvents";
import { useMessages } from '../common/withMessages';
import { UserDisplayNameInfo, userGetDisplayName } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { preferredHeadingCase } from '../../themes/forumTheme';
import type { Placement as PopperPlacementType } from "popper.js"
import { useCurrentUser } from '../common/withUser';
import { Paper }from '@/components/widgets/Paper';
import { userHasSubscribeTabFeed } from '@/lib/betas';
import shuffle from 'lodash/shuffle';
import LWPopper from "../common/LWPopper";
import FollowUserSearch from "./FollowUserSearch";
import LWClickAwayListener from "../common/LWClickAwayListener";
import ForumIcon from "../common/ForumIcon";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/generated/gql-codegen";
import UltraFeedSuggestedUserCard from "../ultraFeed/UltraFeedSuggestedUserCard";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useIsMobile } from '../hooks/useScreenWidth';

const INITIAL_USERS_TO_SHOW_DESKTOP = 4;
const INITIAL_USERS_TO_SHOW_MOBILE = 2;

const styles = defineStyles("SuggestedFeedSubscriptions", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    paddingTop: 16,
    paddingBottom: 16,
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
    fontSize: "1.8rem",
    flexGrow: 1,
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
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 4,
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: "1fr",
      gap: 8,
      justifyItems: "center",
    },
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
  bottomButtonsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  manageButton: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    display: "inline-block",
    minHeight: 20,
  },
  refreshButton: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    display: "inline-block",
    minHeight: 20,
  }
}));

function useSuggestedUsers(skipFetch = false) {
  const currentUser = useCurrentUser();
  const [availableUsers, setAvailableUsers] = useState<UsersMinimumInfo[]>([]);

  const initialLimit = 64;

  const { data: suggestedUsersData, loading } = useQuery(gql(`
    query SuggestedFeedSubscriptionUsers($limit: Int) {
      SuggestedFeedSubscriptionUsers(limit: $limit) {
        results {
          ...UsersMinimumInfo
        }
      }
    }
  `), {
    variables: { limit: initialLimit },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-only",
    ssr: false,
    skip: skipFetch || !currentUser || !userHasSubscribeTabFeed(currentUser),
  });

  const results = suggestedUsersData?.SuggestedFeedSubscriptionUsers?.results;

  useEffect(() => {
    setAvailableUsers(shuffle(results ?? []));
  }, [results]);

  return { availableUsers, setAvailableUsers, loadingSuggestedUsers: loading };
}




const FollowUserSearchButton = ({onUserSelected, tooltipPlacement = "bottom-end"}: {
  onUserSelected: (user: UsersMinimumInfo ) => void,
  tooltipPlacement?: PopperPlacementType,
}) => {
  const classes = useStyles(styles);
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


export const SuggestedFeedSubscriptions = ({ suggestedUsers, settingsButton }: {
  suggestedUsers?: UsersMinimumInfo[],
  settingsButton?: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const isMobile = useIsMobile();
  const usersToShow = isMobile ? INITIAL_USERS_TO_SHOW_MOBILE : INITIAL_USERS_TO_SHOW_DESKTOP;
  
  // For UltraFeed integration, we always use provided user (from the resolver), for standalone usage, we fetch them
  const { availableUsers: fetchedUsers, loadingSuggestedUsers } = useSuggestedUsers(!!suggestedUsers);
  
  const [localAvailableUsers, setLocalAvailableUsers] = useState<UsersMinimumInfo[]>([]);
  
  useEffect(() => {
    if (suggestedUsers) {
      setLocalAvailableUsers(shuffle(suggestedUsers));
    } else if (fetchedUsers) {
      setLocalAvailableUsers(fetchedUsers);
    }
  }, [suggestedUsers, fetchedUsers]);
  
  const availableUsers = localAvailableUsers;
  const setAvailableUsers = setLocalAvailableUsers;
  
  const [shownUserIds, setShownUserIds] = useState<Set<string>>(new Set());
  const [currentBatch, setCurrentBatch] = useState<UsersMinimumInfo[]>([]);

  const { captureEvent } = useTracking();

  // Initialize current batch when available users first load
  useEffect(() => {
    if (availableUsers.length > 0 && currentBatch.length === 0) {
      const batch = availableUsers.slice(0, usersToShow);
      setCurrentBatch(batch);
      setShownUserIds(new Set(batch.map(u => u._id)));
    }
  }, [availableUsers, currentBatch.length, usersToShow]);

  const refreshSuggestions = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const unshownUsers = availableUsers.filter(u => !shownUserIds.has(u._id));
    
    if (unshownUsers.length >= usersToShow) {
      const batch = unshownUsers.slice(0, usersToShow);
      setCurrentBatch(batch);
      setShownUserIds(prev => new Set([...prev, ...batch.map(u => u._id)]));
    } else {
      const shuffled = shuffle([...availableUsers]);
      const batch = shuffled.slice(0, usersToShow);
      setCurrentBatch(batch);
      setShownUserIds(new Set(batch.map(u => u._id)));
    }
    
    captureEvent("refreshedUltraFeedSuggestedUsers");
  };

  const subscribeToUser = (user: HasIdType & UserDisplayNameInfo) => {
    setAvailableUsers(availableUsers.filter((suggestedUser) => suggestedUser._id !== user._id));
  };

  const showLoadingState = loadingSuggestedUsers && !availableUsers.length && !suggestedUsers;
  
  return <div className={classes.root}>
    <div className={classes.titleRow}>
      <div className={classes.titleAndManageLink}>
        <div className={classes.sectionTitle}>
          Suggested Users for You
        </div>
        <FollowUserSearchButton onUserSelected={subscribeToUser} />
        {settingsButton}
      </div>
    </div>
    {showLoadingState && <Loading />}
    {!showLoadingState && (<>
      <div className={classes.userSubscribeCards}>
        {currentBatch.map((user) => (
          <UltraFeedSuggestedUserCard
            key={user._id}
            user={user}
            onFollowToggle={() => subscribeToUser(user)}
          />
        ))}
      </div>
      <div className={classes.bottomButtonsContainer}>
        <Link to="/manageSubscriptions" className={classes.manageButton}>
          Manage Subscriptions
        </Link>
        {availableUsers.length > usersToShow && (
          <a className={classes.refreshButton} onClick={refreshSuggestions}>
            Refresh
          </a>
        )}
      </div>
    </>)}
  </div>;
}

export default SuggestedFeedSubscriptions;


