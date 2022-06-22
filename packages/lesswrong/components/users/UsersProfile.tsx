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
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting, hasEventsSetting, siteNameWithArticleSetting, taggingNameIsSet, taggingNameCapitalSetting, taggingNameSetting } from '../../lib/instanceSettings';
import { separatorBulletStyles } from '../common/SectionFooter';
import { taglineSetting } from '../common/HeadTags';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { socialMediaIconPaths } from '../form-components/PrefixedInput';
import { CAREER_STAGES, SOCIAL_MEDIA_PROFILE_FIELDS } from '../../lib/collections/users/custom_fields';
import { getBrowserLocalStorage } from '../async/localStorageHandlers';
import { SORT_ORDER_OPTIONS } from '../../lib/collections/posts/schema';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useMessages } from '../common/withMessages';

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
    columnGap: 60,
    paddingLeft: 10,
    paddingRight: 10,
    marginLeft: "auto",
    [theme.breakpoints.down('lg')]: {
      columnGap: 40,
    },
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
  nameAndProfileWrapper: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      marginTop: 25
    },
    [theme.breakpoints.down('xs')]: {
      display: 'block'
    }
  },
  nameAndProfileWrapperWithImg: {
    marginBottom: 15,
  },
  profileImage: {
    'box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    '-webkit-box-shadow': '0px 0px 2px 0px ' + theme.palette.boxShadowColor(.25),
    '-moz-box-shadow': '3px 3px 1px ' + theme.palette.boxShadowColor(.25),
    borderRadius: '50%',
    marginRight: 20,
  },
  flexingNameAndMessage: {
    'flex-grow': 1
  },
  usernameTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: "3rem",
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    marginTop: 0,
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
  },
  helpFieldHeading: {
    fontFamily: theme.typography.fontFamily,
    marginTop: theme.spacing.unit*4,
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
  
  rightSidebar: {
    gridArea: 'right',
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.palette.grey[700],
    paddingTop: theme.spacing.unit * 2,
    [theme.breakpoints.down('md')]: {
      display: 'none',
    }
  },
  sidebarDivider: {
    margin: '40px 15px'
  },
  mobileSidebarUpper: {
    display: 'none',
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.palette.grey[700],
    marginTop: 10,
    [theme.breakpoints.down('md')]: {
      display: 'block',
    }
  },
  mobileSidebarLower: {
    display: 'none',
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    color: theme.palette.grey[700],
    marginTop: 30,
    [theme.breakpoints.down('md')]: {
      display: 'block',
    }
  },
  currentRole: {
    lineHeight: '26px',
    marginBottom: 20
  },
  currentRoleSep: {
    fontSize: 14,
    color: theme.palette.grey[600],
    marginRight: 5
  },
  jobTitle: {
    fontWeight: 'bold',
    color: theme.palette.grey[800],
    marginRight: 5
  },
  organization: {
    fontWeight: 'bold',
    color: theme.palette.grey[800],
  },
  careerStages: {
    marginBottom: 20
  },
  careerStage: {
    fontSize: 15,
    marginBottom: 10
  },
  socialMediaIcons: {
    display: 'flex',
    columnGap: 14,
    marginBottom: 20
  },
  socialMediaIcon: {
    flex: 'none',
    height: 30,
    fill: theme.palette.grey[700],
  },
  website: {
    display: 'inline-flex',
    justifyContent: 'center',
    color: theme.palette.primary.main,
    wordBreak: 'break-all',
    marginLeft: 4,
  },
  websiteIcon: {
    flex: 'none',
    height: 20,
    fill: theme.palette.primary.dark,
    marginRight: 6
  },
})

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
    // currently only used on the EA Forum
    if (forumTypeSetting.get() === 'EAForum' && currentUser && user && currentUser._id !== user._id && ls) {
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

  const displaySequenceSection = (canEdit: boolean, user: UsersProfile) => {
    if (forumTypeSetting.get() === 'AlignmentForum') {
        return !!((canEdit && user.afSequenceDraftCount) || user.afSequenceCount) || !!(!canEdit && user.afSequenceCount)
    } else {
        return !!((canEdit && user.sequenceDraftCount) || user.sequenceCount) || !!(!canEdit && user.sequenceCount)
    }
  }

  const { flash } = useMessages()
  const reportUser = async () => {
    if (!user) return
    await updateUser({ selector: {_id: user._id}, data: { needsReview: true } })
    flash({messageString: "Your report has been sent to the moderators"})
  }

  const renderMeta = () => {
    if (!user) return null
    const { karma, postCount, commentCount, afPostCount, afCommentCount, afKarma, tagRevisionCount } = user;

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
  
  const isEAForum = forumTypeSetting.get() === 'EAForum'

  const render = () => {
    const { SunshineNewUsersProfileInfo, SingleColumnSection, SectionTitle, SequencesNewButton, LocalGroupsList,
      PostsListSettings, PostsList2, NewConversationButton, TagEditsByUser, NotifyMeButton, DialogGroup,
      SectionButton, SettingsButton, ContentItemBody, Loading, Error404, PermanentRedirect, HeadTags,
      Typography, ContentStyles } = Components

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
    let mapLocationNode = (user.mapLocation && isEAForum) ? <div>
      <Link to="/community#individuals" className={classes.mapLocation}>
        <LocationIcon className={classes.locationIcon} />
        {user.mapLocation.formatted_address}
      </Link>
    </div> : null

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
    
    // extra profile data that appears on the EA Forum
    const jobTitle = user.jobTitle && <span className={classes.jobTitle}>{user.jobTitle}</span>
    const currentRoleSep = user.organization ? <span className={classes.currentRoleSep}>
      {!jobTitle && 'Works '}at
    </span> : ''
    const org = user.organization && <span className={classes.organization}>{user.organization}</span>
    const currentRole = (jobTitle || org) && <div className={classes.currentRole}>
      {jobTitle}<wbr/>{currentRoleSep}<wbr/>{org}
    </div>
    const careerStage = user.careerStage?.length && <div className={classes.careerStages}>
      {user.careerStage.map(stage => {
        return <div key={stage} className={classes.careerStage}>
          {CAREER_STAGES.find(s => s.value === stage)?.label}
        </div>
      })}
    </div>
    // This info is in the righthand sidebar on desktop and moves above the bio on mobile
    const sidebarInfoUpperNode = isEAForum && <>
      {currentRole}
      {careerStage}
    </>
    
    const userHasSocialMedia = Object.keys(SOCIAL_MEDIA_PROFILE_FIELDS).some(field => user[field])
    const socialMediaIcon = (field) => {
      if (!user[field]) return null
      return <a key={field} href={`https://${combineUrls(SOCIAL_MEDIA_PROFILE_FIELDS[field],user[field])}`} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" className={classes.socialMediaIcon}>{socialMediaIconPaths[field]}</svg>
      </a>
    }
    // This data is in the righthand sidebar on desktop and moves under the bio on mobile
    const sidebarInfoLowerNode = isEAForum && <>
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
            <div className={classNames(classes.nameAndProfileWrapper, {[classes.nameAndProfileWrapperWithImg]: isEAForum && user.profileImageId})}>
              {isEAForum && user.profileImageId && <Components.CloudinaryImage2
                height={90}
                width={90}
                imgProps={{q: '100'}}
                publicId={user.profileImageId}
                className={classes.profileImage}
              />}
              <div className={classes.flexingNameAndMessage}>
                <div className={classes.usernameTitle}>
                  <div>{username}</div>
                  {isEAForum && currentUser?._id != user._id && (
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
                {isEAForum && currentUser?._id != user._id && (
                  <div className={classes.messageBtnMobile}>
                    <NewConversationButton user={user} currentUser={currentUser}>
                      <Button color="primary" variant="contained" className={classes.messageBtn}>
                        Message
                      </Button>
                    </NewConversationButton>
                  </div>
                )}
              </div>
            </div>
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
              { isEAForum && userCanEdit(currentUser, user) && <Link to={`/profile/${user.slug}/edit`}>
                Edit Profile
              </Link>}
              { currentUser && currentUser._id === user._id && <Link to="/manageSubscriptions">
                Manage Subscriptions
              </Link>}
              { !isEAForum && currentUser?._id != user._id && <NewConversationButton user={user} currentUser={currentUser}>
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
            
            {isEAForum && <div className={classes.mobileSidebarUpper}>
              {sidebarInfoUpperNode}
              {(currentRole || careerStage) && (user.htmlBio || userHasSocialMedia || user.website) && <Divider className={classes.sidebarDivider} />}
            </div>}

            {user.htmlBio && <ContentStyles contentType="post">
              <ContentItemBody className={classes.bio} dangerouslySetInnerHTML={{__html: user.htmlBio }} description={`user ${user._id} bio`} />
            </ContentStyles>}
            {isEAForum && user.howOthersCanHelpMe && <>
              <h2 className={classes.helpFieldHeading}>How others can help me</h2>
              <ContentStyles contentType="post">
                <ContentItemBody dangerouslySetInnerHTML={{__html: user.howOthersCanHelpMe.html }} />
              </ContentStyles>
            </>}
            {isEAForum && user.howICanHelpOthers && <>
              <h2 className={classes.helpFieldHeading}>How I can help others</h2>
              <ContentStyles contentType="post">
                <ContentItemBody dangerouslySetInnerHTML={{__html: user.howICanHelpOthers.html }} />
              </ContentStyles>
            </>}
            {isEAForum && !!user.organizerOfGroups?.length && <>
              <h2 className={classes.helpFieldHeading}>Organizer of</h2>
              <ContentStyles contentType="post">
                <div className={classes.organizerOfGroups}>
                  {user.organizerOfGroups.map(group => {
                    return <div key={group._id}>
                      <Link to={`/groups/${group._id}`}>
                        {group.name}
                      </Link>
                    </div>
                  })}
                </div>
              </ContentStyles>
            </>}
            
            {isEAForum && <div className={classes.mobileSidebarLower}>
              {sidebarInfoLowerNode}
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
                <SettingsButton label={`Sorted by ${ SORT_ORDER_OPTIONS[currentSorting].label }`}/>
              </SectionTitle>
            </div>
            {showSettings && <PostsListSettings
              hidden={false}
              currentSorting={currentSorting}
              currentFilter={currentFilter}
              currentShowLowKarma={currentShowLowKarma}
              currentIncludeEvents={currentIncludeEvents}
            />}
            <AnalyticsContext listContext={"userPagePosts"}>
              {user.shortformFeedId && <Components.ProfileShortform user={user}/>}
              <PostsList2 terms={terms} hideAuthor />
            </AnalyticsContext>
          </SingleColumnSection>
          {/* Groups Section */
            (ownPage || currentUser?.isAdmin) && <LocalGroupsList terms={{
                view: 'userActiveGroups',
                userId: user._id,
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

          {currentUser && !user.reviewedByUserId && !user.needsReview && (currentUser._id !== user._id) &&
            <SingleColumnSection className={classes.reportUserSection}>
              <button className={classes.reportUserBtn} onClick={reportUser}>Report user</button>
            </SingleColumnSection>
          }
          </div>
          
          {isEAForum && <div className={classes.rightSidebar}>
            {sidebarInfoUpperNode}
            {(currentRole || careerStage) && (userHasSocialMedia || user.website) && <Divider className={classes.sidebarDivider} />}
            {sidebarInfoLowerNode}
          </div>}
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
