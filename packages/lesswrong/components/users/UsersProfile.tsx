import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React, { useState } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { userCanEdit, userGetDisplayName, userGetProfileUrlFromSlug } from "../../lib/collections/users/helpers";
import { userGetEditUrl } from '../../lib/vulcan-users/helpers';
import { DEFAULT_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import StarIcon from '@material-ui/icons/Star'
import DescriptionIcon from '@material-ui/icons/Description'
import MessageIcon from '@material-ui/icons/Message'
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import { postBodyStyles } from '../../themes/stylePiping'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting, hasEventsSetting, siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { separatorBulletStyles } from '../common/SectionFooter';
import { taglineSetting } from '../common/HeadTags';

export const sectionFooterLeftStyles = {
  flexGrow: 1,
  display: "flex",
  '&&:after': {
    content: '""'
  }
}

const styles = (theme: ThemeType): JssStyles => ({
  profilePage: {
    marginLeft: "auto",
    [theme.breakpoints.down('sm')]: {
      margin: 0,
    }
  },
  usernameTitle: {
    fontSize: "3rem",
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    marginTop: 0
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
      color: 'rgba(0,0,0,0.5)',
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
    ...postBodyStyles(theme)
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
  }
})

const sortings: Partial<Record<string,string>> = {
  magic: "Magic (New & Upvoted)",
  recentComments: "Recent Comments",
  new: "New",
  old: "Old",
  top: "Top"
}

export const getUserFromResults = <T extends UsersMinimumInfo>(results: Array<T>|null): T|null => {
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
    const { karma, postCount, commentCount, afPostCount, afCommentCount, afKarma } = document;

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
      </div>
  }

  const { query } = useLocation();
  
  const render = () => {
    const user = getUserFromResults(results)
    const { SingleColumnSection, SectionTitle, SequencesNewButton, PostsListSettings, PostsList2, NewConversationButton, SubscribeTo, DialogGroup, SectionButton, SettingsButton, ContentItemBody, Loading, Error404, PermanentRedirect, HeadTags, Typography } = Components
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


    const draftTerms: PostsViewTerms = {view: "drafts", userId: user._id, limit: 4, sortDrafts: currentUser?.sortDrafts || "modifiedAt" }
    const unlistedTerms: PostsViewTerms = {view: "unlisted", userId: user._id, limit: 20}
    const terms: PostsViewTerms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null};
    const sequenceTerms: SequencesViewTerms = {view: "userProfile", userId: user._id, limit:9}
    const sequenceAllTerms: SequencesViewTerms = {view: "userProfileAll", userId: user._id, limit:9}

    // maintain backward compatibility with bookmarks
    const currentSorting = query.sortedBy || query.view ||  "new"
    const currentFilter = query.filter ||  "all"
    const ownPage = currentUser?._id === user._id
    const currentShowLowKarma = (parseInt(query.karmaThreshold) !== DEFAULT_LOW_KARMA_THRESHOLD)
    
    const username = userGetDisplayName(user)
    const metaDescription = `${username}'s profile on ${siteNameWithArticleSetting.get()} — ${taglineSetting.get()}`

    return (
      <div className={classNames("page", "users-profile", classes.profilePage)}>
        <HeadTags
          description={metaDescription}
        />
        <AnalyticsContext pageContext={"userPage"}>
          {/* Bio Section */}
          <SingleColumnSection>
            <div className={classes.usernameTitle}>{username}</div>
            <Typography variant="body2" className={classes.userInfo}>
              { renderMeta() }
              { currentUser?.isAdmin &&
                <div>
                  <DialogGroup
                    actions={[]}
                    trigger={<span>Register RSS</span>}
                  >
                    { /*eslint-disable-next-line react/jsx-pascal-case*/ }
                    <div><Components.newFeedButton user={user} /></div>
                  </DialogGroup>
                </div>
              }
              { currentUser && currentUser._id === user._id && <Link to="/manageSubscriptions">
                Manage Subscriptions
              </Link>}
              { currentUser && currentUser._id != user._id && <NewConversationButton user={user} currentUser={currentUser}>
                <a>Message</a>
              </NewConversationButton>}
              { currentUser && currentUser._id !== user._id && <SubscribeTo
                document={user}
                subscribeMessage="Subscribe to posts"
                unsubscribeMessage="Unsubscribe from posts"
              /> }
              {userCanEdit(currentUser, user) && <Link to={userGetEditUrl(user)}>
                Edit Account
              </Link>}
            </Typography>

            { user.bio && <ContentItemBody className={classes.bio} dangerouslySetInnerHTML={{__html: user.htmlBio }} description={`user ${user._id} bio`} /> }
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
              <Components.PostsList2 hideAuthor terms={draftTerms}/>
              <Components.PostsList2 hideAuthor terms={unlistedTerms} showNoResults={false} showLoading={false} showLoadMore={false}/>
            </AnalyticsContext>
            {hasEventsSetting.get() && <Components.LocalGroupsList terms={{view: 'userInactiveGroups', userId: currentUser?._id}} />}
          </SingleColumnSection> }
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
              sortings={sortings}
            />}
            <AnalyticsContext listContext={"userPagePosts"}>
              <PostsList2 terms={terms} hideAuthor />
            </AnalyticsContext>
          </SingleColumnSection>

          {/* Comments Sections */}
          <AnalyticsContext pageSectionContext="commentsSection">
            <SingleColumnSection>
              <SectionTitle title={"Comments"} />
              <Components.RecentComments terms={{view: 'allRecentComments', authorIsUnreviewed: null, limit: 10, userId: user._id}} />
            </SingleColumnSection>
          </AnalyticsContext>
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
