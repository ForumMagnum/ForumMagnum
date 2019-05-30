import { Components, registerComponent, withDocument, getSetting } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Link, withRouter } from '../../lib/reactRouterWrapper.js';
import Users from "meteor/vulcan:users";
import StarIcon from '@material-ui/icons/Star'
import DescriptionIcon from '@material-ui/icons/Description'
import MessageIcon from '@material-ui/icons/Message'
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import withUser from '../common/withUser';
import SettingsIcon from '@material-ui/icons/Settings';
import Tooltip from '@material-ui/core/Tooltip';
import { postBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  profilePage: {
    marginLeft: "auto",
    [theme.breakpoints.down('sm')]: {
      margin: 0,
    }
  },
  meta: {
    flexGrow: 1,
    display: "flex",
    '&:after': {
      content: '""'
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
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    ...postBodyStyles(theme)
  },
  primaryColor: {
    color: theme.palette.primary.light
  },
  settingsIcon: {
    color: theme.palette.grey[400],
    marginRight: theme.spacing.unit,
  },
  title: {
    cursor: "pointer",
    '&:hover $settingsIcon, &:hover $settingsText': {
      color: theme.palette.grey[800]
    }
  },
  settingsText: {
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

const views = {
  magic: "Magic (New & Upvoted)",
  recentComments: "Recent Comments",
  new: "New",
  old: "Old",
  top: "Top"
}

class UsersProfile extends Component {
  state = {
    showSettings: false
  }

  displaySequenceSection = (canEdit, user)  => {
    if (getSetting('forumType') === 'AlignmentForum') {
        return !!((canEdit && user.afSequenceDraftCount) || user.afSequenceCount) || !!(!canEdit && user.afSequenceCount)
    } else {
        return !!((canEdit && user.sequenceDraftCount) || user.sequenceCount) || !!(!canEdit && user.sequenceCount)
    }
  }

  renderMeta = () => {
    const props = this.props
    const { classes } = props
    const { karma, postCount, commentCount, afPostCount, afCommentCount, afKarma } = props.document;

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
    const { slug, classes, currentUser, loading, document, documentId, router } = this.props;
  
    if (loading) {
      return <div className={classNames("page", "users-profile", classes.profilePage)}>
        <Components.Loading/>
      </div>
    }
    
    if (!document || !document._id || document.deleted) {
      //eslint-disable-next-line no-console
      console.error(`// missing user (_id/slug: ${documentId || slug})`);
      return <Components.Error404/>
    }

    const { SingleColumnSection, SectionTitle, SequencesNewButton, PostsListSettings, PostsList2, SectionFooter, NewConversationButton, SubscribeTo, DialogGroup, SectionButton } = Components
    
    const user = document;
    const query = _.clone(router.location.query || {});

    const draftTerms = {view: "drafts", userId: user._id, limit: 4}
    const unlistedTerms= {view: "unlisted", userId: user._id, limit: 20}
    const terms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null};
    const sequenceTerms = {view: "userProfile", userId: user._id, limit:3}
    const sequenceAllTerms = {view: "userProfileAll", userId: user._id, limit:3}

    const { showSettings } = this.state
    const currentView = query.view ||  "new"
    const currentFilter = query.filter ||  "all"
    const ownPage = currentUser && currentUser._id === user._id

    return (
      <div className={classNames("page", "users-profile", classes.profilePage)}>
        {/* Bio Section */}
        <SingleColumnSection>
          <SectionTitle title={user.displayName}/>

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
            <SectionTitle title={`${user.displayName}'s Posts`}>
              <SettingsIcon className={classes.settingsIcon}/>
              <div className={classes.settingsText}>Sorted by { views[currentView] }</div>
            </SectionTitle>
          </div>
          {showSettings && <PostsListSettings
            hidden={false}
            currentView={currentView}
            currentFilter={currentFilter}
            currentShowLowKarma={true}
            views={views}
          />}
          <PostsList2 terms={terms} />
        </SingleColumnSection>

        {/* Comments Sections */}
        <SingleColumnSection>
          <SectionTitle title={`${user.displayName}'s Comments`} />
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
};

registerComponent('UsersProfile', UsersProfile, withUser, [withDocument, options], withRouter, withStyles(styles, {name: "UsersProfile"}));
