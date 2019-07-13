import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Textarea } from 'formsy-react-components';
import { withStyles } from '@material-ui/core/styles';
import { sequencesImageScrim } from '../sequences/SequencesPage'

const styles = theme => ({
  root: {
    marginTop: 65,
    backgroundColor: "rgba(0,0,0,0.25)",
    height: 380,
    [theme.breakpoints.down('sm')]: {
      marginTop: 40,
    }
  },
  imageScrim: {
    ...sequencesImageScrim(theme)
  },
  titleWrapper: {
    position: "absolute",
    bottom: 5,
    left: "50%",
    zIndex: 1,
    width: 0,
    
    [theme.breakpoints.down('sm')]: {
      left: 0,
      width: "100%",
    },
  },
  title: {
    position: "relative",
    lineHeight: 1.1,
    left: -275,
    width: 650,
    fontSize: "36px",
    color: "white",
    fontVariant: "small-caps",
    zIndex: 2,
    
    height: "1em",
    resize: "none",
    backgroundColor: "transparent",
    boxShadow: "none",
    overflow: "hidden",
    
    "&::placeholder": {
      color: "rgba(255,255,255,.5)",
    },
    
    [theme.breakpoints.down('sm')]: {
      left: 0,
      width: "100%",
      textAlign: "center",
    },
  }
});

const EditSequenceTitle = ({classes, inputProperties, placeholder}) => {
  return <div className={classes.root}>
    <div className={classes.imageScrim}/>
    <div className={classes.titleWrapper}>
      <Textarea
        className={classes.title}
        {...inputProperties}
        placeholder={ placeholder }
        layout="elementOnly"
      />
    </div>
  </div>
}

registerComponent("EditSequenceTitle", EditSequenceTitle,
  withStyles(styles, {name: "EditSequenceTitle"}));
