import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useMulti } from '../../../lib/crud/withMulti';
import { useCurrentUser } from '../../common/withUser';
import { useLocation } from '../../../lib/routeUtil';
import { Link } from '../../../lib/reactRouterWrapper';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { userCanEditUser, userGetDisplayName, userGetProfileUrlFromSlug } from "../../../lib/collections/users/helpers";
import { taglineSetting } from '../../common/HeadTags';
import { getBrowserLocalStorage } from '../../editor/localStorageHandlers';
import { siteNameWithArticleSetting, taggingNameIsSet, taggingNameCapitalSetting } from '../../../lib/instanceSettings';
import { DEFAULT_LOW_KARMA_THRESHOLD } from '../../../lib/collections/posts/views'
import { SORT_ORDER_OPTIONS } from '../../../lib/collections/posts/dropdownOptions';
import { PROGRAM_PARTICIPATION } from '../../../lib/collections/users/schema';
import { eaUsersProfileSectionStyles, UserProfileTabType } from './modules/EAUsersProfileTabbedSection';
import { getUserFromResults } from '../../users/UsersProfile';
import InfoIcon from '@material-ui/icons/Info'
import DescriptionIcon from '@material-ui/icons/Description'
import LibraryAddIcon from '@material-ui/icons/LibraryAdd'
import Button from '@material-ui/core/Button';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import classNames from 'classnames';
import { getUserStructuredData } from '../../users/UsersSingle';

const styles = (theme: ThemeType): JssStyles => ({
  section: {
    ...eaUsersProfileSectionStyles(theme)
  },
  mainSection: {
    [theme.breakpoints.down('sm')]: {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
  },
  sunshineSection: {
    marginBottom: 24
  },
  sectionHeadingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  sectionHeading: {
    display: 'inline-flex',
    columnGap: 10,
    fontSize: 20,
    lineHeight: '30px',
    fontWeight: '600',
    paddingBottom: 3,
    borderBottom: `3px solid ${theme.palette.primary.main}`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    [theme.breakpoints.down('xs')]: {
      columnGap: 8,
      fontSize: 18,
      lineHeight: '28px',
    }
  },
  sectionHeadingCount: {
    fontWeight: '450',
    color: theme.palette.grey[600],
    fontSize: 13,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    }
  },
  sectionSubHeadingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 8
  },
  sectionSubHeading: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  inactiveGroup: {
    color: theme.palette.grey[500],
    marginRight: 6,
  },
  showSectionBtn: {
    marginBottom: 24,
  },
  editProfile: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingTop: "inherit",
    paddingRight: "inherit",
  },
  editProfileButtonWrapper: {
  },
  editProfileButton: {
    textTransform: "none",
    fontSize: 14,
    fontWeight: 500,
    background: theme.palette.grey[200],
    height: 40,
    "&:hover": {
      opacity: 1,
      background: theme.palette.grey[300],
    },
    "& .MuiButton-label": {
      maxHeight: "100%",
    },
  },
  username: {
    fontSize: 32,
    lineHeight: '42px',
    marginBottom: 8,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
  },
  deletedUsername: {
    textDecoration: 'line-through'
  },
  accountDeletedText: {
    display: 'inline-block',
    fontSize: 16,
    lineHeight: '22px',
    fontFamily: theme.typography.fontFamily,
    fontWeight: '500',
    marginLeft: 10
  },
  roleAndOrg: {
    fontSize: 16,
  },
  btns: {
    display: 'flex',
    columnGap: 20,
    marginTop: 20,
  },
  messageBtn: {
    display: 'block',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.grey[0],
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.normal,
    borderColor: theme.palette.primary.main,
    borderRadius: 4,
    padding: '8px 16px',
  },
  subscribeBtn: {
    backgroundColor: theme.palette.grey[0],
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.normal,
    borderColor: theme.palette.primary.main,
    borderRadius: 4,
    padding: '8px 16px',
  },
  privateSectionIcon: {
    fontSize: 20,
    color: theme.palette.grey[500],
  },
  privateActionsRow: {
    display: 'flex',
    columnGap: 26,
    alignItems: 'baseline',
    marginBottom: 20
  },
})

const EAUsersProfile = ({terms, slug, classes}: {
  terms: UsersViewTerms,
  slug: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const {loading, results} = useMulti({
    terms,
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    enableTotal: false,
    fetchPolicy: 'cache-and-network'
  });
  const user = getUserFromResults(results)

  const { query } = useLocation()
  // track profile views in local storage
  useEffect(() => {
    const ls = getBrowserLocalStorage()
    if (currentUser && user && currentUser._id !== user._id && ls) {
      let from = query.from
      let profiles: any[] = JSON.parse(ls.getItem('lastViewedProfiles')) || []
      // if the profile user is already in the list, then remove them before re-adding them at the end
      const profileUserIndex = profiles?.findIndex(profile => profile.userId === user._id)
      if (profiles && profileUserIndex !== -1) {
        // remember where we originally saw this profile, if necessary
        from = from || profiles[profileUserIndex].from
        profiles.splice(profileUserIndex, 1)
      }

      profiles.push({userId: user._id, ...(from && {from})})
      // we only bother to save the last 10 profiles
      if (profiles.length > 10) profiles.shift()
      // save it in local storage
      ls.setItem('lastViewedProfiles', JSON.stringify(profiles))
    }
  }, [currentUser, user, query.from])

  // although both the owner and admins can see the drafts section,
  // admins need to click a button to view it (so it's not distracting)
  const [draftsSectionExpanded, setDraftsSectionExpanded] = useState(!user || (currentUser && user._id === currentUser._id))
  useEffect(() => {
    if (user) {
      setDraftsSectionExpanded(currentUser && user._id === currentUser._id)
    }
  }, [currentUser, user])

  // show/hide the "Posts" section sort/filter settings
  const [showPostSettings, setShowPostSettings] = useState(false)

  const { results: userOrganizesGroups, loadMoreProps: userOrganizesGroupsLoadMoreProps } = useMulti({
    terms: {view: 'userOrganizesGroups', userId: user?._id, limit: 300},
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    enableTotal: false,
    skip: !user
  })

  // count posts here rather than using user.postCount,
  // because the latter doesn't include posts where the user is a coauthor
  const { totalCount: userPostsCount } = useMulti({
    terms: {
      view: 'userPosts',
      userId: user?._id,
      authorIsUnreviewed: currentUser?.isAdmin ? null : false,
      limit: 0
    },
    collectionName: "Posts",
    fragmentName: 'PostsMinimumInfo',
    enableTotal: true,
    skip: !user
  })

  const { SunshineNewUsersProfileInfo, SingleColumnSection, LWTooltip,
    SortButton, NewConversationButton, TagEditsByUser, NotifyMeButton, LoadMore,
    PostsList2, ContentItemBody, Loading, Error404, PermanentRedirect, HeadTags,
    Typography, ContentStyles, EAUsersProfileTabbedSection, PostsListSettings,
    RecentComments, SectionButton, SequencesGridWrapper, ReportUserButton, DraftsList,
    ProfileShortform, EAUsersProfileImage, EAUsersMetaInfo, EAUsersProfileLinks,
  } = Components

  if (loading) {
    return <Loading/>
  }

  if (!user || !user._id || (user.deleted && !currentUser?.isAdmin)) {
    //eslint-disable-next-line no-console
    console.error(`// missing user (_id/slug: ${slug})`);
    return <Error404/>
  }

  if (user.oldSlugs?.includes(slug) && !user.deleted) {
    return <PermanentRedirect url={userGetProfileUrlFromSlug(user.slug)} />
  }

  // Does this profile page belong to a likely-spam account?
  if (user.spamRiskScore < 0.4) {
    if (currentUser?._id === user._id) {
      // Logged-in spammer can see their own profile
    } else if (currentUser && userCanDo(currentUser, 'posts.moderate.all')) {
      // Admins and sunshines can see spammer's profile
    } else {
      // Anyone else gets a 404 here
      // eslint-disable-next-line no-console
      console.log(`Not rendering profile page for account with poor spam risk score: ${user.displayName}`);
      return <Components.Error404/>
    }
  }

  const scheduledPostsTerms: PostsViewTerms = {view: "scheduled", userId: user._id, limit: 20}
  const unlistedTerms: PostsViewTerms = {view: "unlisted", userId: user._id, limit: 20}
  const postTerms: PostsViewTerms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null}

  // posts list sort settings
  const currentSorting = (query.sortedBy || query.view ||  "new") as PostSortingMode
  const currentFilter = query.filter ||  "all"
  const ownPage = currentUser?._id === user._id
  const currentShowLowKarma = (parseInt(query.karmaThreshold) !== DEFAULT_LOW_KARMA_THRESHOLD)
  const currentIncludeEvents = (query.includeEvents === 'true')
  const currentHideCommunity = (query.hideCommunity === 'true')
  postTerms.excludeEvents = !currentIncludeEvents && currentFilter !== 'events'
  postTerms.hideCommunity = currentHideCommunity

  const username = userGetDisplayName(user)
  const metaDescription = `${username}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`
  const userKarma = user.karma || 0

  const privateSectionTabs: Array<UserProfileTabType> = [{
    id: 'drafts',
    label: `${ownPage ? 'My' : `${username}'s`} Drafts`,
    secondaryNode: <LWTooltip title="This section is only visible to you and site admins.">
      <InfoIcon className={classes.privateSectionIcon} />
    </LWTooltip>,
    body: <>
      <div className={classes.sectionSubHeadingRow}>
        <Typography variant="headline" className={classes.sectionSubHeading}>Posts</Typography>
        {ownPage && <Link to="/newPost">
          <SectionButton>
            <DescriptionIcon /> New post
          </SectionButton>
        </Link>}
      </div>
      <AnalyticsContext listContext="userPageDrafts">
        <DraftsList userId={user._id} limit={5} hideHeaderRow />
        <PostsList2 hideAuthor showDraftTag={false} terms={scheduledPostsTerms} showNoResults={false} showLoading={false} showLoadMore={false} boxShadow={false} />
        <PostsList2 hideAuthor showDraftTag={false} terms={unlistedTerms} showNoResults={false} showLoading={false} showLoadMore={false} boxShadow={false} />
      </AnalyticsContext>
      <div className={classes.sectionSubHeadingRow}>
        <Typography variant="headline" className={classes.sectionSubHeading}>Sequences</Typography>
        {ownPage && <Link to="/sequencesnew">
          <SectionButton>
            <LibraryAddIcon /> New sequence
          </SectionButton>
        </Link>}
      </div>
      <SequencesGridWrapper terms={{view: "userProfilePrivate", userId: user._id, limit: 9}} showLoadMore={true} />
    </>
  }]
  if (userOrganizesGroups?.length) {
    privateSectionTabs.push({
      id: 'localgroups',
      label: 'Organizer of',
      count: userOrganizesGroups.length,
      secondaryNode: <LWTooltip title="This section is only visible to you and site admins.">
        <InfoIcon className={classes.privateSectionIcon} />
      </LWTooltip>,
      body: <>
        <ContentStyles contentType="post">
          {userOrganizesGroups.map(group => {
            return <div key={group._id}>
              {group.inactive && <span className={classes.inactiveGroup}>[Inactive]</span>}
              <Link to={`/groups/${group._id}`}>
                {group.name}
              </Link>
            </div>
          })}
        </ContentStyles>
        <LoadMore {...userOrganizesGroupsLoadMoreProps} />
      </>
    })
  }

  const bioSectionTabs: Array<UserProfileTabType> = []
  if (user.biography?.html || user.howOthersCanHelpMe?.html || user.howICanHelpOthers?.html) {
    bioSectionTabs.push({
      id: 'bio',
      label: 'Bio',
      body: <>
        {user.biography?.html && <ContentStyles contentType="post">
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: user.biography.html }}
            description={`user ${user._id} bio`}
            nofollow={userKarma < nofollowKarmaThreshold.get()}
          />
        </ContentStyles>}
        {user.howOthersCanHelpMe?.html && <>
          <div className={classes.sectionSubHeadingRow}>
            <Typography variant="headline" className={classes.sectionSubHeading}>How others can help me</Typography>
          </div>
          <ContentStyles contentType="post">
            <ContentItemBody dangerouslySetInnerHTML={{__html: user.howOthersCanHelpMe.html }} nofollow={userKarma < nofollowKarmaThreshold.get()}/>
          </ContentStyles>
        </>}
        {user.howICanHelpOthers?.html && <>
          <div className={classes.sectionSubHeadingRow}>
            <Typography variant="headline" className={classes.sectionSubHeading}>How I can help others</Typography>
          </div>
          <ContentStyles contentType="post">
            <ContentItemBody dangerouslySetInnerHTML={{__html: user.howICanHelpOthers.html }} nofollow={userKarma < nofollowKarmaThreshold.get()}/>
          </ContentStyles>
        </>}
      </>,
      collapsable: true
    })
  }
  if (user.organizerOfGroupIds || user.programParticipation) {
    bioSectionTabs.push({
      id: 'participation',
      label: 'Participation',
      count: (user.organizerOfGroupIds?.length || 0) + (user.programParticipation?.length || 0),
      body: <>
        <ContentStyles contentType="post">
          <ul>
            {user.organizerOfGroups?.map(group => {
              return <li key={group._id}>
                Organizer of <Link to={`/groups/${group._id}`}>
                  {group.name}
                </Link>
              </li>
            })}
            {user.programParticipation?.map(participation => {
              const label = PROGRAM_PARTICIPATION.find(program => program.value === participation)?.label
              if (!label) return null
              return <li key={participation}>
                {label}
              </li>
            })}
          </ul>
        </ContentStyles>
      </>
    })
  }

  const commentsSectionTabs: Array<UserProfileTabType> = []
  if (user.commentCount) {
    commentsSectionTabs.push({
      id: 'comments',
      label: 'Comments',
      count: user.commentCount,
      body: <AnalyticsContext pageSectionContext="commentsSection">
        <RecentComments
          terms={{view: 'profileRecentComments', authorIsUnreviewed: null, limit: 10, userId: user._id}}
          showPinnedOnProfile
        />
      </AnalyticsContext>
    })
  }
  if (user.tagRevisionCount) {
    commentsSectionTabs.push({
      id: 'tagRevisions',
      label: `${taggingNameIsSet.get() ? taggingNameCapitalSetting.get() : 'Wiki'} Contributions`,
      count: user.tagRevisionCount,
      body: <AnalyticsContext listContext="userPageWiki">
        <TagEditsByUser userId={user._id} limit={10} />
      </AnalyticsContext>
    })
  }

  return <div>
    <HeadTags
      description={metaDescription}
      noIndex={(!userPostsCount && !user.commentCount) || user.karma <= 0 || user.noindex}
      image={user.profileImageId && `https://res.cloudinary.com/cea/image/upload/c_crop,g_custom,q_auto,f_auto/${user.profileImageId}.jpg`}
      structuredData={getUserStructuredData(user)}
      useSmallImage
    />
    <AnalyticsContext pageContext="userPage">
      <SingleColumnSection>
        <div className={classNames(classes.section, classes.mainSection)}>
          {userCanEditUser(currentUser, user) &&
            <div className={classes.editProfile}>
              <Button
                type="submit"
                href={`/profile/${user.slug}/edit`}
                className={classes.editProfileButton}
              >
                Edit profile
              </Button>
            </div>
          }
          <EAUsersProfileImage user={user} />
          <Typography variant="headline" className={classNames(classes.username, {[classes.deletedUsername]: user.deleted})}>
            {username}{user.deleted && <span className={classes.accountDeletedText}>(account deleted)</span>}
          </Typography>
          {(user.jobTitle || user.organization) && <ContentStyles contentType="comment" className={classes.roleAndOrg}>
            {user.jobTitle} {user.organization ? `@ ${user.organization}` : ''}
          </ContentStyles>}
          <EAUsersMetaInfo user={user} />
          {currentUser?._id != user._id && <div className={classes.btns}>
            <NewConversationButton
              user={user}
              currentUser={currentUser}
            >
              <a tabIndex={0} className={classes.messageBtn} data-cy="message">
                Message
              </a>
            </NewConversationButton>
            <NotifyMeButton
              document={user}
              className={classes.subscribeBtn}
              subscribeMessage="Subscribe to posts"
              unsubscribeMessage="Unsubscribe"
              asButton
            />
          </div>}
          <EAUsersProfileLinks user={user} />
        </div>

        {userCanDo(currentUser, 'posts.moderate.all') && <div className={classes.sunshineSection}>
          <SunshineNewUsersProfileInfo userId={user._id} />
        </div>}

        {(ownPage || currentUser?.isAdmin) && (draftsSectionExpanded ?
          <EAUsersProfileTabbedSection tabs={privateSectionTabs} /> :
          <Button color="primary"
            onClick={() => setDraftsSectionExpanded(true)}
            className={classes.showSectionBtn}
          >
            Click to view drafts
          </Button>
        )}

        <EAUsersProfileTabbedSection tabs={bioSectionTabs} />

        {!!(userPostsCount || user.postCount) && <div className={classes.section}>
          <div className={classes.sectionHeadingRow}>
            <Typography variant="headline" className={classes.sectionHeading}>
              Posts <div className={classes.sectionHeadingCount}>{(userPostsCount || user.postCount)}</div>
            </Typography>
            <SortButton onClick={() => setShowPostSettings(!showPostSettings)}
              label={`Sorted by ${ SORT_ORDER_OPTIONS[currentSorting].label }`} />
          </div>
          {showPostSettings && <PostsListSettings
            hidden={false}
            currentSorting={currentSorting}
            currentFilter={currentFilter}
            currentShowLowKarma={currentShowLowKarma}
            currentIncludeEvents={currentIncludeEvents}
            currentHideCommunity={currentHideCommunity}
          />}
          <AnalyticsContext listContext="userPagePosts">
            <ProfileShortform user={user} />
            <PostsList2 terms={postTerms} boxShadow={false} hideAuthor hideShortform />
          </AnalyticsContext>
        </div>}

        {!!user.sequenceCount && <div className={classes.section}>
          <div className={classes.sectionHeadingRow}>
            <Typography variant="headline" className={classes.sectionHeading}>
              Sequences <div className={classes.sectionHeadingCount}>{user.sequenceCount}</div>
            </Typography>
          </div>
          <SequencesGridWrapper terms={{view: "userProfile", userId: user._id, limit: 9}} showLoadMore={true} />
        </div>}

        <EAUsersProfileTabbedSection tabs={commentsSectionTabs} />
      </SingleColumnSection>

      <ReportUserButton user={user}/>
    </AnalyticsContext>
  </div>
}

const EAUsersProfileComponent = registerComponent(
  'EAUsersProfile', EAUsersProfile, {styles}
);

declare global {
  interface ComponentTypes {
    EAUsersProfile: typeof EAUsersProfileComponent
  }
}
