import { Components, registerComponent, withList, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Link } from 'react-router-dom';
import { withLocation, withNavigation } from '../../lib/routeUtil';
import Users from "meteor/vulcan:users";
import StarIcon from '@material-ui/icons/Star'
import DescriptionIcon from '@material-ui/icons/Description'
import MessageIcon from '@material-ui/icons/Message'
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import { postBodyStyles } from '../../themes/stylePiping'

export const sectionFooterLeftStyles = {
  flexGrow: 1,
  display: "flex",
  '&:after': {
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
  meta: sectionFooterLeftStyles,
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
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    ...postBodyStyles(theme)
  },
  primaryColor: {
    color: theme.palette.primary.light
  },
  title: {
    cursor: "pointer",
    '&:hover $settingsIcon, &:hover $settingsText': {
      color: theme.palette.grey[800]
    }
  },
  settingsText: {
    marginLeft: theme.spacing.unit,
    fontStyle: "italic",
    display: "inline-block",
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    color: theme.palette.grey[700]
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

export const getUserFromResults = (results) => {
  // HOTFIX: Filtering out invalid users
  return results?.find(user => !!user.displayName) || results?.[0]
}

class UsersProfile extends Component {
  state = {
    showSettings: false
  }

  componentDidMount() {
    const { results } = this.props
    const document = getUserFromResults(results)
    if (document) {
      this.setCanonicalUrl()
    }
  }

  componentDidUpdate({results: previousResults}) {
    const { results } = this.props
    const oldDocument = getUserFromResults(previousResults)
    const newDocument = getUserFromResults(results)
    if (oldDocument?.slug !== newDocument?.slug) {
      this.setCanonicalUrl()
    }
  }

  setCanonicalUrl = () => {
    const { history, results, slug } = this.props
    const document = getUserFromResults(results)
    // Javascript redirect to make sure we are always on the most canonical URL for this user
    if (slug !== document?.slug) {
      const canonicalUrl = Users.getProfileUrlFromSlug(document.slug);
      history.replace(canonicalUrl);
    }
  }

  displaySequenceSection = (canEdit, user)  => {
    if (getSetting('forumType') === 'AlignmentForum') {
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
    const userPostCount = getSetting('forumType') !== 'AlignmentForum' ? postCount || 0 : afPostCount || 0
    const userCommentCount = getSetting('forumType') !== 'AlignmentForum' ? commentCount || 0 : afCommentCount || 0

      return <div className={classes.meta}>

        { getSetting('forumType') !== 'AlignmentForum' && <Tooltip title={`${userKarma} karma`}>
          <span className={classes.userMetaInfo}>
            <StarIcon className={classNames(classes.icon, classes.specificalz)}/>
            <Components.MetaInfo title="Karma">
              {userKarma}
            </Components.MetaInfo>
          </span>
        </Tooltip>}

        {!!userAfKarma && <Tooltip title={`${userAfKarma} karma${(getSetting('forumType') !== 'AlignmentForum') ? " on alignmentforum.org" : ""}`}>
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
    const document = getUserFromResults(results)
    if (loading) {
      return <div className={classNames("page", "users-profile", classes.profilePage)}>
        <Components.Loading/>
      </div>
    }

    if (!document || !document._id || document.deleted) {
      //eslint-disable-next-line no-console
      console.error(`// missing user (_id/slug: ${slug})`);
      return <Components.Error404/>
    }

    const { SingleColumnSection, SectionTitle, SequencesNewButton, PostsListSettings, PostsList2, SectionFooter, NewConversationButton, SubscribeTo, DialogGroup, SectionButton, SettingsIcon } = Components

    const user = document;

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

    return (
      <div className={classNames("page", "users-profile", classes.profilePage)}>
        {/* Bio Section */}
        <SingleColumnSection>
          <SectionTitle title={Users.getDisplayName(user)}/>

          <SectionFooter>
            { this.renderMeta() }
            { user.twitterUsername &&  <a href={"http://twitter.com/" + user.twitterUsername}>
              @{user.twitterUsername}
            </a>}
            { currentUser && currentUser.isAdmin &&
              <div>
                <DialogGroup
                  actions={[]}
                  trigger={<span>Register RSS Feed</span>}
                >
                  <div><Components.newFeedButton user={user} /></div>
                </DialogGroup>
              </div>
            }
            { currentUser && currentUser._id != user._id && <NewConversationButton user={user}>
              <a>Send Message</a>
            </NewConversationButton>}
            { currentUser && currentUser._id !== user._id && <SubscribeTo document={user} /> }
            {Users.canEdit(currentUser, user) && <Link to={Users.getEditUrl(user)}>
              <FormattedMessage id="users.edit_account"/>
            </Link>}
          </SectionFooter>

          { user.bio && <div className={classes.bio} dangerouslySetInnerHTML={{__html: user.htmlBio }} /> }

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
          <Components.PostsList2 terms={draftTerms}/>
          <Components.PostsList2 terms={unlistedTerms} showNoResults={false} showLoading={false} showLoadMore={false}/>
        </SingleColumnSection> }

        {/* Posts Section */}
        <SingleColumnSection>
          <div className={classes.title} onClick={() => this.setState({showSettings: !showSettings})}>
            <SectionTitle title={`${Users.getDisplayName(user)}'s Posts`}>
              <SettingsIcon/>
              <div className={classes.settingsText}>Sorted by { sortings[currentSorting] }</div>
            </SectionTitle>
          </div>
          {showSettings && <PostsListSettings
            hidden={false}
            currentSorting={currentSorting}
            currentFilter={currentFilter}
            currentShowLowKarma={true}
            sortings={sortings}
          />}
          <PostsList2 terms={terms} />
        </SingleColumnSection>

        {/* Comments Sections */}
        <SingleColumnSection>
          <SectionTitle title={`${Users.getDisplayName(user)}'s Comments`} />
          <Components.RecentComments terms={{view: 'allRecentComments', authorIsUnreviewed: null, limit: 10, userId: user._id}} fontSize="small" />
        </SingleColumnSection>
      </div>
    )
  }
}


const options = {
  collection: Users,
  queryName: 'usersSingleQuery',
  fragmentName: 'UsersProfile',
  enableTotal: false,
  ssr: true
};

registerComponent('UsersProfile', UsersProfile, withUser, [withList, options], withLocation, withNavigation, withStyles(styles, {name: "UsersProfile"}));
