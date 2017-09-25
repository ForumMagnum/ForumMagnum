import { Components, replaceComponent, registerComponent, ModalTrigger , withCurrentUser} from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Link, withRouter } from 'react-router';
import Users from "meteor/vulcan:users";
import FontIcon from 'material-ui/FontIcon';


const iconStyle = {
  color: 'rgba(0,0,0,0.5)',
  fontSize: '16px',
  verticalAlign: 'sub'
}

const UsersProfile = (props) => {
  if (props.loading) {

    return <div className="page users-profile"><Components.Loading/></div>

  } else if (props.document && props.document._id) {
    const user = props.document;
    const query = _.clone(props.router.location.query || {});

    const frontpageTerms = {view: "top", userId: user._id, frontpage: true}
    const terms = {view: "top", ...query, userId: user._id};

    const renderActions = (props) => {
      const user = props.document;
      return (<div className="users-profile-actions">
        { user.twitterUsername && <div><a href={"http://twitter.com/" + user.twitterUsername}>@{user.twitterUsername}</a></div> }
        { user.website && <div><a href={user.website}>{user.website}</a></div> }
        {props.currentUser && props.currentUser.isAdmin && <ModalTrigger label="Register new RSS Feed">
          <div><Components.newFeedButton user={user} /></div>
        </ModalTrigger>}
        <Components.ShowIf check={Users.options.mutations.edit.check} document={user}>
          <div><Link to={Users.getEditUrl(user)}><FormattedMessage id="users.edit_account"/></Link></div>
        </Components.ShowIf>
        {props.currentUser && props.currentUser._id != user._id && <ModalTrigger label="Send Message" >
          <div><Components.newConversationButton user={user} /></div>
        </ModalTrigger>}
        { props.currentUser && props.currentUser._id !== user._id && <div><Components.SubscribeTo document={user} /></div> }
      </div>)
    }

    const renderMeta = (props) => {
      const {karma, postCount, commentCount} = props.document;
      return <div className="users-profile-header-meta">
        <div className="users-profile-header-meta-karma">
          <FontIcon className="material-icons" style={iconStyle}>star</FontIcon>
          {karma || 0}
        </div>
        <div className="users-profile-header-meta-post-count">
          <FontIcon className="material-icons" style={iconStyle}>description</FontIcon>
          {postCount || 0}
        </div>
        <div className="users-profile-header-meta-comment-count">
          <FontIcon className="material-icons" style={iconStyle}>message</FontIcon>
          {commentCount || 0}
        </div>
      </div>
    }

    return (
      <div className="page users-profile">
        <Components.HeadTags url={Users.getProfileUrl(user, true)} title={Users.getDisplayName(user)} />
        <div className="users-profile-header">
          <Components.Section contentStyle={{marginTop: '-20px'}} title={Users.getDisplayName(user)} titleComponent={<div>{ renderMeta(props) }{ renderActions(props) }</div>}>
            {user.htmlBio ? <div className="users-profile-bio" dangerouslySetInnerHTML={{__html: user.htmlBio}}></div> : null }
          </Components.Section>
        </div>
        {user.frontpagePostCount > 0 && <Components.Section title="Frontpage Posts"
          titleComponent= {
          <div className="recent-posts-title-component users-profile-recent-posts">
          {props.currentUser && props.currentUser._id === user._id && <div className="new-post-link"><Link to={{pathname:"/newPost", query: {frontpage: true} }}> new frontpage post </Link></div>}
          </div>} >
          <Components.PostsList terms={frontpageTerms} showHeader={false} />
        </Components.Section>}
        <Components.Section title="Blog Posts"
          titleComponent= {
          <div className="recent-posts-title-component users-profile-recent-posts">
            <Components.SearchForm/>
            sorted by<br /> <Components.PostsViews />
          {props.currentUser && props.currentUser._id === user._id && <div className="new-post-link"><Link to={"/newPost"}> new blog post </Link></div>}
          </div>} >
          <Components.PostsList terms={terms} showHeader={false} />
        </Components.Section>
        <Components.Section title="Recent Comments" >
          <Components.RecentComments terms={{view: 'recentComments', limit: 10, userId: user._id}} fontSize="small" />
        </Components.Section>
      </div>
    )
  } else {
    console.log(`// missing user (_id/slug: ${props.documentId || props.slug})`);
    return <div className="page users-profile"><FormattedMessage id="app.404"/></div>
  }
}

UsersProfile.propTypes = {
  // document: React.PropTypes.object.isRequired,
}

UsersProfile.displayName = "UsersProfile";

const options = {
  collection: Users,
  queryName: 'usersSingleQuery',
  fragmentName: 'UsersProfile',
};

replaceComponent('UsersProfile', UsersProfile, withCurrentUser, withRouter);
