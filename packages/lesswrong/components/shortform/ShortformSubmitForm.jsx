import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginLeft: 12,
    marginRight: 12
  },
  placeholderWrapper: {
    marginTop: 12,
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between"
  },
  placeholder: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 300,
    color: theme.palette.grey[600]
  },
  placeholderSubmit: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    color: theme.palette.grey[500],
    marginRight: 8
  }
}) 

class ShortformSubmitForm extends PureComponent {
  
  render() {
    const { classes, successCallback } = this.props
    const { CommentsNewForm } = Components;

    return (
      <div className={classes.root}>
        <CommentsNewForm
          prefilledProps={{shortform: true}}
          successCallback={successCallback}
          type="comment"
        />
      </div>
    );
  }
}

registerComponent('ShortformSubmitForm', ShortformSubmitForm, withStyles(styles, {name:"ShortformSubmitForm"}));