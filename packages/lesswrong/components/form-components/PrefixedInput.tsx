import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import Select from '@material-ui/core/Select';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  inputAdornment: {
    marginRight: 0
  },
  icon: {
    height: 20,
    marginRight: 10
  },
  adornmentText: {
    color: theme.palette.grey[700]
  },
})

const PrefixedInput = ({ path, updateCurrentValues, value, classes }) => {

  return <Input
    name="linkedInProfileURL"
    onChange={e => {
      updateCurrentValues({
        [path]: e.target.value
      })
    }}
    startAdornment={
      <InputAdornment position="start" className={classes.inputAdornment}>
        <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" className={classes.icon}>
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
        </svg>
        <span className={classes.adornmentText}>linkedin.com/in/</span>
      </InputAdornment>
    }
    value={value}
  />

}

const PrefixedInputComponent = registerComponent("PrefixedInput", PrefixedInput, { styles });

declare global {
  interface ComponentTypes {
    PrefixedInput: typeof PrefixedInputComponent
  }
}
