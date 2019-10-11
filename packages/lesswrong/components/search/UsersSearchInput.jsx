import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  input: {
    // this needs to be here because of Bootstrap. I am sorry :(
    padding: "6px 0 7px",
    fontSize: "13px"
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

registerComponent("UsersSearchInput", UsersSearchInput,
  withStyles(styles, { name: "UsersSearchInput" })
);
