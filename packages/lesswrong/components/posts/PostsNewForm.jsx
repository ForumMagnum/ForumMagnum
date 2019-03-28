import { Components, registerComponent, getFragment, withMessages, getSetting } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import Helmet from 'react-helmet';
import withUser from '../common/withUser'
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
  }
})

const PostsNewForm = ({router, currentUser, flash, classes}) => {
  const { PostSubmit, WrappedSmartForm, AccountsLoginForm } = Components
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  const userHasModerationGuidelines = currentUser && currentUser.moderationGuidelines && currentUser.moderationGuidelines.originalContents
  const prefilledProps = {
    isEvent: router.location.query && router.location.query.eventForm,
    types: router.location.query && router.location.query.ssc ? ['SSC'] : [],
    meta: router.location.query && !!router.location.query.meta,
    frontpageDate: getSetting("AlignmentForum", false) ? new Date() : null,
    af: getSetting("AlignmentForum", false) || (router.location.query && !!router.location.query.af),
    groupId: router.location.query && router.location.query.groupId,
    moderationStyle: currentUser && currentUser.moderationStyle,
    moderationGuidelines: userHasModerationGuidelines ? currentUser.moderationGuidelines : undefined
  }
  const eventForm = router.location.query && router.location.query.eventForm

  if (!Posts.options.mutations.new.check(currentUser)) {
    return (<AccountsLoginForm />);
  }
  const NewPostsSubmit = (props) => {
    return <div className={classes.formSubmit}>
      <PostSubmit {...props} />
    </div>
  }

  return (
    <div className="posts-new-form">
      {prefilledProps.isEvent && <Helmet><script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}/></Helmet>}
      <WrappedSmartForm
        collection={Posts}
        mutationFragment={getFragment('PostsPage')}
        prefilledProps={prefilledProps}
        successCallback={post => {
          router.push({pathname: Posts.getPageUrl(post)});
          flash({ id: 'posts.created_message', properties: { title: post.title }, type: 'success'});
        }}
        eventForm={eventForm}
        repeatErrors
        SubmitComponent={NewPostsSubmit}
      />
    </div>
  );
}


PostsNewForm.propTypes = {
  closeModal: PropTypes.func,
  router: PropTypes.object,
  flash: PropTypes.func,
}

PostsNewForm.displayName = "PostsNewForm";

registerComponent('PostsNewForm', PostsNewForm, withRouter, withMessages, withRouter, withUser, withStyles(styles, { name: "PostsNewForm" }));
