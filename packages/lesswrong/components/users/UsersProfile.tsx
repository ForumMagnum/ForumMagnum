import { combineUrls, Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React, { useEffect, useState } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { userCanEdit, userGetDisplayName, userGetProfileUrl, userGetProfileUrlFromSlug } from "../../lib/collections/users/helpers";
import { userGetEditUrl } from '../../lib/vulcan-users/helpers';
import { DEFAULT_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import StarIcon from '@material-ui/icons/Star'
import DescriptionIcon from '@material-ui/icons/Description'
import MessageIcon from '@material-ui/icons/Message'
import PencilIcon from '@material-ui/icons/Create'
import LocationIcon from '@material-ui/icons/LocationOn'
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting, hasEventsSetting, siteNameWithArticleSetting, taggingNameIsSet, taggingNameCapitalSetting, taggingNameSetting } from '../../lib/instanceSettings';
import { separatorBulletStyles } from '../common/SectionFooter';
import { taglineSetting } from '../common/HeadTags';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { socialMediaIconPaths } from '../form-components/PrefixedInput';
import { SOCIAL_MEDIA_PROFILE_FIELDS } from '../../lib/collections/users/custom_fields';
import Button from '@material-ui/core/Button';
import { getBrowserLocalStorage } from '../async/localStorageHandlers';

export const sectionFooterLeftStyles = {
  flexGrow: 1,
  display: "flex",
  '&&:after': {
    content: '""'
  }
}

const styles = (theme: ThemeType): JssStyles => ({
  profilePage: {
    display: 'grid',
    gridTemplateColumns: `1fr ${SECTION_WIDTH}px 1fr`,
    gridTemplateAreas: `
      '. center right'
    `,
    justifyContent: 'center',
    columnGap: 50,
    paddingLeft: 10,
    paddingRight: 10,
    marginLeft: "auto",
    [theme.breakpoints.down('md')]: {
      display: 'block',
      marginTop: -20
    },
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 5,
      paddingRight: 5,
      margin: 0,
    }
  },
  centerColumnWrapper: {
    gridArea: 'center'
  },
  usernameTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: "3rem",
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    marginTop: 0,
    [theme.breakpoints.down('sm')]: {
      marginTop: 15
    }
  },
  messageBtnDesktop: {
    display: 'block',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  messageBtnMobile: {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    }
  },
  messageBtn: {
    boxShadow: 'none',
    marginLeft: 20,
    [theme.breakpoints.down('xs')]: {
      margin: '5px 0 10px'
    }
  },
  mapLocation: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: 4,
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.grey[800],
    marginBottom: 12
  },
  locationIcon: {
    fontSize: 14,
  },
  userInfo: {
    display: "flex",
    flexWrap: "wrap",
    color: theme.palette.lwTertiary.main,
    marginTop: 8,
    ...separatorBulletStyles(theme)
  },
  meta: {
    ...sectionFooterLeftStyles,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      marginBottom: theme.spacing.unit,
    }
  },
  icon: {
    '&$specificalz': {
      fontSize: 18,
      color: theme.palette.icon.dim,
      marginRight: 4
    }
  },
  actions: {
    marginLeft: 20,
  },
  bio: {
    marginTop: theme.spacing.unit*3,
    marginLeft: theme.spacing.unit/2,
    marginRight: theme.spacing.unit,
  },
  primaryColor: {
    color: theme.palette.primary.light
  },
  title: {
    cursor: "pointer"
  },
  // Dark Magick
  // https://giphy.com/gifs/psychedelic-art-phazed-12GGadpt5aIUQE
  specificalz: {},
  userMetaInfo: {
    display: "inline-flex"
  },
  
  rightSidebar: {
    gridArea: 'right',
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.palette.grey[700],
    paddingTop: theme.spacing.unit * 3,
    [theme.breakpoints.down('md')]: {
      display: 'none',
    }
  },
  mobileRightSidebar: {
    display: 'none',
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.palette.grey[700],
    marginTop: 30,
    [theme.breakpoints.down('md')]: {
      display: 'block',
    }
  },
  socialMediaIcons: {
    display: 'flex',
    columnGap: 14,
    marginBottom: 30
  },
  socialMediaIcon: {
    flex: 'none',
    height: 30,
    fill: theme.palette.grey[700],
  },
  website: {
    display: 'inline-flex',
    justifyContent: 'center',
    wordBreak: 'break-all',
    marginLeft: 4
  },
  websiteIcon: {
    flex: 'none',
    height: 20,
    fill: theme.palette.grey[700],
    marginRight: 6
  },
})

const sortings: Partial<Record<string,string>> = {
  magic: "Magic (New & Upvoted)",
  recentComments: "Recent Comments",
  new: "New",
  old: "Old",
  top: "Top"
}

export const getUserFromResults = <T extends UsersMinimumInfo>(results: Array<T>|null|undefined): T|null => {
  // HOTFIX: Filtering out invalid users
  return results?.find(user => !!user.displayName) || results?.[0] || null
}

const UsersProfileFn = ({terms, slug, classes}: {
  terms: UsersViewTerms,
  slug: string,
  classes: ClassesType,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const currentUser = useCurrentUser();
  
  const {loading, results} = useMulti({
    terms,
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    enableTotal: false,
  });
  
  const { query } = useLocation()
  // track profile views in local storage
  useEffect(() => {
    const profileUser = getUserFromResults(results)
    const ls = getBrowserLocalStorage()
    // currently only used on the EA Forum
    if (forumTypeSetting.get() === 'EAForum' && currentUser && profileUser && currentUser._id !== profileUser._id && ls) {
      let from = query.from
      let profiles = JSON.parse(ls.getItem('lastViewedProfiles')) || []
      // if the profile user is already in the list, then remove them before re-adding them at the end
      const profileUserIndex = profiles?.findIndex(profile => profile.userId === profileUser._id)
      if (profiles && profileUserIndex !== -1) {
        // remember where we originally saw this profile, if necessary
        from = from || profiles[profileUserIndex].from
        profiles.splice(profileUserIndex, 1)
      }
      
      profiles.push({userId: profileUser._id, ...(from && {from})})
      // we only bother to save the last 10 profiles
      if (profiles.length > 10) profiles.shift()
      // save it in local storage
      ls.setItem('lastViewedProfiles', JSON.stringify(profiles))
    }
  }, [currentUser, results])

  const displaySequenceSection = (canEdit: boolean, user: UsersProfile) => {
    if (forumTypeSetting.get() === 'AlignmentForum') {
        return !!((canEdit && user.afSequenceDraftCount) || user.afSequenceCount) || !!(!canEdit && user.afSequenceCount)
    } else {
        return !!((canEdit && user.sequenceDraftCount) || user.sequenceCount) || !!(!canEdit && user.sequenceCount)
    }
  }

  const renderMeta = () => {
    const document = getUserFromResults(results)
    if (!document) return null
    const { karma, postCount, commentCount, afPostCount, afCommentCount, afKarma, tagRevisionCount } = document;

    const userKarma = karma || 0
    const userAfKarma = afKarma || 0
    const userPostCount = forumTypeSetting.get() !== 'AlignmentForum' ? postCount || 0 : afPostCount || 0
    const userCommentCount = forumTypeSetting.get() !== 'AlignmentForum' ? commentCount || 0 : afCommentCount || 0

      return <div className={classes.meta}>

        { forumTypeSetting.get() !== 'AlignmentForum' && <Tooltip title={`${userKarma} karma`}>
          <span className={classes.userMetaInfo}>
            <StarIcon className={classNames(classes.icon, classes.specificalz)}/>
            <Components.MetaInfo title="Karma">
              {userKarma}
            </Components.MetaInfo>
          </span>
        </Tooltip>}

        {!!userAfKarma && <Tooltip title={`${userAfKarma} karma${(forumTypeSetting.get() !== 'AlignmentForum') ? " on alignmentforum.org" : ""}`}>
          <span className={classes.userMetaInfo}>
            <Components.OmegaIcon className={classNames(classes.icon, classes.specificalz)}/>
            <Components.MetaInfo title="Alignment Karma">
              {userAfKarma}
            </Components.MetaInfo>
          </span>
        </Tooltip>}

        <Tooltip title={`${userPostCount} posts`}>
          <span className={classes.userMetaInfo}>
            <DescriptionIcon className={classNames(classes.icon, classes.specificalz)}/>
            <Components.MetaInfo title="Posts">
              {userPostCount}
            </Components.MetaInfo>
          </span>
        </Tooltip>

        <Tooltip title={`${userCommentCount} comments`}>
          <span className={classes.userMetaInfo}>
            <MessageIcon className={classNames(classes.icon, classes.specificalz)}/>
            <Components.MetaInfo title="Comments">
              { userCommentCount }
            </Components.MetaInfo>
          </span>
        </Tooltip>

        <Tooltip title={`${tagRevisionCount||0} ${taggingNameIsSet.get() ? taggingNameSetting.get() : 'wiki'} edit${tagRevisionCount === 1 ? '' : 's'}`}>
          <span className={classes.userMetaInfo}>
            <PencilIcon className={classNames(classes.icon, classes.specificalz)}/>
            <Components.MetaInfo>
              { tagRevisionCount||0 }
            </Components.MetaInfo>
          </span>
        </Tooltip>
      </div>
  }

  const render = () => {
    const user = getUserFromResults(results)
    const { SunshineNewUsersProfileInfo, SingleColumnSection, SectionTitle, SequencesNewButton, LocalGroupsList, PostsListSettings, PostsList2, NewConversationButton, TagEditsByUser, NotifyMeButton, DialogGroup, SectionButton, SettingsButton, ContentItemBody, Loading, Error404, PermanentRedirect, HeadTags, Typography, ContentStyles } = Components
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
    
    // on the EA Forum, the user's location links to the Community map
    let mapLocationNode
    if (user.mapLocation) {
      mapLocationNode = forumTypeSetting.get() === 'EAForum' ? <div>
        <Link to="/community#individuals" className={classes.mapLocation}>
          <LocationIcon className={classes.locationIcon} />
          {user.mapLocation.formatted_address}
        </Link>
      </div> : <div className={classes.mapLocation}>
        <LocationIcon className={classes.locationIcon} />
        {user.mapLocation.formatted_address}
      </div>
    }

    const draftTerms: PostsViewTerms = {view: "drafts", userId: user._id, limit: 4, sortDrafts: currentUser?.sortDrafts || "modifiedAt" }
    const unlistedTerms: PostsViewTerms = {view: "unlisted", userId: user._id, limit: 20}
    const afSubmissionTerms: PostsViewTerms = {view: "userAFSubmissions", userId: user._id, limit: 4}
    const terms: PostsViewTerms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null};
    const sequenceTerms: SequencesViewTerms = {view: "userProfile", userId: user._id, limit:9}
    const sequenceAllTerms: SequencesViewTerms = {view: "userProfileAll", userId: user._id, limit:9}

    // maintain backward compatibility with bookmarks
    const currentSorting = query.sortedBy || query.view ||  "new"
    const currentFilter = query.filter ||  "all"
    const ownPage = currentUser?._id === user._id
    const currentShowLowKarma = (parseInt(query.karmaThreshold) !== DEFAULT_LOW_KARMA_THRESHOLD)
    const currentIncludeEvents = (query.includeEvents === 'true')
    terms.excludeEvents = !currentIncludeEvents && currentFilter !== 'events'

    const username = userGetDisplayName(user)
    const metaDescription = `${username}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`
    
    const nonAFMember = (forumTypeSetting.get()==="AlignmentForum" && !userCanDo(currentUser, "posts.alignment.new"))
    
    const userHasSocialMedia = Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).some(field => user[field])
    
    const socialMediaIcon = (field) => {
      if (!user[field]) return null
      return <a key={field} href={`https://${combineUrls(SOCIAL_MEDIA_PROFILE_FIELDS[field],user[field])}`} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" className={classes.socialMediaIcon}>{socialMediaIconPaths[field]}</svg>
      </a>
    }
    
    // the data in the righthand sidebar on desktop moves under the bio on mobile
    const sidebarInfoNode = forumTypeSetting.get() === "EAForum" && <>
      {userHasSocialMedia && <>
        <div className={classes.socialMediaIcons}>
          {Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).map(field => socialMediaIcon(field))}
        </div>
      </>}
      {user.website && <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.website}>
        <svg viewBox="0 0 24 24" className={classes.websiteIcon}>{socialMediaIconPaths.website}</svg>
        {user.website}
      </a>}
    </>

    return (
      <div className={classNames("page", "users-profile", classes.profilePage)}>
        <HeadTags
          description={metaDescription}
          noIndex={(!user.postCount && !user.commentCount) || user.karma <= 0 || user.noindex}
        />
        <AnalyticsContext pageContext={"userPage"}>
          <div className={classes.centerColumnWrapper}>
          {/* Bio Section */}
          <SingleColumnSection>
            <div className={classes.usernameTitle}>
              <div>{username}</div>
              {forumTypeSetting.get() === "EAForum" && currentUser?._id != user._id && (
                <div className={classes.messageBtnDesktop}>
                  <NewConversationButton user={user} currentUser={currentUser}>
                    <Button color="primary" variant="contained" className={classes.messageBtn} data-cy="message">
                      Message
                    </Button>
                  </NewConversationButton>
                </div>
              )}
            </div>
            {mapLocationNode}
            {forumTypeSetting.get() === "EAForum" && currentUser?._id != user._id && (
              <div className={classes.messageBtnMobile}>
                <NewConversationButton user={user} currentUser={currentUser}>
                  <Button color="primary" variant="contained" className={classes.messageBtn}>
                    Message
                  </Button>
                </NewConversationButton>
              </div>
            )}
            <Typography variant="body2" className={classes.userInfo}>
              { renderMeta() }
              { currentUser?.isAdmin &&
                <div>
                  <DialogGroup
                    actions={[]}
                    trigger={<span>Add RSS</span>}
                  >
                    { /*eslint-disable-next-line react/jsx-pascal-case*/ }
                    <div><Components.newFeedButton user={user} /></div>
                  </DialogGroup>
                </div>
              }
              { forumTypeSetting.get() === "EAForum" && userCanEdit(currentUser, user) && <Link to={`/profile/${user.slug}/edit`}>
                Edit Profile
              </Link>}
              { currentUser && currentUser._id === user._id && <Link to="/manageSubscriptions">
                Manage Subscriptions
              </Link>}
              { forumTypeSetting.get() !== "EAForum" && currentUser?._id != user._id && <NewConversationButton user={user} currentUser={currentUser}>
                <a data-cy="message">Message</a>
              </NewConversationButton>}
              { <NotifyMeButton
                document={user}
                subscribeMessage="Subscribe to posts"
                unsubscribeMessage="Unsubscribe from posts"
              /> }
              {userCanEdit(currentUser, user) && <Link to={userGetEditUrl(user)}>
                Account Settings
              </Link>}
            </Typography>

            {user.bio && <ContentStyles contentType="post">
              <ContentItemBody className={classes.bio} dangerouslySetInnerHTML={{__html: user.htmlBio }} description={`user ${user._id} bio`} />
            </ContentStyles>}
            
            {(userHasSocialMedia || user.website) && <div className={classes.mobileRightSidebar}>
              {sidebarInfoNode}
            </div>}
          </SingleColumnSection>

          <SingleColumnSection>
            <SunshineNewUsersProfileInfo userId={user._id} />
          </SingleColumnSection>

          {/* Sequences Section */}
          { displaySequenceSection(ownPage, user) && <SingleColumnSection>
            <SectionTitle title="Sequences">
              {ownPage && <SequencesNewButton />}
            </SectionTitle>
            <Components.SequencesGridWrapper
                terms={ownPage ? sequenceAllTerms : sequenceTerms}
                showLoadMore={true}/>
          </SingleColumnSection> }

          {/* Drafts Section */}
          { ownPage && <SingleColumnSection>
            <SectionTitle title="My Drafts">
              <Link to={"/newPost"}>
                <SectionButton>
                  <DescriptionIcon /> New Blog Post
                </SectionButton>
              </Link>
            </SectionTitle>
            <AnalyticsContext listContext={"userPageDrafts"}>
              <Components.PostsList2 hideAuthor showDraftTag={false} terms={draftTerms}/>
              <Components.PostsList2 hideAuthor showDraftTag={false} terms={unlistedTerms} showNoResults={false} showLoading={false} showLoadMore={false}/>
            </AnalyticsContext>
            {hasEventsSetting.get() && <Components.LocalGroupsList
              terms={{view: 'userInactiveGroups', userId: currentUser?._id}}
              showNoResults={false}
            />}
          </SingleColumnSection> }
          {/* AF Submissions Section */}
          {ownPage && nonAFMember && <SingleColumnSection>
            <Components.LWTooltip inlineBlock={false} title="Your posts are pending approval to the Alignment Forum and are only visible to you on the Forum. 
            They are visible to everyone on LessWrong.">
              <SectionTitle title="My Submissions"/>
            </Components.LWTooltip>
            <Components.PostsList2 hideAuthor showDraftTag={false} terms={afSubmissionTerms}/>
          </SingleColumnSection>
          }
          {/* Posts Section */}
          <SingleColumnSection>
            <div className={classes.title} onClick={() => setShowSettings(!showSettings)}>
              <SectionTitle title={"Posts"}>
                <SettingsButton label={`Sorted by ${ sortings[currentSorting]}`}/>
              </SectionTitle>
            </div>
            {showSettings && <PostsListSettings
              hidden={false}
              currentSorting={currentSorting}
              currentFilter={currentFilter}
              currentShowLowKarma={currentShowLowKarma}
              currentIncludeEvents={currentIncludeEvents}
              sortings={sortings}
            />}
            <AnalyticsContext listContext={"userPagePosts"}>
              <PostsList2 terms={terms} hideAuthor />
            </AnalyticsContext>
          </SingleColumnSection>
          {/* Groups Section */
            (ownPage || currentUser?.isAdmin) && <LocalGroupsList terms={{
                view: 'userActiveGroups',
                userId: user?._id,
                limit: 300
              }} heading="Organizer of" showNoResults={false} />
          }
          {/* Wiki Section */}
          <SingleColumnSection>
            <SectionTitle title={`${taggingNameIsSet.get() ? taggingNameCapitalSetting.get() : 'Wiki'} Contributions`} />
            <AnalyticsContext listContext={"userPageWiki"}>
              <TagEditsByUser
                userId={user._id}
                limit={10}
              />
            </AnalyticsContext>
          </SingleColumnSection>
          {/* Comments Sections */}
          <AnalyticsContext pageSectionContext="commentsSection">
            {ownPage && nonAFMember && <SingleColumnSection>
              <Components.LWTooltip inlineBlock={false } title="Your comments are pending approval to the Alignment Forum and are only visible to you on the Forum. 
              They are visible to everyone on LessWrong.">
                <SectionTitle title={"Comment Submissions"} />
              </Components.LWTooltip>
              <Components.RecentComments terms={{view: 'afSubmissions', authorIsUnreviewed: null, limit: 5, userId: user._id}} />
            </SingleColumnSection>}
            <SingleColumnSection>
              <Link to={`${userGetProfileUrl(user)}/replies`}>
                <SectionTitle title={"Comments"} />
              </Link>
              <Components.RecentComments terms={{view: 'allRecentComments', authorIsUnreviewed: null, limit: 10, userId: user._id}} />
            </SingleColumnSection>
          </AnalyticsContext>
          </div>
          
          <div className={classes.rightSidebar}>
            {sidebarInfoNode}
          </div>
        </AnalyticsContext>
      </div>
    )
  }

  return render();
}

const UsersProfileComponent = registerComponent(
  'UsersProfile', UsersProfileFn, {styles}
);

declare global {
  interface ComponentTypes {
    UsersProfile: typeof UsersProfileComponent
  }
}
