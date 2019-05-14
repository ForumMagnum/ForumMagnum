import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types'
import Input from '@material-ui/core/Input';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginTop: 65,
    backgroundColor: "rgba(0,0,0,0.25)",
    height: 380,
    [theme.breakpoints.down('sm')]: {
      marginTop: 40,
    }
  },
});

const EditSequenceTitle = ({classes, inputProperties, value, path, placeholder}, context) => {
  return <div className={classes.root}>
    <div className="sequences-image-scrim-overlay"></div>
    <div className="sequences-editor-title-wrapper">
      <Input
        className="sequences-editor-title"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          context.updateCurrentValues({
            [path]: event.target.value
          })
        }}
      />
    </div>
  </div>
}

EditSequenceTitle.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

registerComponent("EditSequenceTitle", EditSequenceTitle,
  withStyles(styles, {name: "EditSequenceTitle"}));
