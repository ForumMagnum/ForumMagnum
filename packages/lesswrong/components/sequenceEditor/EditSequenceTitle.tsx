import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import PropTypes from 'prop-types'
import Input from '@material-ui/core/Input';
import { sequencesImageScrim } from '../sequences/SequencesPage'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 65,
    backgroundColor: "rgba(0,0,0,0.25)",
    height: 380,
    [theme.breakpoints.down('sm')]: {
      marginTop: 40,
    }
  },
  wrapper: {
    position: "absolute",
    bottom: 10,
    left: "50%",
    width: 0,
    
    [theme.breakpoints.down('sm')]: {
      left: 0,
      width: "100%",
    }
  },
  imageScrim: {
    ...sequencesImageScrim(theme)
  },
  input: {
    position: 'relative',
    lineHeight: '1.1',
    left: -275,
    width: 650,
    fontSize: '36px',
    color: 'white',
    fontVariant: 'small-caps',
    zIndex: theme.zIndexes.editSequenceTitleInput,
    height: '1em',
    resize: 'none',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    overflow: 'hidden',
    '&::placeholder': {
      color: 'rgba(255,255,255,.5)'
    },
    [theme.breakpoints.down('sm')]: {
      left: 5,
    }
  }
});

const EditSequenceTitle = ({classes, inputProperties, value, path, placeholder}, context) => {
  return <div className={classes.root}>
    <div className={classes.imageScrim}/>
    <div className={classes.wrapper}>
      <Input
        className={classes.input}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          context.updateCurrentValues({
            [path]: event.target.value
          })
        }}
        disableUnderline
      />
    </div>
  </div>
}

EditSequenceTitle.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const EditSequenceTitleComponent = registerComponent("EditSequenceTitle", EditSequenceTitle, {styles});

declare global {
  interface ComponentTypes {
    EditSequenceTitle: typeof EditSequenceTitleComponent
  }
}
