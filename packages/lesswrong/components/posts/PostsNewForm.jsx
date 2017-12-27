import { Components, replaceComponent, getRawComponent, getFragment, withMessages, withList } from 'meteor/vulcan:core';
import { Posts, Categories } from "meteor/example-forum";
import React, { PropTypes, Component } from 'react';
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
          prefilledProps={{frontpage: props.router.location.query && !!props.router.location.query.frontpage, meta: props.router.location.query && !!props.router.location.query.meta}}
          successCallback={post => {
            props.router.push({pathname: Posts.getPageUrl(post)});
            props.flash(context.intl.formatMessage({id: "posts.created_message"}), "success");
          }}
        />
      </div>
    </Components.ShowIf>

PostsNewForm.propTypes = {
  closeModal: React.PropTypes.func,
  router: React.PropTypes.object,
  flash: React.PropTypes.func,
}

PostsNewForm.contextTypes = {
  closeCallback: React.PropTypes.func,
};

PostsNewForm.displayName = "PostsNewForm";

const categoryListOptions = {
  collection: Categories,
  queryName: 'newPostCategories',
  fragmentName: 'allCategories',
};

replaceComponent('PostsNewForm', PostsNewForm, withRouter, withMessages, withRouter, [withList, categoryListOptions]);
