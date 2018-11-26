import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { FormattedMessage } from 'meteor/vulcan:i18n';

const NewAnswerForm = ({postId}) => {

  const prefilledProps = { postId: postId, answer: true }

  return (

    <Components.ShowIf
      check={Comments.options.mutations.new.check}
      document={prefilledProps}
      failureComponent={<FormattedMessage id="users.cannot_comment"/>}
    >
      <div style={{maxWidth:640}}>
        <Components.SmartForm
          collection={Comments}
          mutationFragment={getFragment('CommentsList')}
          prefilledProps={prefilledProps}
          layout="elementOnly"
        />
      </div>
    </Components.ShowIf>
  )

};

NewAnswerForm.propTypes = {
  postId: PropTypes.string.isRequired,
  prefilledProps: PropTypes.object
};

registerComponent('NewAnswerForm', NewAnswerForm, withMessages);
