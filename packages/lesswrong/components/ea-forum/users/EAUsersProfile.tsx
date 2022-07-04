import { combineUrls, Components, registerComponent } from '../../../lib/vulcan-lib';
import { useMulti } from '../../../lib/crud/withMulti';
import React, { useEffect, useState } from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { useLocation } from '../../../lib/routeUtil';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { userCanEdit, userGetDisplayName, userGetProfileUrl, userGetProfileUrlFromSlug } from "../../../lib/collections/users/helpers";
import { userGetEditUrl } from '../../../lib/vulcan-users/helpers';
import { DEFAULT_LOW_KARMA_THRESHOLD } from '../../../lib/collections/posts/views'
import StarIcon from '@material-ui/icons/Star'
import CalendarIcon from '@material-ui/icons/Today'
import LocationIcon from '@material-ui/icons/LocationOn'
import InfoIcon from '@material-ui/icons/Info'
import DescriptionIcon from '@material-ui/icons/Description'
import LibraryAddIcon from '@material-ui/icons/LibraryAdd'
import classNames from 'classnames';
import { useCurrentUser } from '../../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import {AnalyticsContext} from "../../../lib/analyticsEvents";
import { siteNameWithArticleSetting, taggingNameIsSet, taggingNameCapitalSetting } from '../../../lib/instanceSettings';
import { separatorBulletStyles } from '../../common/SectionFooter';
import { taglineSetting } from '../../common/HeadTags';
import { socialMediaIconPaths } from '../../form-components/PrefixedInput';
import { CAREER_STAGES, SOCIAL_MEDIA_PROFILE_FIELDS } from '../../../lib/collections/users/custom_fields';
import { getBrowserLocalStorage } from '../../async/localStorageHandlers';
import { SORT_ORDER_OPTIONS } from '../../../lib/collections/posts/schema';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useMessages } from '../../common/withMessages';


const styles = (theme: ThemeType): JssStyles => ({
  profilePage: {
  },
  
  section: {
    background: theme.palette.grey[0],
    padding: '24px 32px',
    marginBottom: 24,
    [theme.breakpoints.down('xs')]: {
      padding: 16,
    }
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
    fontWeight: '700',
    paddingBottom: 3,
    borderBottom: `3px solid ${theme.palette.primary.main}`,
    [theme.breakpoints.down('xs')]: {
      columnGap: 8,
      fontSize: 18,
      lineHeight: '28px',
    }
  },
  sectionHeadingCount: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.palette.grey[600],
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
    fontWeight: '700',
  },
  inactiveGroup: {
    // fontSize: 12,
    color: theme.palette.grey[500],
    marginRight: 6,
  },
  
  profileImage: {
    'box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    '-webkit-box-shadow': '0px 0px 2px 0px ' + theme.palette.boxShadowColor(.25),
    '-moz-box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    borderRadius: '50%',
    marginBottom: 14,
  },
  username: {
    fontSize: 32,
    lineHeight: '42px',
    marginBottom: 16
  },
  roleAndOrg: {
    fontSize: 16,
  },
  careerStage: {
    display: "flex",
    flexWrap: "wrap",
    color: theme.palette.grey[600],
    fontSize: 12,
    marginTop: 8,
    ...separatorBulletStyles(theme)
  },
  iconsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 24,
    rowGap: '10px',
    color: theme.palette.grey[600],
    fontSize: 14,
    lineHeight: '14px',
    marginTop: 10,
  },
  userMetaInfo: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 5,
    color: theme.palette.grey[600], // TODO: fix this color
  },
  userMetaInfoIcon: {
    fontSize: 18,
  },
  socialMediaIcons: {
    display: 'flex',
    columnGap: 10,
  },
  socialMediaIcon: {
    flex: 'none',
    height: 20,
    fill: theme.palette.grey[600],
  },
  website: {
    display: 'inline-flex',
    justifyContent: 'center',
    color: theme.palette.primary.main,
    wordBreak: 'break-all',
    lineHeight: '20px',
  },
  websiteIcon: {
    flex: 'none',
    height: 20,
    fill: theme.palette.primary.dark,
    marginRight: 4
  },
  btns: {
    display: 'flex',
    columnGap: 10,
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
  links: {
    display: "flex",
    flexWrap: "wrap",
    color: theme.palette.lwTertiary.main,
    marginTop: 16,
    ...separatorBulletStyles(theme)
  },
  registerRssLink: {
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.5
    }
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
  
  
  userInfo: {
    display: "flex",
    flexWrap: "wrap",
    color: theme.palette.lwTertiary.main,
    marginTop: 8,
    ...separatorBulletStyles(theme)
  },
  actions: {
    marginLeft: 20,
  },

  
  reportUserSection: {
    marginTop: 60
  },
  reportUserBtn: {
    ...theme.typography.commentStyle,
    background: 'none',
    color: theme.palette.primary.main,
    fontSize: 13,
    padding: 0,
    '&:hover': {
      color: theme.palette.primary.dark,
    }
  },
})

export const getUserFromResults = <T extends UsersMinimumInfo>(results: Array<T>|null|undefined): T|null => {
  // HOTFIX: Filtering out invalid users
  return results?.find(user => !!user.displayName) || results?.[0] || null
}

const EAUsersProfile = ({terms, slug, classes}: {
  terms: UsersViewTerms,
  slug: string,
  classes: ClassesType,
}) => {
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  })

  const currentUser = useCurrentUser();
  
  const {loading, results} = useMulti({
    terms,
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    enableTotal: false,
  });
  const user = getUserFromResults(results)
  
  const { query } = useLocation()
  // track profile views in local storage
  useEffect(() => {
    const ls = getBrowserLocalStorage()
    if (currentUser && user && currentUser._id !== user._id && ls) {
      let from = query.from
      let profiles = JSON.parse(ls.getItem('lastViewedProfiles')) || []
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
  
  const [showSettings, setShowSettings] = useState(false)

  const { flash } = useMessages()
  const reportUser = async () => {
    if (!user) return
    await updateUser({ selector: {_id: user._id}, data: { needsReview: true } })
    flash({messageString: "Your report has been sent to the moderators"})
  }

  const { SunshineNewUsersProfileInfo, SingleColumnSection, SectionTitle, LWTooltip,
    SettingsButton, NewConversationButton, TagEditsByUser, NotifyMeButton, DialogGroup,
    PostsList2, ContentItemBody, Loading, Error404, PermanentRedirect, HeadTags,
    Typography, ContentStyles, FormatDate, EAUsersProfileTabbedSection, PostsListSettings, LoadMore,
    RecentComments, SectionButton, SequencesGridWrapper } = Components

  if (loading) {
    return <div className={classNames("page", "users-profile", classes.profilePage)}>
      <Loading/>
    </div>
  }

  if (!user || !user._id || user.deleted) {
    //eslint-disable-next-line no-console
    console.error(`// missing user (_id/slug: ${slug})`);
    return <Error404/>
  }

  if (user.oldSlugs?.includes(slug)) {
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
  
  const userKarma = user.karma || 0

  const draftTerms: PostsViewTerms = {view: "drafts", userId: user._id, limit: 4, sortDrafts: currentUser?.sortDrafts || "modifiedAt" }
  const unlistedTerms: PostsViewTerms = {view: "unlisted", userId: user._id, limit: 20}
  const postTerms: PostsViewTerms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null};

  // maintain backward compatibility with bookmarks
  const currentSorting = query.sortedBy || query.view ||  "new"
  const currentFilter = query.filter ||  "all"
  const ownPage = currentUser?._id === user._id
  const currentShowLowKarma = (parseInt(query.karmaThreshold) !== DEFAULT_LOW_KARMA_THRESHOLD)
  const currentIncludeEvents = (query.includeEvents === 'true')
  postTerms.excludeEvents = !currentIncludeEvents && currentFilter !== 'events'

  const username = userGetDisplayName(user)
  const metaDescription = `${username}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`
  
  const userHasSocialMedia = Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).some(field => user[field])
  const socialMediaIcon = (field) => {
    if (!user[field]) return null
    return <a key={field} href={`https://${combineUrls(SOCIAL_MEDIA_PROFILE_FIELDS[field],user[field])}`} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" className={classes.socialMediaIcon}>{socialMediaIconPaths[field]}</svg>
    </a>
  }
  
  const { results: userOrganizesGroups, loadMoreProps: userOrganizesGroupsLoadMoreProps } = useMulti({
    terms: {view: 'userOrganizesGroups', userId: user._id, limit: 300},
    collectionName: "Localgroups",
    fragmentName: 'localGroupsHomeFragment',
    enableTotal: false,
  })
  
  const privateSectionTabs: Array<any> = [{
    id: 'drafts',
    label: 'My Drafts',
    secondaryNode: <LWTooltip title="This section is only visible to you and site admins.">
      <InfoIcon className={classes.privateSectionIcon} />
    </LWTooltip>,
    body: <>
      <AnalyticsContext listContext="userPageDrafts">
        <div className={classes.sectionSubHeadingRow}>
          <Typography variant="headline" className={classes.sectionSubHeading}>Posts</Typography>
          <Link to="/newPost">
            <SectionButton>
              <DescriptionIcon /> New Post
            </SectionButton>
          </Link>
        </div>
        <PostsList2 hideAuthor showDraftTag={false} terms={draftTerms}/>
        <PostsList2 hideAuthor showDraftTag={false} terms={unlistedTerms} showNoResults={false} showLoading={false} showLoadMore={false}/>
      </AnalyticsContext>
      <div className={classes.sectionSubHeadingRow}>
        <Typography variant="headline" className={classes.sectionSubHeading}>Sequences</Typography>
        <Link to="/sequencesnew">
          <SectionButton>
            <LibraryAddIcon /> New Sequence
          </SectionButton>
        </Link>
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
  
  const bioSectionTabs: Array<any> = []
  if (user.biography || user.howOthersCanHelpMe || user.howICanHelpOthers) {
    bioSectionTabs.push({
      id: 'bio',
      label: 'Bio',
      body: <>
        {user.htmlBio && <ContentStyles contentType="post">
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: user.htmlBio }}
            description={`user ${user._id} bio`}
          />
        </ContentStyles>}
        {user.howOthersCanHelpMe && <>
          <Typography variant="headline" className={classes.sectionSubHeading}>How others can help me</Typography>
          <ContentStyles contentType="post">
            <ContentItemBody dangerouslySetInnerHTML={{__html: user.howOthersCanHelpMe.html }} />
          </ContentStyles>
        </>}
        {user.howICanHelpOthers && <>
          <Typography variant="headline" className={classes.sectionSubHeading}>How I can help others</Typography>
          <ContentStyles contentType="post">
            <ContentItemBody dangerouslySetInnerHTML={{__html: user.howICanHelpOthers.html }} />
          </ContentStyles>
        </>}
      </>
    })
  }
  if (user.organizerOfGroupIds) {
    bioSectionTabs.push({
      id: 'participation',
      label: 'Participation',
      count: user.organizerOfGroupIds.length,
      body: <>
        <ContentStyles contentType="post">
          {user.organizerOfGroups.map(group => {
            return <div key={group._id}>
              Organizer of <Link to={`/groups/${group._id}`}>
                {group.name}
              </Link>
            </div>
          })}
        </ContentStyles>
      </>
    })
  }
  
  const commentsSectionTabs: Array<any> = []
  if (user.commentCount) {
    commentsSectionTabs.push({
      id: 'comments',
      label: 'Comments',
      count: user.commentCount,
      body: <RecentComments terms={{view: 'allRecentComments', authorIsUnreviewed: null, limit: 10, userId: user._id}} />
    })
  }
  if (user.sequenceCount) {
    commentsSectionTabs.push({
      id: 'sequences',
      label: 'Sequences',
      count: user.sequenceCount,
      body: <SequencesGridWrapper terms={{view: "userProfile", userId: user._id, limit: 9}} showLoadMore={true} />
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


  return (
    <div className={classNames("page", "users-profile", classes.profilePage)}>
      <HeadTags
        description={metaDescription}
        noIndex={(!user.postCount && !user.commentCount) || user.karma <= 0 || user.noindex}
        image={user.profileImageId && `https://res.cloudinary.com/cea/image/upload/c_crop,g_custom,q_auto,f_auto/${user.profileImageId}.jpg`}
      />
      <AnalyticsContext pageContext="userPage">
        <SingleColumnSection>
          <div className={classes.section}>
            {user.profileImageId && <Components.CloudinaryImage2
              height={96}
              width={96}
              imgProps={{q: '100'}}
              publicId={user.profileImageId}
              className={classes.profileImage}
            />}
            <Typography variant="headline" className={classes.username}>{username}</Typography>
            {(user.jobTitle || user.organization) && <ContentStyles contentType="comment" className={classes.roleAndOrg}>
              {user.jobTitle} {user.organization ? `@ ${user.organization}` : ''}
            </ContentStyles>}
            {!!user.careerStage?.length && <ContentStyles contentType="comment" className={classes.careerStage}>
              {user.careerStage.map(stage => {
                return <div key={stage}>
                  {CAREER_STAGES.find(s => s.value === stage)?.label}
                </div>
              })}
            </ContentStyles>}
            <ContentStyles contentType="comment" className={classes.iconsRow}>
              <Tooltip title={`${userKarma} karma`}>
                <span className={classes.userMetaInfo}>
                  <StarIcon className={classes.userMetaInfoIcon} />
                  {userKarma}
                </span>
              </Tooltip>
              {user.mapLocation && <Link to="/community#individuals" className={classes.userMetaInfo}>
                <LocationIcon className={classes.userMetaInfoIcon} />
                {user.mapLocation.formatted_address}
              </Link>}
              <span className={classes.userMetaInfo}>
                <CalendarIcon className={classes.userMetaInfoIcon} />
                <span>Joined <FormatDate date={user.createdAt} format={'MMM YYYY'} /></span>
              </span>
              {userHasSocialMedia && <div className={classes.socialMediaIcons}>
                {Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).map(field => socialMediaIcon(field))}
              </div>}
              {user.website && <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.website}>
                <svg viewBox="0 0 24 24" className={classes.websiteIcon}>{socialMediaIconPaths.website}</svg>
                {user.website}
              </a>}
            </ContentStyles>
            <div className={classes.btns}>
              {currentUser?._id != user._id && <NewConversationButton
                user={user}
                currentUser={currentUser}
              >
                <a tabIndex={0} className={classes.messageBtn}>
                  Message
                </a>
              </NewConversationButton>}
              {currentUser?._id != user._id && <NotifyMeButton
                document={user}
                className={classes.subscribeBtn}
                subscribeMessage="Subscribe to posts"
                unsubscribeMessage="Unsubscribe"
                asButton
              />}
            </div>
            <Typography variant="body2" className={classes.links}>
              {currentUser?.isAdmin &&
                <div className={classes.registerRssLink}>
                  <DialogGroup
                    actions={[]}
                    trigger={<span>Register RSS</span>}
                  >
                    { /*eslint-disable-next-line react/jsx-pascal-case*/ }
                    <div><Components.newFeedButton user={user} /></div>
                  </DialogGroup>
                </div>
              }
              {userCanEdit(currentUser, user) && <Link to={`/profile/${user.slug}/edit`}>
                Edit Profile
              </Link>}
              {currentUser && currentUser._id === user._id && <Link to="/manageSubscriptions">
                Manage Subscriptions
              </Link>}
              {userCanEdit(currentUser, user) && <Link to={userGetEditUrl(user)}>
                Account Settings
              </Link>}
            </Typography>
          </div>
          
          {userCanDo(currentUser, 'posts.moderate.all') && <div className={classes.sunshineSection}>
            <SunshineNewUsersProfileInfo userId={user._id} />
          </div>}
          
          {(ownPage || currentUser?.isAdmin) && <EAUsersProfileTabbedSection
            user={user}
            currentUser={currentUser}
            tabs={privateSectionTabs} />}
          
          <EAUsersProfileTabbedSection user={user} currentUser={currentUser} tabs={bioSectionTabs} />
          
          {user.postCount && <div className={classes.section}>
            <div className={classes.sectionHeadingRow}>
              <Typography variant="headline" className={classes.sectionHeading}>
                Posts <div className={classes.sectionHeadingCount}>{user.postCount}</div>
              </Typography>
              <SettingsButton onClick={() => setShowSettings(!showSettings)}
                label={`Sorted by ${ SORT_ORDER_OPTIONS[currentSorting].label }`} />
            </div>
            {showSettings && <PostsListSettings
              hidden={false}
              currentSorting={currentSorting}
              currentFilter={currentFilter}
              currentShowLowKarma={currentShowLowKarma}
              currentIncludeEvents={currentIncludeEvents}
            />}
            <AnalyticsContext listContext="userPagePosts">
              <PostsList2 terms={postTerms} hideAuthor />
            </AnalyticsContext>
          </div>}
          
          <EAUsersProfileTabbedSection user={user} currentUser={currentUser} tabs={commentsSectionTabs} />
          
          {/* {!!user.commentCount && <AnalyticsContext pageSectionContext="commentsSection">
            <div className={classes.section}>
              <Link to={`${userGetProfileUrl(user)}/replies`} className={classes.sectionHeadingRow}>
                <Typography variant="headline" className={classes.sectionHeading}>Comments</Typography>
              </Link>
              <Components.RecentComments terms={{view: 'allRecentComments', authorIsUnreviewed: null, limit: 10, userId: user._id}} />
            </div>
          </AnalyticsContext>} */}
        </SingleColumnSection>

        {currentUser && user.karma < 50 && !user.needsReview && (currentUser._id !== user._id) &&
          <SingleColumnSection className={classes.reportUserSection}>
            <button className={classes.reportUserBtn} onClick={reportUser}>Report user</button>
          </SingleColumnSection>
        }
      </AnalyticsContext>
    </div>
  )
}

const EAUsersProfileComponent = registerComponent(
  'EAUsersProfile', EAUsersProfile, {styles}
);

declare global {
  interface ComponentTypes {
    EAUsersProfile: typeof EAUsersProfileComponent
  }
}
