import { Components, registerComponent } from '../../../../lib/vulcan-lib';
import React, { useState } from 'react';
import { Link } from '../../../../lib/reactRouterWrapper';
import { DEFAULT_LOW_KARMA_THRESHOLD } from '../../../../lib/collections/posts/views'
import DescriptionIcon from '@material-ui/icons/Description'
import classNames from 'classnames';
import {AnalyticsContext} from "../../../../lib/analyticsEvents";
import { hasEventsSetting } from '../../../../lib/instanceSettings';
import { SORT_ORDER_OPTIONS } from '../../../../lib/collections/posts/schema';


const styles = (theme: ThemeType): JssStyles => ({
  section: {
    background: theme.palette.grey[0],
    padding: '24px 32px',
    marginBottom: 24
  },
  tabsRow: {
    display: 'flex',
    // justifyContent: 'space-between',
    columnGap: 20,
    marginBottom: 24
  },
  tab: {
    display: 'inline-block',
    fontSize: 22,
    lineHeight: '32px',
    fontWeight: '700',
    paddingBottom: 3,
    borderBottom: `3px solid transparent`,
    cursor: 'pointer'
  },
  activeTab: {
    borderBottom: `3px solid ${theme.palette.primary.main}`,
  },
  tabRowAction: {
    flex: '1 1 0',
    textAlign: 'right'
  },
  helpFieldHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 26,
    marginBottom: 8
  },

})

const EAUsersProfilePostsSection = ({user, currentUser, query, classes}: {
  user: UsersProfile,
  currentUser: UsersCurrent|null,
  query: Record<string, string>,
  classes: ClassesType,
}) => {
  const [showSettings, setShowSettings] = useState(false)

  const { LocalGroupsList, ProfileShortform, PostsListSettings, PostsList2, SettingsButton, EAUsersProfileTabbedSection } = Components
  
  const draftTerms: PostsViewTerms = {view: "drafts", userId: user._id, limit: 4, sortDrafts: currentUser?.sortDrafts || "modifiedAt" }
  const unlistedTerms: PostsViewTerms = {view: "unlisted", userId: user._id, limit: 20}
  const terms: PostsViewTerms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null};

  // maintain backward compatibility with bookmarks
  const currentSorting = query.sortedBy || query.view ||  "new"
  const currentFilter = query.filter ||  "all"
  const ownPage = currentUser?._id === user._id
  const currentShowLowKarma = (parseInt(query.karmaThreshold) !== DEFAULT_LOW_KARMA_THRESHOLD)
  const currentIncludeEvents = (query.includeEvents === 'true')
  terms.excludeEvents = !currentIncludeEvents && currentFilter !== 'events'
  
  if (!user.postCount) return null
  
  const tabs = [
    {
      name: 'Posts',
      body: <>
        <SettingsButton
          onClick={() => setShowSettings(!showSettings)}
          label={`Sorted by ${ SORT_ORDER_OPTIONS[currentSorting].label }`}
        />
        {showSettings && <PostsListSettings
          hidden={false}
          currentSorting={currentSorting}
          currentFilter={currentFilter}
          currentShowLowKarma={currentShowLowKarma}
          currentIncludeEvents={currentIncludeEvents}
        />}
        <AnalyticsContext listContext="userPagePosts">
          {user.shortformFeedId && <ProfileShortform user={user}/>}
          <PostsList2 terms={terms} hideAuthor />
        </AnalyticsContext>
      </>
    },
    {
      name: 'My Drafts',
      ownPageOnly: true,
      body: <>
        <AnalyticsContext listContext="userPageDrafts">
          <PostsList2 hideAuthor showDraftTag={false} terms={draftTerms}/>
          <PostsList2 hideAuthor showDraftTag={false} terms={unlistedTerms} showNoResults={false} showLoading={false} showLoadMore={false}/>
        </AnalyticsContext>
        {hasEventsSetting.get() && <LocalGroupsList
          terms={{view: 'userInactiveGroups', userId: currentUser?._id}}
          showNoResults={false}
        />}
      </>
    }
  ]

  return (
    <EAUsersProfileTabbedSection
      user={user}
      currentUser={currentUser}
      tabs={tabs}
    />
  )
}

const EAUsersProfilePostsSectionComponent = registerComponent(
  'EAUsersProfilePostsSection', EAUsersProfilePostsSection, {styles}
);

declare global {
  interface ComponentTypes {
    EAUsersProfilePostsSection: typeof EAUsersProfilePostsSectionComponent
  }
}
