import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import PersonAddIcon from '@material-ui/icons/PersonAdd';

const styles = (theme: ThemeType): JssStyles => ({
  input: {
    // this needs to be here because of Bootstrap. I am sorry :(
    padding: "6px 0 7px",
    fontSize: "13px",
    // Keep the input at >=16px on mobile so that iOS Safari doesn't auto-zoom
    // the viewport when the field is focused.
    [theme.breakpoints.down('sm')]: {
      fontSize: "16px",
    },
  }
})

const UsersSearchInput = ({ inputProps, classes }) => {
  return <Input
    inputProps={inputProps}
    className={classes.input}
    startAdornment={
      <InputAdornment position="start">
        <PersonAddIcon/>
      </InputAdornment>
    }
  />
};

const UsersSearchInputComponent = registerComponent("UsersSearchInput", UsersSearchInput, {styles});

declare global {
  interface ComponentTypes {
    UsersSearchInput: typeof UsersSearchInputComponent
  }
}

