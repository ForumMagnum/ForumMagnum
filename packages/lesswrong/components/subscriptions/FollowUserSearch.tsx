import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { InstantSearch } from '../../lib/utils/componentsWithChildren';
import { SearchBox, Hits, Configure } from 'react-instantsearch-dom';
import { getSearchIndexName, getSearchClient, isSearchEnabled } from '../../lib/search/searchUtil';
import type { SearchState } from 'react-instantsearch-core';
import { isLeftClick } from '../search/UsersSearchHit';
import { SearchHitComponentProps } from '../search/types';
import { useNotifyMe } from '../hooks/useNotifyMe';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import MetaInfo from "../common/MetaInfo";
import FormatDate from "../common/FormatDate";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SubscriptionStateMultiQuery = gql(`
  query multiSubscriptionFollowUserSearchQuery($selector: SubscriptionSelector, $limit: Int, $enableTotal: Boolean) {
    subscriptions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SubscriptionState
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    "& .ais-SearchBox": {
      padding: 8,
    },
    '& .ais-SearchBox-input': {
      background: "transparent",
    },
    '& .ais-SearchBox-submit': {
      position: "absolute",
      right: 11
    },
    '& .ais-SearchBox-submitIcon path': {
      display: "none"
    },
    width: 240
  },
  followUserSearchHit: {
    padding: 10,
    paddingTop: 2,
    paddingBottom: 2,
    display: 'flex',
    alignItems: 'center'
  },
  followUserSearchHitAlreadySubscribed: {
    fontStyle: 'italic',
  },
  followUserSearchHitDisplayName: {
    maxWidth: 200,
    overflow: 'hidden',
    ['@media (max-width: 500px)']: {
      maxWidth: 100,
    }
  }
});

const FollowUserSearchHit = ({hit, clickAction, existingSubscriptionIds, classes }: SearchHitComponentProps & {existingSubscriptionIds?: string[]}) => {
  const user = hit as SearchUser
  
  const isSubscribed = existingSubscriptionIds?.includes(user._id);

  return <div 
    onClick={(event: React.MouseEvent) => !isSubscribed && isLeftClick(event) && clickAction && clickAction()}
    className={classNames(classes.followUserSearchHit, {[classes.followUserSearchHitAlreadySubscribed]: isSubscribed})}
  >
    <MetaInfo className={classes.followUserSearchHitDisplayName}>
      {user.displayName}
    </MetaInfo>
    {isSubscribed
      ?  <MetaInfo>
        (already subscribed)
      </MetaInfo>
      : <>
        <MetaInfo>
          <FormatDate date={user.createdAt} />
        </MetaInfo>
        <MetaInfo>
          {user.karma ?? 0} karma
        </MetaInfo>
      </>}
  </div>
}

// Modeled off and modified from AddTag.tsx
const FollowUserSearch = ({onUserSelected, currentUser, classes}: {
  onUserSelected: (user: UsersMinimumInfo ) => void,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchStateChanged = React.useCallback((searchState: SearchState) => {
    setSearchOpen((searchState.query?.length ?? 0) > 0);
  }, []);

  //get all existing subscriptions
  const { data } = useQuery(SubscriptionStateMultiQuery, {
    variables: {
      selector: { subscriptionsOfType: { userId: currentUser?._id, collectionName: "Users", subscriptionType: "newActivityForFeed" } },
      limit: 1000,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.subscriptions?.results;

  const existingSubscriptionIds = results?.map(sub => sub.documentId).filter(id => id !== null) ?? [];
  

  // When this appears, yield to the event loop once, use getElementsByTagName
  // to find the search input text box, then focus it.
  //
  // Why this hideously complicated thing, rather than just set autoFocus={true}
  // on the <SearchBox> component? Unfortunately this component gets used inside
  // Material-UI Poppers, and Poppers have an unfortunate property: they first
  // render off-screen, then measure the size of their contents, then move
  // themselves to their correct position. This means that during first-render,
  // this component is positioned in an off-screen temporary location, and if
  // you focus the input box then, it will scroll the page to the bottom. In
  // order to avoid this, we have to defer focusing until Popper is finished,
  // ie setTimeout(..., 0). Unfortunately again, react-instantsearch's SearchBox
  // component doesn't expose an API for controlling focus other than at mount
  // time, so in order to find the text box we want focused, we have to search
  // the DOM for it.
  const containerRef = React.useRef<any>(null);
  React.useEffect(() => {
    if (containerRef.current) {
      const input = containerRef.current.getElementsByTagName("input")[0];
      setTimeout(() => {
        input.focus();
      }, 0);
    }
  }, []);

  if (!isSearchEnabled()) {
    return null;
  }

  const handleSelectUser = (hit: AnyBecauseTodo) => {
    // check that hit has HasIdType & UserDisplayNameInfo
    if (hit._id && hit.displayName) {
      onUserSelected(hit);
    }
  }

  return <div className={classes.root} ref={containerRef}>
    <InstantSearch
      indexName={getSearchIndexName("Users")}
      searchClient={getSearchClient()}
      onSearchStateChange={searchStateChanged}
    >
      {/* Ignored because SearchBox is incorrectly annotated as not taking null for its reset prop, when
        * null is the only option that actually suppresses the extra X button.
       // @ts-ignore */}
      <SearchBox reset={null} focusShortcuts={[]}/>
      <Configure
        hitsPerPage={searchOpen ? 12 : 6}
      />
      <Hits hitComponent={({hit}) =>
        <FollowUserSearchHit
          hit={hit}
          clickAction={() => handleSelectUser(hit)}
          existingSubscriptionIds={existingSubscriptionIds}
          classes={classes}
        />
      }/>
    </InstantSearch>
  </div>
}

export default registerComponent("FollowUserSearch", FollowUserSearch, {styles});


