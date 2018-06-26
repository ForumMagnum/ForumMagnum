import { Components, replaceComponent, registerComponent } from 'meteor/vulcan:core';
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

    const draftTerms = {view: "drafts", userId: user._id, limit: 4}
    const unlistedTerms= {view: "unlisted", userId: user._id }
    const terms = {view: "new", ...query, userId: user._id};
    const sequenceTerms = {view: "userProfile", userId: user._id, limit:3}
    const sequenceAllTerms = {view: "userProfileAll", userId: user._id, limit:3}

    const renderActions = (props) => {
      const user = props.document;
      return (<div className="users-profile-actions">
        { user.twitterUsername && <div><a href={"http://twitter.com/" + user.twitterUsername}>@{user.twitterUsername}</a></div> }
        {props.currentUser && props.currentUser.isAdmin && <Components.ModalTrigger label="Register new RSS Feed">
          <div><Components.newFeedButton user={user} /></div>
        </Components.ModalTrigger>}
        <Components.ShowIf check={Users.options.mutations.edit.check} document={user}>
          <div><Link to={Users.getEditUrl(user)}><FormattedMessage id="users.edit_account"/></Link></div>
        </Components.ShowIf>
        { props.currentUser && props.currentUser._id != user._id && <div><Components.NewConversationButton user={user}> <a>Send a message</a> </Components.NewConversationButton></div> }
        { props.currentUser && props.currentUser._id !== user._id && <div><Components.SubscribeTo document={user} /></div> }
      </div>)
    }

    const renderMeta = (props) => {
      const {karma, postCount, commentCount, afKarma} = props.document;
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
        <div title="Comments" className="users-profile-header-meta-comment-count">
          AF 
          {afKarma || 0}
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
              <Components.PostsList terms={unlistedTerms} showHeader={false} showNoResults={false}/>
            </Components.Section>
          }
        </div>
      )
    }

    const renderBlogPosts = (props) => {
      return (
        <Components.Section title="Recent Posts"
          titleComponent= {
            <div className="recent-posts-title-component users-profile-recent-posts">
              <Components.PostsViews defaultView="community" hideDaily={true}/>
            </div>}
        >
          <Components.PostsList terms={terms} showHeader={false} />
        </Components.Section>
      )
    }

    const displaySequenceSection = (canEdit, user)  => {
      return (canEdit && user.sequenceDraftCount || user.sequenceCount) || (!canEdit && user.sequenceCount)
    }

    const renderSequences = (props) => {
      const canEdit = props.currentUser && props.currentUser._id === user._id
      if (displaySequenceSection(canEdit, user)) {
        return (
          <Components.Section title="Sequences"
            titleComponent= {canEdit &&
              <div className="recent-posts-title-component users-profile-drafts">
                <div className="new-sequence-link"><Link to={"/sequencesnew"}> new sequence </Link></div>
              </div>}
          >
            <Components.SequencesGridWrapper
              terms={canEdit ? sequenceAllTerms : sequenceTerms}
              showLoadMore={true}
            className="books-sequences-grid-list" />
          </Components.Section>
        )
      }
    }
    return (
      <div className="page users-profile">
        <div className="users-profile-header">{ renderUserProfileHeader(props) }</div>

        { renderSequences(props) }
        { renderDrafts(props) }
        { renderBlogPosts(props) }
        <Components.Section title="Recent Comments" >
          <Components.RecentComments terms={{view: 'allRecentComments', limit: 10, userId: user._id}} fontSize="small" />
        </Components.Section>
      </div>
    )
  } else {
    //eslint-disable-next-line no-console
    console.error(`// missing user (_id/slug: ${props.documentId || props.slug})`);
    return <div className="page users-profile"><FormattedMessage id="app.404"/></div>
  }
}

UsersProfile.propTypes = {
  // document: PropTypes.object.isRequired,
}

UsersProfile.displayName = "UsersProfile";

replaceComponent('UsersProfile', UsersProfile, withRouter);
