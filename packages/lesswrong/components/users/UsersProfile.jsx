import { Components, replaceComponent, registerComponent, ModalTrigger , withCurrentUser} from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Link, withRouter } from 'react-router';
import Users from "meteor/vulcan:users";
import FontIcon from 'material-ui/FontIcon';


const iconStyle = {
  color: 'rgba(0,0,0,0.5)',
  fontSize: '18px',
  verticalAlign: 'sub',
  marginRight: '3px'
}

const UsersProfile = (props) => {
  if (props.loading) {

    return <div className="page users-profile"><Components.Loading/></div>

  } else if (props.document && props.document._id) {
    const user = props.document;
    const query = _.clone(props.router.location.query || {});

    const draftTerms = {view: "drafts", userId: user._id }
    const terms = {view: "new", ...query, userId: user._id};
    const topTerms = {view: "top", userId: user._id, limit: 3};

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
        <div title="Karma" className="users-profile-header-meta-karma">
          <FontIcon className="material-icons" style={iconStyle}>star</FontIcon>
          {karma || 0}
        </div>
        <div title="Posts" className="users-profile-header-meta-post-count">
          <FontIcon className="material-icons" style={iconStyle}>description</FontIcon>
          {postCount || 0}
        </div>
        <div title="Comments" className="users-profile-header-meta-comment-count">
          <FontIcon className="material-icons" style={iconStyle}>message</FontIcon>
          {commentCount || 0}
        </div>
      </div>
    }

    const renderUserProfileHeader = (props) => {
      return (
        <Components.Section title="User Profile" titleComponent={ renderMeta(props) }>
          { props.document.bio &&
            <div className="content-body">
              <div className="users-profile-bio">
                <p>{ props.document.bio }</p>
              </div>
            </div>}
          { renderActions(props) }
        </Components.Section>
      )
    }
    const renderDrafts = (props) => {
      return (
        <div>
          { props.currentUser && props.currentUser._id === user._id &&
            <Components.Section title="My Drafts"
              titleComponent= {
                <div className="recent-posts-title-component users-profile-drafts">
                <div className="new-post-link"><Link to={"/newPost"}> new blog post </Link></div>
                </div>
              }
            >
              <Components.PostsList terms={draftTerms} showHeader={false}/>
            </Components.Section>
          }
        </div>
      )
    }

    const renderBlogPosts = (props) => {
      return (
        <Components.Section title="Recent Blog Posts"
          titleComponent= {
          <div className="recent-posts-title-component users-profile-recent-posts">
            <Components.SearchForm/>
            sorted by<br /> <Components.PostsViews />
          </div>}
        >
          <Components.PostsList terms={terms} showHeader={false} />
        </Components.Section>
      )
    }

    return (
      <div className="page users-profile">
        <div className="users-profile-header">{ renderUserProfileHeader(props) }</div>

        { renderDrafts(props) }
        { renderBlogPosts(props) }
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
