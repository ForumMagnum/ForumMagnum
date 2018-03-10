import { Components, registerComponent, getRawComponent, getFragment, withMessages, getSetting } from 'meteor/vulcan:core';
import { Posts } from "meteor/example-forum";
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import Helmet from 'react-helmet';

const PostsNewForm = (props, context) => {
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  const prefilledProps = {
    isEvent: props.router.location.query && props.router.location.query.eventForm,
    meta: props.router.location.query && !!props.router.location.query.meta,
    groupId: props.router.location.query && props.router.location.query.groupId
  }
  return <Components.ShowIf
    check={Posts.options.mutations.new.check}
    failureComponent={<Components.AccountsLoginForm />}
         >
    <div className="posts-new-form">
      {prefilledProps.isEvent && <Helmet><script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}/></Helmet>}
      <Components.SmartForm
        collection={Posts}
        mutationFragment={getFragment('PostsPage')}
        prefilledProps={prefilledProps}
        successCallback={post => {
          props.router.push({pathname: Posts.getPageUrl(post)});
          props.flash(context.intl.formatMessage({id: "posts.created_message"}), "success");
        }}
        eventForm={props.router.location.query && props.router.location.query.eventForm}
        repeatErrors
      />
    </div>
  </Components.ShowIf>
}


PostsNewForm.propTypes = {
  closeModal: PropTypes.func,
  router: PropTypes.object,
  flash: PropTypes.func,
}

PostsNewForm.contextTypes = {
  closeCallback: PropTypes.func,
};

PostsNewForm.displayName = "PostsNewForm";

registerComponent('PostsNewForm', PostsNewForm, withRouter, withMessages, withRouter);
