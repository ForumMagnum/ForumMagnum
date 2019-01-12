import { Components, registerComponent, getRawComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    '& .DraftEditor-editorContainer img': {
      width:"100% !important"
    }
  }
})



const PostsFormStyling = ({classes, children}) => {
  return (
    <div className={classes.root}>
      { children}
    </div>
  );
}

PostsFormStyling.displayName = "PostsFormStyling";

registerComponent('PostsFormStyling', PostsFormStyling, withStyles(styles, {name:"PostsFormStyling"}));
