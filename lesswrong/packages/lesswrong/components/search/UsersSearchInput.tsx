import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { Input, InputAdornment, InputBaseComponentProps } from "@/components/mui-replacement";

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

export default UsersSearchInputComponent;

