import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, getFragment, withMessages, withDocument } from 'meteor/vulcan:core';
import { intlShape } from 'meteor/vulcan:i18n';
import { Posts } from '../../lib/collections/posts';
import { withRouter } from 'react-router'

class PostsEditForm extends PureComponent {

  render() {
    const { documentId, document, eventForm } = this.props;
    const isDraft = document && document.draft;

    return (
      <div className="posts-edit-form">
        <Components.SmartForm
          collection={Posts}
          documentId={documentId}
          queryFragment={getFragment('PostsEdit')}
          mutationFragment={getFragment('PostsRevision')}
          successCallback={post => {
            this.props.flash({ id: 'posts.edit_success', properties: { title: post.title }, type: 'success'});
            this.props.router.push({pathname: Posts.getPageUrl(post)});
          }}
          eventForm={eventForm}
          removeSuccessCallback={({ documentId, documentTitle }) => {
            // post edit form is being included from a single post, redirect to index
            // note: this.props.params is in the worst case an empty obj (from react-router)
            if (this.props.params._id) {
              this.props.router.push('/');
            }

            this.props.flash({ id: 'posts.delete_success', properties: { title: documentTitle }, type: 'success'});
            // todo: handle events in collection callbacks
            // this.context.events.track("post deleted", {_id: documentId});
          }}
          // LESSWRONG: Ugly callback to avoid weird errors with differences in queryFragment and input types. 
          // If another error like this shows up, we should do something about this systematically
          submitCallback={data => {
            return {
              ...data, 
              moderationGuidelines: (data.moderationGuidelines && data.moderationGuidelines.canonicalContent && data.moderationGuidelines.canonicalContent.data) ? 
                {canonicalContent: data.moderationGuidelines.canonicalContent} :
                undefined
            }
          }}
          showRemove={true}
          submitLabel={isDraft ? "Publish" : "Publish Changes"}
          extraVariables={{
            version: 'String'
          }}
          repeatErrors
        />
      </div>
    );

  }
}

PostsEditForm.propTypes = {
  closeModal: PropTypes.func,
  flash: PropTypes.func,
}

PostsEditForm.contextTypes = {
  intl: intlShape
}

const documentQuery = {
  collection: Posts,
  queryName: 'PostsEditFormQuery',
  fragmentName: 'PostsPage',
  ssr: true
};

registerComponent('PostsEditForm', PostsEditForm,
  [withDocument, documentQuery],
  withMessages, withRouter);
