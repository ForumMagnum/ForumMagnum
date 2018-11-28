import { registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Textarea } from 'formsy-react-components';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    width: "100%",
    resize: "none",
    textAlign: "center",
    height: 100,
    marginTop: 0,
    borderBottom: "solid 1px rgba(0,0,0,.2)",
    '&:focused': {
      borderBottom: "solid 1px rgba(0,0,0,.2)"
    }
  }
})

const EditTitle = (props) => {
  return <Textarea
    className={props.classes.root}
    {...props.inputProperties}
    placeholder={ props.document.question ? "Question" : props.placeholder }
    layout="elementOnly"
         />
}

registerComponent("EditTitle", EditTitle, withStyles(styles, { name: "EditTitle" }));
