import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React, { useEffect, useState } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { userCanEditUser, userGetDisplayName, userGetProfileUrl, userGetProfileUrlFromSlug } from "../../lib/collections/users/helpers";
import { userGetEditUrl } from '../../lib/vulcan-users/helpers';
import { DEFAULT_LOW_KARMA_THRESHOLD, POST_SORTING_MODES } from '../../lib/collections/posts/views'
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star'
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description'
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message'
import PencilIcon from '@/lib/vendor/@material-ui/icons/src/Create'
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { hasEventsSetting, siteNameWithArticleSetting, taggingNameIsSet, taggingNameCapitalSetting, taggingNameSetting, taglineSetting, isAF } from '../../lib/instanceSettings';
import { separatorBulletStyles } from '../common/SectionFooter';
import { SORT_ORDER_OPTIONS } from '../../lib/collections/posts/dropdownOptions';
import { nofollowKarmaThreshold } from '../../lib/publicSettings';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useMessages } from '../common/withMessages';
import CopyIcon from '@/lib/vendor/@material-ui/icons/src/FileCopy'
import { getUserStructuredData } from './UsersSingle';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { COMMENT_SORTING_MODES } from '@/lib/collections/comments/views';
import { useDialog } from '../common/withDialog';
import pick from 'lodash/pick';
import PostsListSettings, { postListSettingUrlParameterNames } from '../posts/PostsListSettings';
import { TooltipSpan } from '../common/FMTooltip';
import MetaInfo from "../common/MetaInfo";
import OmegaIcon from "../icons/OmegaIcon";
import Error404 from "../common/Error404";
import NewFeedButton from "../rss/NewFeedButton";
import NewDialogueDialog from "../posts/NewDialogueDialog";
import SequencesGridWrapper from "../sequences/SequencesGridWrapper";
import DraftsList from "../posts/DraftsList";
import PostsList2 from "../posts/PostsList2";
import LocalGroupsList from "../localGroups/LocalGroupsList";
import LWTooltip from "../common/LWTooltip";
import ProfileShortform from "../shortform/ProfileShortform";
import RecentComments from "../comments/RecentComments";
import SunshineNewUsersProfileInfo from "../sunshineDashboard/SunshineNewUsersProfileInfo";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import SequencesNewButton from "../sequences/SequencesNewButton";
import NewConversationButton from "../messaging/NewConversationButton";
import TagEditsByUser from "../tagging/TagEditsByUser";
import DialogGroup from "../common/DialogGroup";
import SettingsButton from "../icons/SettingsButton";
import ContentItemBody from "../common/ContentItemBody";
import Loading from "../vulcan-core/Loading";
import PermanentRedirect from "../common/PermanentRedirect";
import HeadTags from "../common/HeadTags";
import { Typography } from "../common/Typography";
import ContentStyles from "../common/ContentStyles";
import ReportUserButton from "./ReportUserButton";
import UserNotifyDropdown from "../notifications/UserNotifyDropdown";
import CommentsSortBySelector from "../comments/CommentsSortBySelector";

export const sectionFooterLeftStyles = {
  flexGrow: 1,
  display: "flex",
  '&&:after': {
    content: '""'
  }
}

const styles = (theme: ThemeType) => ({
  profilePage: {
    marginLeft: "auto",
    [theme.breakpoints.down('sm')]: {
      paddingTop: 10,
      margin: 0,
    }
  },
  usernameTitle: {
    fontSize: "3.2rem",
    ...theme.typography.display3,
    ...theme.typography.headerStyle,
    marginTop: 0,
  },
  deletedUserName: {
    textDecoration: "line-through",
  },
  userInfo: {
    display: "flex",
    flexWrap: "wrap",
    color: theme.palette.lwTertiary.main,
    marginTop: 8,
    [theme.breakpoints.up('sm')]: {
      ...separatorBulletStyles(theme),
    },
    [theme.breakpoints.down('sm')]: {
      ...separatorBulletStyles(theme, 0.375),
    },
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
  postsTitle: {
    cursor: "pointer"
  },
  // Dark Magick
  // https://giphy.com/gifs/psychedelic-art-phazed-12GGadpt5aIUQE
  specificalz: {},
  userMetaInfo: {
    display: "inline-flex"
  },
  copyIcon: {
    fontSize: 14
  },
  subscribeButton: {
    display: "flex",
  },
  commentSorting: {
    marginRight: 30,
    [theme.breakpoints.down('xs')]: {
      marginRight: 0,
    },
  },
  dialogueButton: {
    display: 'flex',
    alignItems: 'center',
  },
})

export const getUserFromResults = <T extends UsersMinimumInfo>(results: Array<T>|null|undefined): T|null => {
  // HOTFIX: Filtering out invalid users
  return results?.find(user => !!user.displayName) || results?.[0] || null
}

const UsersProfileFn = ({terms, slug, classes}: {
  terms: UsersViewTerms,
  slug: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  
  const {loading, results} = useMulti({
    terms,
    collectionName: "Users",
    fragmentName: 'UsersProfile',
    enableTotal: false,
  });
  const user = getUserFromResults(results)
  
  const { query } = useLocation()

  const { openDialog } = useDialog();

  const displaySequenceSection = (canEdit: boolean, user: UsersProfile) => {
    if (isAF) {
        return !!((canEdit && user.afSequenceDraftCount) || user.afSequenceCount) || !!(!canEdit && user.afSequenceCount)
    } else {
        return !!((canEdit && user.sequenceDraftCount) || user.sequenceCount) || !!(!canEdit && user.sequenceCount)
    }
  }

  const [restoreScrollPos, setRestoreScrollPos] = useState(-1);
  useEffect(() => {
    if (restoreScrollPos === -1) return;

    window.scrollTo({top: restoreScrollPos})
    setRestoreScrollPos(-1);
  }, [restoreScrollPos])

  const renderMeta = () => {
    if (!user) return null
    const { karma, postCount, commentCount, afPostCount, afCommentCount, afKarma, tagRevisionCount } = user;

    const userKarma = karma || 0
    const userAfKarma = afKarma || 0
    const userPostCount = !isAF ? postCount || 0 : afPostCount || 0
    const userCommentCount = !isAF ? commentCount || 0 : afCommentCount || 0

      return <div className={classes.meta}>

        { !isAF && <TooltipSpan title={`${userKarma} karma`} className={classes.userMetaInfo}>
          <StarIcon className={classNames(classes.icon, classes.specificalz)}/>
          <MetaInfo title="Karma">
            {userKarma}
          </MetaInfo>
        </TooltipSpan>}

        {!!userAfKarma && <TooltipSpan title={`${userAfKarma} karma${(!isAF) ? " on alignmentforum.org" : ""}`} className={classes.userMetaInfo}>
          <OmegaIcon className={classNames(classes.icon, classes.specificalz)}/>
          <MetaInfo title="Alignment Karma">
            {userAfKarma}
          </MetaInfo>
        </TooltipSpan>}

        <TooltipSpan title={`${userPostCount} posts`} className={classes.userMetaInfo}>
          <DescriptionIcon className={classNames(classes.icon, classes.specificalz)}/>
          <MetaInfo title="Posts">
            {userPostCount}
          </MetaInfo>
        </TooltipSpan>

        <TooltipSpan title={`${userCommentCount} comments`} className={classes.userMetaInfo}>
          <MessageIcon className={classNames(classes.icon, classes.specificalz)}/>
          <MetaInfo title="Comments">
            { userCommentCount }
          </MetaInfo>
        </TooltipSpan>

        <TooltipSpan title={`${tagRevisionCount||0} ${taggingNameIsSet.get() ? taggingNameSetting.get() : 'wiki'} edit${tagRevisionCount === 1 ? '' : 's'}`} className={classes.userMetaInfo}>
          <PencilIcon className={classNames(classes.icon, classes.specificalz)}/>
          <MetaInfo>
            { tagRevisionCount||0 }
          </MetaInfo>
        </TooltipSpan>
      </div>
  }

  const render = () => {
    if (loading) {
      return <div className={classNames("page", "users-profile", classes.profilePage)}>
        <Loading/>
      </div>
    }

    if (!user || !user._id || (user.deleted && !currentUser?.isAdmin)) {
      //eslint-disable-next-line no-console
      console.error(`// missing user (_id/slug: ${slug})`);
      return <Error404/>
    }

    if (slug !== user.slug && user.oldSlugs?.includes(slug) && !user.deleted) {
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
        return <Error404/>
      }
    }

    const unlistedTerms: PostsViewTerms = {view: "unlisted", userId: user._id, limit: 20}
    const afSubmissionTerms: PostsViewTerms = {view: "userAFSubmissions", userId: user._id, limit: 4}
    const postTerms: PostsViewTerms = {
      view: "userPosts",
      ...pick(query, postListSettingUrlParameterNames),
      userId: user._id,
      authorIsUnreviewed: null
    };
    const sequenceTerms: SequencesViewTerms = {view: "userProfile", userId: user._id, limit:9}
    const sequenceAllTerms: SequencesViewTerms = {view: "userProfileAll", userId: user._id, limit:9}

    // maintain backward compatibility with bookmarks
    const postQueryMode = (query.sortedBy || query.view ||  "new")
    const currentPostSortingMode = POST_SORTING_MODES.has(postQueryMode) ? postQueryMode : "new"
    postTerms.sortedBy = currentPostSortingMode
    
    const currentFilter = query.filter ||  "all"
    
    const commentQueryName = "commentsSortBy"
    const commentQueryMode = query[commentQueryName]
    const currentCommentSortBy = COMMENT_SORTING_MODES.has(commentQueryMode) ? commentQueryMode : undefined

    const ownPage = currentUser?._id === user._id
    const currentShowLowKarma = (parseInt(query.karmaThreshold) !== DEFAULT_LOW_KARMA_THRESHOLD)
    const currentIncludeEvents = (query.includeEvents === 'true')
    postTerms.excludeEvents = !currentIncludeEvents && currentFilter !== 'events'
    

    const username = userGetDisplayName(user)
    const metaDescription = `${username}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`
    
    const nonAFMember = (isAF && !userCanDo(currentUser, "posts.alignment.new"))

    const showMessageButton = currentUser?._id !== user._id

    return (
      <div className={classNames("page", "users-profile", classes.profilePage)}>
        <HeadTags
          description={metaDescription}
          noIndex={(!user.postCount && !user.commentCount) || user.karma <= 0 || user.noindex}
          structuredData={getUserStructuredData(user)}
          image={user.profileImageId && `https://res.cloudinary.com/cea/image/upload/c_crop,g_custom,q_auto,f_auto/${user.profileImageId}.jpg`}
        />
        <AnalyticsContext pageContext={"userPage"}>
          {/* Bio Section */}
          <SingleColumnSection>
            <div className={classNames(classes.usernameTitle, {
              [classes.deletedUserName]: user.deleted
            })}>
              {username}
            </div>
            {user.deleted && "(account deleted)"}
            <Typography variant="body2" className={classes.userInfo}>
              { renderMeta() }
              { currentUser?.isAdmin &&
                <div>
                  <LWTooltip title="Click to copy userId" placement="right">
                    <CopyToClipboard text={user._id} onCopy={()=>flash({messageString:"userId copied!"})}>
                      <CopyIcon className={classes.copyIcon} />
                    </CopyToClipboard>
                  </LWTooltip>
                </div>
              }
              { currentUser?.isAdmin &&
                <div>
                  <DialogGroup
                    actions={[]}
                    trigger={<a>Register RSS</a>}
                  >
                    <div><NewFeedButton user={user} /></div>
                  </DialogGroup>
                </div>
              }
              { currentUser && currentUser._id === user._id && <Link to="/manageSubscriptions">
                {preferredHeadingCase("Manage Subscriptions")}
              </Link>}
              { showMessageButton && <NewConversationButton user={user} currentUser={currentUser}>
                <a>Message</a>
              </NewConversationButton> }
              { showMessageButton && (
                <div
                  className={classes.subscribeButton}
                  onClick={() => openDialog({ 
                    name: "NewDialogueDialog", 
                    contents: ({onClose}) => <NewDialogueDialog
                      onClose={onClose}
                      initialParticipantIds={[user._id]}
                    />
                  })}
                >
                  <a>Dialogue</a>
                </div>
              )}
              { <UserNotifyDropdown 
                user={user} 
                popperPlacement="bottom-end"
                className={classes.subscribeButton} 
              /> }
              {userCanEditUser(currentUser, user) && <Link to={userGetEditUrl(user)}>
                {preferredHeadingCase("Account Settings")}
              </Link>}
            </Typography>

            {user.htmlBio && <ContentStyles contentType="post">
              <ContentItemBody className={classes.bio} dangerouslySetInnerHTML={{__html: user.htmlBio }} description={`user ${user._id} bio`} nofollow={(user.karma || 0) < nofollowKarmaThreshold.get()}/>
            </ContentStyles>}
          </SingleColumnSection>

          <SingleColumnSection>
            <SunshineNewUsersProfileInfo userId={user._id} />
          </SingleColumnSection>

          {/* Sequences Section */}
          { displaySequenceSection(ownPage, user) && <SingleColumnSection>
            <SectionTitle title="Sequences">
              {ownPage && <SequencesNewButton />}
            </SectionTitle>
            <SequencesGridWrapper
                terms={ownPage ? sequenceAllTerms : sequenceTerms}
                showLoadMore={true}/>
          </SingleColumnSection> }

          {/* Drafts Section */}
          { ownPage && <SingleColumnSection>
            <AnalyticsContext listContext={"userPageDrafts"}>
              <DraftsList limit={5}/>
              <PostsList2 hideAuthor showDraftTag={false} terms={unlistedTerms} showNoResults={false} showLoading={false} showLoadMore={false}/>
            </AnalyticsContext>
            {hasEventsSetting.get() && <LocalGroupsList
              terms={{view: 'userInactiveGroups', userId: currentUser?._id}}
              showNoResults={false}
            />}
          </SingleColumnSection> }
          {/* AF Submissions Section */}
          {ownPage && nonAFMember && <SingleColumnSection>
            <LWTooltip inlineBlock={false} title="Your posts are pending approval to the Alignment Forum and are only visible to you on the Forum. 
            They are visible to everyone on LessWrong.">
              <SectionTitle title="My Submissions"/>
            </LWTooltip>
            <PostsList2 hideAuthor showDraftTag={false} terms={afSubmissionTerms}/>
          </SingleColumnSection>
          }
          {/* Posts Section */}
          <SingleColumnSection>
            <div className={classes.postsTitle} onClick={() => setShowSettings(!showSettings)}>
              <SectionTitle title={"Posts"}>
                <SettingsButton label={`Sorted by ${ SORT_ORDER_OPTIONS[currentPostSortingMode].label }`}/>
              </SectionTitle>
            </div>
            {showSettings && <PostsListSettings
              hidden={false}
              currentSorting={currentPostSortingMode}
              currentFilter={currentFilter}
              currentShowLowKarma={currentShowLowKarma}
              currentIncludeEvents={currentIncludeEvents}
            />}
            <AnalyticsContext listContext={"userPagePosts"}>
              {user.shortformFeedId && <ProfileShortform user={user}/>}
              <PostsList2 terms={postTerms} hideAuthor />
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
              <LWTooltip inlineBlock={false } title="Your comments are pending approval to the Alignment Forum and are only visible to you on the Forum. 
              They are visible to everyone on LessWrong.">
                <SectionTitle title={"Comment Submissions"} />
              </LWTooltip>
              <RecentComments terms={{view: 'afSubmissions', authorIsUnreviewed: null, limit: 5, userId: user._id}} />
            </SingleColumnSection>}
            <SingleColumnSection>
              <SectionTitle title={<Link to={`${userGetProfileUrl(user)}/replies`}>Comments</Link>} rootClassName={classes.commentSorting}>
                <AnalyticsContext pageElementContext='userProfileCommentSort'>
                  Sorted by <CommentsSortBySelector setRestoreScrollPos={setRestoreScrollPos} />
                </AnalyticsContext>
              </SectionTitle>
              <RecentComments
                terms={{view: 'profileComments', sortBy: currentCommentSortBy, authorIsUnreviewed: null, limit: 10, userId: user._id}}
                showPinnedOnProfile
              />
            </SingleColumnSection>
          </AnalyticsContext>

          <ReportUserButton user={user}/>
        </AnalyticsContext>
      </div>
    )
  }

  return render();
}

export default registerComponent(
  'UsersProfile', UsersProfileFn, {styles}
);


