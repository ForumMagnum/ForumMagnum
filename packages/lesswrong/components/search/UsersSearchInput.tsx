import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import InputAdornment from '@/lib/vendor/@material-ui/core/src/InputAdornment';
import PersonAddIcon from '@/lib/vendor/@material-ui/icons/src/PersonAdd';
import type { InputBaseComponentProps } from '@/lib/vendor/@material-ui/core/src/InputBase';

const styles = (theme: ThemeType) => ({
  input: {
    // this needs to be here because of Bootstrap. I am sorry :(
    padding: "6px 0 7px",
    fontSize: "13px"
  }
})

const UsersSearchInput = ({ inputProps, classes }: {
  inputProps: InputBaseComponentProps;
  classes: ClassesType<typeof styles>;
}) => {
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

