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
          editorHintText: "Write a shortform post here. (You can switch between rich text and markdown in your user settings)"
        }}
        successCallback={successCallback}
        type="comment"
      />
    </div>
  );
}

registerComponent('ShortformSubmitForm', ShortformSubmitForm, withStyles(styles, {name:"ShortformSubmitForm"}));