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
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  profilePage: {
    marginLeft: "auto",
    [theme.breakpoints.down('sm')]: {
      margin: 0,
    }
  },
  meta: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.up('md')]: {
      justifyContent: "flex-end",
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
    margin: 0,
    paddingBottom: 10,
    paddingLeft: 20,
  
    "& p": {
      fontSize: 16,
      lineHeight: "26px",
    }
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
    '&:hover $settingsIcon, &:hover $sortedBy': {
      color: theme.palette.grey[800]
    }
  },
  sortedBy: {
    fontStyle: "italic",
    display: "inline-block"
  },
  // Dark Magick
  // https://giphy.com/gifs/psychedelic-art-phazed-12GGadpt5aIUQE
  specificalz: {}
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
        return ((canEdit && user.afSequenceDraftCount) || user.afSequenceCount) || (!canEdit && user.afSequenceCount)
    } else {
        return ((canEdit && user.sequenceDraftCount) || user.sequenceCount) || (!canEdit && user.sequenceCount)
    }
  }

  renderActions = () => {
    const props = this.props
    const { currentUser, classes } = props
      const user = props.document;

      return (<div className={classes.actions}>
        { user.twitterUsername && <div><a href={"http://twitter.com/" + user.twitterUsername}>@{user.twitterUsername}</a></div> }
        { props.currentUser && props.currentUser.isAdmin &&
            <Components.DialogGroup
              actions={[]}
              trigger={<Components.SectionSubtitle>Register new RSS Feed</Components.SectionSubtitle>}
            >
              <div><Components.newFeedButton user={user} /></div>
            </Components.DialogGroup>
        }
        {Users.canEdit(currentUser, user) &&
          <Components.SectionSubtitle><Link to={Users.getEditUrl(user)}><FormattedMessage id="users.edit_account"/></Link></Components.SectionSubtitle>
        }
        { props.currentUser && props.currentUser._id != user._id && <Components.SectionSubtitle><Components.NewConversationButton user={user}> <a>Send a message</a> </Components.NewConversationButton></Components.SectionSubtitle> }
        { props.currentUser && props.currentUser._id !== user._id && <Components.SectionSubtitle><Components.SubscribeTo document={user} /></Components.SectionSubtitle> }
      </div>)
  }

  renderMeta = () => {
    const props = this.props
    const { classes } = props
    const { karma, postCount, commentCount, afPostCount, afCommentCount, afKarma } = props.document;

      return <div className={classes.meta}>
        { getSetting('forumType') !== 'AlignmentForum' && <StarIcon className={classNames(classes.icon, classes.specificalz)}/>}
        { getSetting('forumType') !== 'AlignmentForum' && <Components.MetaInfo title="Karma">
          {karma || 0}
        </Components.MetaInfo>}
        { !!afKarma && <Components.OmegaIcon className={classNames(classes.icon, classes.specificalz)}/>}
        { !!afKarma && <Components.MetaInfo title="Alignment Karma">
            {afKarma}
          </Components.MetaInfo>
        }
        <DescriptionIcon className={classNames(classes.icon, classes.specificalz)}/>
        <Components.MetaInfo title="Posts">
          { getSetting('forumType') !== 'AlignmentForum' ? postCount || 0 : afPostCount || 0}
        </Components.MetaInfo>
        <MessageIcon className={classNames(classes.icon, classes.specificalz)}/>
        <Components.MetaInfo title="Comments">
          { getSetting('forumType') !== 'AlignmentForum' ? commentCount || 0 : afCommentCount || 0}
        </Components.MetaInfo>
      </div>
  }

  render() {
    const props = this.props
    const { classes } = props;
  
    if (props.loading) {
      return <div className={classNames("page", "users-profile", classes.profilePage)}>
        <Components.Loading/>
      </div>
    }
    
    if (!props.document || !props.document._id || props.document.deleted) {
      //eslint-disable-next-line no-console
      console.error(`// missing user (_id/slug: ${props.documentId || props.slug})`);
      return <Components.Error404/>
    }
    
    const user = props.document;
    const query = _.clone(props.router.location.query || {});

    const draftTerms = {view: "drafts", userId: user._id, limit: 4}
    const unlistedTerms= {view: "unlisted", userId: user._id, limit: 20}
    const terms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null};
    const sequenceTerms = {view: "userProfile", userId: user._id, limit:3}
    const sequenceAllTerms = {view: "userProfileAll", userId: user._id, limit:3}

    const { SingleColumnSection, SectionTitle, SequencesNewButton, AllPostsPageSettings, MetaInfo, PostsList2 } = Components
    const { showSettings } = this.state
    const currentView = query.view ||  "new"
    const currentFilter = query.filter ||  "all"
    const ownPage = props.currentUser && props.currentUser._id === user._id

    return (
      <div className={classNames("page", "users-profile", classes.profilePage)}>
        {/* Bio Section */}
        <SingleColumnSection>
          <SectionTitle title={user.displayName}>
            {this.renderMeta(props)}
          </SectionTitle>
          { user.bio &&
            <div className="content-body">
              <div className={classes.bio}>
                <p>{ user.bio }</p>
              </div>
            </div>}
          { this.renderActions(props) }
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
            <Typography className={classes.primaryColor} variant="body2"><Link to={"/newPost"}> New Blog Post </Link></Typography>
          </SectionTitle>
          <Components.PostsList2 terms={draftTerms}/>
          <Components.PostsList2 terms={unlistedTerms} showNoResults={false} showLoading={false} showLoadMore={false}/>
        </SingleColumnSection> }

        {/* Posts Section */}
        <SingleColumnSection>
          <div className={classes.title} onClick={() => this.setState({showSettings: !showSettings})}>
            <SectionTitle title={`${user.displayName}'s Posts`}>
              <SettingsIcon className={classes.settingsIcon}/>
              <MetaInfo className={classes.sortedBy}>Sorted by { views[currentView] }</MetaInfo>
            </SectionTitle>
          </div>
          {showSettings && <AllPostsPageSettings
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
          <Components.RecentComments terms={{view: 'allRecentComments', limit: 10, userId: user._id}} fontSize="small" />
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
