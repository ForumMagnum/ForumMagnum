import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginLeft: 12,
    marginRight: 12
  }
}) 

const ShortformSubmitForm = ({ classes, successCallback}) => {
  const { CommentsNewForm } = Components;

  return (
    <div className={classes.root}>
      <CommentsNewForm
        prefilledProps={{
          shortform: true, 
          // TODO: this crashes if passed JSX. I'd like to be able to pass in formatted text. (Ray,  August 2018)
          editorHintText: "Write your thoughts here! What have you been thinking about? Incomplete, exploratory, formative, rambly, rough, boring, draft-stage, unedited, and even (gasp!) wrong thoughts are all welcome on Shortform."
        }}
        successCallback={successCallback}
        type="comment"
      />
    </div>
  );
}

registerComponent('ShortformSubmitForm', ShortformSubmitForm, withStyles(styles, {name:"ShortformSubmitForm"}));