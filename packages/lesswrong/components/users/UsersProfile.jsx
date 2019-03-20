import { Components, registerComponent, withDocument, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Link, withRouter } from 'react-router';
import Users from "meteor/vulcan:users";
import StarIcon from '@material-ui/icons/Star'
import DescriptionIcon from '@material-ui/icons/Description'
import MessageIcon from '@material-ui/icons/Message'
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import withUser from '../common/withUser';

const styles = theme => ({
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
  // Dark Magick
  // https://giphy.com/gifs/psychedelic-art-phazed-12GGadpt5aIUQE
  specificalz: {}
})

const UsersProfile = (props) => {
  if (props.loading) {

    return <div className="page users-profile"><Components.Loading/></div>

  } else if (props.document && props.document._id && !props.document.deleted) {
    const user = props.document;
    const query = _.clone(props.router.location.query || {});

    const draftTerms = {view: "drafts", userId: user._id, limit: 4}
    const unlistedTerms= {view: "unlisted", userId: user._id, limit: 4}
    const terms = {view: "userPosts", ...query, userId: user._id, authorIsUnreviewed: null};
    const sequenceTerms = {view: "userProfile", userId: user._id, limit:3}
    const sequenceAllTerms = {view: "userProfileAll", userId: user._id, limit:3}


    const renderActions = (props) => {
      const { currentUser } = props
      const user = props.document;

      return (<div className="users-profile-actions">
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

    const renderMeta = (props) => {
      const { classes } = props
      const { karma, postCount, commentCount, afPostCount, afCommentCount, afKarma } = props.document;

      return <div className={classes.meta}>
        { !getSetting('AlignmentForum', false) && <StarIcon className={classNames(classes.icon, classes.specificalz)}/>}
        { !getSetting('AlignmentForum', false) && <Components.MetaInfo title="Karma">
          {karma || 0}
        </Components.MetaInfo>}
        { !!afKarma && <Components.OmegaIcon className={classNames(classes.icon, classes.specificalz)}/>}
        { !!afKarma && <Components.MetaInfo title="Alignment Karma">
            {afKarma}
          </Components.MetaInfo>
        }
        <DescriptionIcon className={classNames(classes.icon, classes.specificalz)}/>
        <Components.MetaInfo title="Posts">
          { !getSetting('AlignmentForum', false) ? postCount || 0 : afPostCount || 0}
        </Components.MetaInfo>
        <MessageIcon className={classNames(classes.icon, classes.specificalz)}/>
        <Components.MetaInfo title="Comments">
          { !getSetting('AlignmentForum', false) ? commentCount || 0 : afCommentCount || 0}
        </Components.MetaInfo>
      </div>
    }

    const renderUserProfileHeader = (props) => {
      return (
        <Components.Section title="User Profile" titleComponent={ renderMeta(props) }>
          { user.bio &&
            <div className="content-body">
              <div className="users-profile-bio">
                <p>{ user.bio }</p>
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
                  <Components.SectionSubtitle><Link to={"/newPost"}> new blog post </Link></Components.SectionSubtitle>
                </div>
              }
            >
              <Components.PostsList2 terms={draftTerms}/>
              <Components.PostsList2 terms={unlistedTerms} showNoResults={false} showLoading={false}/>
            </Components.Section>
          }
        </div>
      )
    }

    const renderBlogPosts = (props) => {
      return (
        <Components.Section title={`${user.displayName}'s Posts`}
          titleComponent={
            <div className="recent-posts-title-component users-profile-recent-posts">
              <Components.PostsViews defaultView="community" hideDaily={true}/>
            </div>}
        >
          <Components.PostsList2 terms={terms} />
        </Components.Section>
      )
    }

    const displaySequenceSection = (canEdit, user)  => {
      if (getSetting('AlignmentForum', false)) {
          return ((canEdit && user.afSequenceDraftCount) || user.afSequenceCount) || (!canEdit && user.afSequenceCount)
      } else {
          return ((canEdit && user.sequenceDraftCount) || user.sequenceCount) || (!canEdit && user.sequenceCount)
      }
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
        <Components.Section title={`${user.displayName}'s Comments`} >
          <Components.RecentComments terms={{view: 'allRecentComments', limit: 10, userId: user._id}} fontSize="small" />
        </Components.Section>
      </div>
    )
  } else {
    //eslint-disable-next-line no-console
    console.error(`// missing user (_id/slug: ${props.documentId || props.slug})`);
    return <Components.Error404/>
  }
}

UsersProfile.propTypes = {
  // document: PropTypes.object.isRequired,
}

UsersProfile.displayName = "UsersProfile";

const options = {
  collection: Users,
  queryName: 'usersSingleQuery',
  fragmentName: 'UsersProfile',
};

registerComponent('UsersProfile', UsersProfile, withUser, [withDocument, options], withRouter, withStyles(styles, {name: "UsersProfile"}));
