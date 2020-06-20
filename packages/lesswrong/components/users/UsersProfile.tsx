import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withMulti } from '../../lib/crud/withMulti';
import React, { Component } from 'react';
import { FormattedMessage } from '../../lib/vulcan-i18n';
import { Link } from '../../lib/reactRouterWrapper';
import { withLocation, withNavigation } from '../../lib/routeUtil';
import Users from "../../lib/collections/users/collection";
import { DEFAULT_LOW_KARMA_THRESHOLD } from '../../lib/collections/posts/views'
import StarIcon from '@material-ui/icons/Star'
import DescriptionIcon from '@material-ui/icons/Description'
import MessageIcon from '@material-ui/icons/Message'
import classNames from 'classnames';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import { postBodyStyles } from '../../themes/stylePiping'
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';
import { hasEventsSetting } from '../../lib/publicSettings';
import Typography from '@material-ui/core/Typography';
import { separatorBulletStyles } from '../common/SectionFooter';

export const sectionFooterLeftStyles = {
  flexGrow: 1,
  display: "flex",
  '&&:after': {
    content: '""'
  }
}

const styles = theme => ({
  profilePage: {
    marginLeft: "auto",
    [theme.breakpoints.down('sm')]: {
      margin: 0,
    }
  },
  headerSection: {
    background: "white",
    marginLeft: -20,
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: -10,
    paddingBottom: 15,
    marginRight: -14,
    paddingTop: 20
  },
  usernameTitle: {
    fontSize: "3rem",
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    marginTop: 0
  },
  userInfo: {
    display: "flex",
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

const sortings = {
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

interface ExternalProps {
  terms: any,
  slug: string,
}
interface UsersProfileProps extends ExternalProps, WithUserProps, WithStylesProps, WithLocationProps, WithNavigationProps {
  loading: boolean,
  results: Array<UsersProfile>|null,
}
interface UsersProfileState {
  showSettings: boolean,
}

class UsersProfileClass extends Component<UsersProfileProps,UsersProfileState> {
  state: UsersProfileState = {
    showSettings: false
  }

  displaySequenceSection = (canEdit, user)  => {
    if (forumTypeSetting.get() === 'AlignmentForum') {
        return !!((canEdit && user.afSequenceDraftCount) || user.afSequenceCount) || !!(!canEdit && user.afSequenceCount)
    } else {
        return !!((canEdit && user.sequenceDraftCount) || user.sequenceCount) || !!(!canEdit && user.sequenceCount)
    }
  }

  renderMeta = () => {
    const { classes, results } = this.props
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

  render() {
    const { slug, classes, currentUser, loading, results, location } = this.props;
    const { query } = location;
    const user = getUserFromResults(results)
    const { SingleColumnSection, SectionTitle, SequencesNewButton, PostsListSettings, PostsList2, SectionFooter, NewConversationButton, SubscribeTo, DialogGroup, SectionButton, SettingsIcon, ContentItemBody, Loading, Error404, PermanentRedirect } = Components
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
      return <PermanentRedirect url={Users.getProfileUrlFromSlug(user.slug)} />
    }

    // Does this profile page belong to a likely-spam account?
    if (user.spamRiskScore < 0.4) {
      if (currentUser?._id === user._id) {
        // Logged-in spammer can see their own profile
      } else if (currentUser && Users.canDo(currentUser, 'posts.moderate.all')) {
        // Admins and sunshines can see spammer's profile
      } else {
        // Anyone else gets a 404 here
        // eslint-disable-next-line no-console
        console.log(`Not rendering profile page for account with poor spam risk score: ${user.displayName}`);
        return <Components.Error404/>
      }
    }

    const draftTerms = {view: "drafts", userId: user._id, limit: 4}
    const unlistedTerms= {view: "unlisted", userId: user._id, limit: 20}
    const terms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null};
    const sequenceTerms = {view: "userProfile", userId: user._id, limit:9}
    const sequenceAllTerms = {view: "userProfileAll", userId: user._id, limit:9}

    const { showSettings } = this.state
    // maintain backward compatibility with bookmarks
    const currentSorting = query.sortedBy || query.view ||  "new"
    const currentFilter = query.filter ||  "all"
    const ownPage = currentUser && currentUser._id === user._id
    const currentShowLowKarma = (parseInt(query.karmaThreshold) !== DEFAULT_LOW_KARMA_THRESHOLD)
    
    const username = Users.getDisplayName(user)

    return (
      <div className={classNames("page", "users-profile", classes.profilePage)}>
        <AnalyticsContext pageContext={"userPage"}>
          {/* Bio Section */}
          <SingleColumnSection>
            <div className={classes.usernameTitle}>{username}</div>
            <Typography variant="body2" className={classes.userInfo}>
              { this.renderMeta() }
              { currentUser?.isAdmin &&
                <div>
                  <DialogGroup
                    actions={[]}
                    trigger={<span>Register RSS</span>}
                  >
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
              {Users.canEdit(currentUser, user) && <Link to={Users.getEditUrl(user)}>
                <FormattedMessage id="users.edit_account"/>
              </Link>}
            </Typography>

            { user.bio && <ContentItemBody className={classes.bio} dangerouslySetInnerHTML={{__html: user.htmlBio }} description={`user ${user._id} bio`} /> }
          </SingleColumnSection>

          {/* Sequences Section */}
          { this.displaySequenceSection(ownPage, user) && <SingleColumnSection>
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
            <div className={classes.title} onClick={() => this.setState({showSettings: !showSettings})}>
              <SectionTitle title={"Posts"}>
                <SettingsIcon label={`Sorted by ${ sortings[currentSorting]}`}/>
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
}

const UsersProfileComponent = registerComponent<ExternalProps>(
  'UsersProfile', UsersProfileClass, {
    styles,
    hocs: [
      withUser,
      withMulti({
        collection: Users,
        fragmentName: 'UsersProfile',
        enableTotal: false,
        ssr: true
      }),
      withLocation, withNavigation,
    ]
  }
);

declare global {
  interface ComponentTypes {
    UsersProfile: typeof UsersProfileComponent
  }
}
