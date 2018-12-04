import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  answersForm: {
    maxWidth:640
  }
})

const NewAnswerForm = ({postId, classes}) => {

  const prefilledProps = { postId: postId, answer: true }
  const { SmartForm, ShowIf } = Components
  return (
    <ShowIf
      check={Comments.options.mutations.new.check}
      document={prefilledProps}
      failureComponent={<FormattedMessage id="users.cannot_comment"/>}
    >
      <div className={classes.answersForm}>
        <SmartForm
          collection={Comments}
          mutationFragment={getFragment('CommentsList')}
          prefilledProps={prefilledProps}
          layout="elementOnly"
        />
      </div>
    </ShowIf>
  )

};

NewAnswerForm.propTypes = {
  classes: PropTypes.object.isRequired,
  postId: PropTypes.string.isRequired,
  prefilledProps: PropTypes.object
};

registerComponent('NewAnswerForm', NewAnswerForm, withMessages, withStyles(styles, {name:"NewAnswerForm"}));
