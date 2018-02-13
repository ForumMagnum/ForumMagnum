import { Components, registerComponent, getRawComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import { Posts } from "meteor/example-forum";
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router'

const PostsNewForm = (props, context) =>
  <Components.ShowIf
    check={Posts.options.mutations.new.check}
    failureComponent={<Components.AccountsLoginForm />}
  >
    <div className="posts-new-form">
      <Components.SmartForm
        collection={Posts}
        mutationFragment={getFragment('PostsPage')}
        prefilledProps={{meta: props.router.location.query && !!props.router.location.query.meta}}
        successCallback={post => {
          props.router.push({pathname: Posts.getPageUrl(post)});
          props.flash(context.intl.formatMessage({id: "posts.created_message"}), "success");
        }}
        repeatErrors
      />
    </div>
  </Components.ShowIf>

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
