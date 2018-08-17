import { Components, registerComponent} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import Icon from '@material-ui/core/Icon'
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  input: {
    // this needs to be here because of Bootstrap. I am sorry :(
    padding: "6px 0 7px !important",
    fontSize: "13px !important",
    width: 120,
  }
})

const UsersSearchInput = ({ inputProps, classes }) => <Input
      { ...inputProps}
      classes={{input: classes.input}}
      startAdornment={
        <InputAdornment position="start">
          <Icon>person_add</Icon>
        </InputAdornment>}
      />

registerComponent("UsersSearchInput", UsersSearchInput, withStyles(styles));
