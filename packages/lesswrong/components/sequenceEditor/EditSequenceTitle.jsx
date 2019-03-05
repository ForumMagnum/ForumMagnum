import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Textarea } from 'formsy-react-components';
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

const EditSequenceTitle = ({classes, inputProperties, placeholder}) => {
  return <div className={classes.root}>
    <div className="sequences-image-scrim-overlay"></div>
    <div className="sequences-editor-title-wrapper">
      <Textarea
        className="sequences-editor-title"
        {...inputProperties}
        placeholder={ placeholder }
        layout="elementOnly"
      />
    </div>
  </div>
}

registerComponent("EditSequenceTitle", EditSequenceTitle,
  withStyles(styles, {name: "EditSequenceTitle"}));
