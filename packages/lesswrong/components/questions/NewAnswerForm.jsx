import { Components, registerComponent, getFragment, withMessages } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';

const styles = theme => ({
  answersForm: {
    maxWidth:650,
    marginBottom:100,
  },
  title: {
    ...theme.typography.postStyle,
    borderTop: "solid 3px rgba(0,0,0,.87)",
    paddingTop: 10,
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

const FormGroupComponent = (props) => {
  return <React.Fragment>
    {props.fields.map(field => (
      <Components.FormComponent
        key={field.name}
        disabled={props.disabled}
        {...field}
        errors={props.errors}
        throwError={props.throwError}
        currentValues={props.currentValues}
        updateCurrentValues={props.updateCurrentValues}
        deletedValues={props.deletedValues}
        addToDeletedValues={props.addToDeletedValues}
        clearFieldErrors={props.clearFieldErrors}
        formType={props.formType}
        currentUser={props.currentUser}
      />
    ))}
  </React.Fragment>
}

const NewAnswerForm = ({postId, classes}) => {

  const SubmitComponent = ({submitLabel = "Submit"}) => {
    return <div className={classes.submit}>
      <Button
        type="submit"
        className={classNames(classes.formButton)}
      >
        {submitLabel}
      </Button>
    </div>
  }

  const prefilledProps = { postId: postId, answer: true }
  const { SmartForm, ShowIf } = Components
  return (
    <ShowIf
      check={Comments.options.mutations.new.check}
      document={prefilledProps}
      failureComponent={<FormattedMessage id="users.cannot_comment"/>}
    >
      <div className={classes.answersForm}>
        <Typography variant="display1" className={classes.title}>
          New Answer
        </Typography>
        <SmartForm
          collection={Comments}
          GroupComponent={FormGroupComponent}
          SubmitComponent={SubmitComponent}
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
