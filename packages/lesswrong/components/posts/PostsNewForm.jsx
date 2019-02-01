import { Components, registerComponent, getRawComponent, getFragment, withMessages, getSetting } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import Helmet from 'react-helmet';
import withUser from '../common/withUser'

const PostsNewForm = ({router, currentUser, flash}) => {
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  const moderationGuidelines = currentUser && currentUser.moderationGuidelines && currentUser.moderationGuidelines.html
  const prefilledProps = {
    isEvent: router.location.query && router.location.query.eventForm,
    types: router.location.query && router.location.query.ssc ? ['SSC'] : [],
    meta: router.location.query && !!router.location.query.meta,
    frontpageDate: getSetting("AlignmentForum", false) ? new Date() : null,
    af: getSetting("AlignmentForum", false) || (router.location.query && !!router.location.query.af),
    groupId: router.location.query && router.location.query.groupId,
    moderationStyle: currentUser && currentUser.moderationStyle,
    moderationGuidelines: moderationGuidelines ? {
      originalContents: {
        type: "html",
        data: moderationGuidelines
      }
    } : undefined 
  }
  
  if (!Posts.options.mutations.new.check(currentUser)) {
    return (<Components.AccountsLoginForm />);
  }
  
  return (
    <div className="posts-new-form">
      {prefilledProps.isEvent && <Helmet><script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}/></Helmet>}
      <Components.WrappedSmartForm
        collection={Posts}
        mutationFragment={getFragment('PostsPage')}
        prefilledProps={prefilledProps}
        successCallback={post => {
          router.push({pathname: Posts.getPageUrl(post)});
          flash({ id: 'posts.created_message', properties: { title: post.title }, type: 'success'});
        }}
        eventForm={router.location.query && router.location.query.eventForm}
        submitLabel="Publish"
        repeatErrors
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

registerComponent('PostsNewForm', PostsNewForm, withRouter, withMessages, withRouter, withUser);
