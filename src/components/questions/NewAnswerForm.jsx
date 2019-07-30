import { Components, registerComponent, getFragment } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import withUser from '../common/withUser'
import withDialog from '../common/withDialog';

const styles = theme => ({
  answersForm: {
    maxWidth:650,
    paddingBottom: theme.spacing.unit*4,
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: "rgba(0,0,0, 0.05)",
    },
    color: theme.palette.secondary.main,
    float: "right"
  },
})



const NewAnswerForm = ({post, classes, currentUser}) => {

  const SubmitComponent = withDialog(({submitLabel = "Submit", openDialog}) => {
    return <div className={classes.submit}>
      <Button
        type="submit"
        className={classNames(classes.formButton)}
        onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {}
            });
            ev.preventDefault();
          }
        }}
      >
        {submitLabel}
      </Button>
    </div>
  });

  const prefilledProps = {
    postId: post._id,
    answer: true,
    af: Comments.defaultToAlignment(currentUser, post),
  }
  const { SmartForm } = Components
  
  if (currentUser && !Comments.options.mutations.new.check(currentUser, prefilledProps)) {
    return <FormattedMessage id="users.cannot_comment"/>;
  }
  
  return (
    <div className={classes.answersForm}>
      <SmartForm
        collection={Comments}
        formComponents={{
          FormSubmit: SubmitComponent,
          FormGroupLayout: Components.DefaultStyleFormGroup
        }}
        mutationFragment={getFragment('CommentsList')}
        prefilledProps={prefilledProps}
        alignmentForumPost={post.af}
        layout="elementOnly"
        addFields={currentUser?[]:["contents"]}
      />
    </div>
  )
};

NewAnswerForm.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired,
  prefilledProps: PropTypes.object,
};

registerComponent('NewAnswerForm', NewAnswerForm, withUser, withStyles(styles, {name:"NewAnswerForm"}));
