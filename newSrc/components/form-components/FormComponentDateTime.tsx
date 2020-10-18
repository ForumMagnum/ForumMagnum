import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import DateTimePicker from 'react-datetime';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

const styles = (theme: ThemeType): JssStyles => ({
  input: {
    borderBottom: `solid 1px #999`,
    padding: '6px 0 7px 0'
  },
  label: {
    position:"relative",
    transform:"none",
    fontSize: 10,
  },
})


const FormComponentDateTime = ({ path, value, name, label, classes }, context) => {
  const updateDate = (date) => {
    context.updateCurrentValues({[path]: date});
  }

  const date = value ? (typeof value === 'string' ? new Date(value) : value) : null;

  return <FormControl>
    <InputLabel className={classes.label}>{ label }</InputLabel>
    <DateTimePicker
      value={date}
      inputProps={{
        name:name,
        autoComplete:"off",
        className:classes.input
      }}
      // newDate argument is a Moment object given by react-datetime
      onChange={(newDate: any) => updateDate(newDate._d)}
    />
  </FormControl>
}

(FormComponentDateTime as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

// Replaces FormComponentDateTime from vulcan-ui-bootstrap.
// TODO: This may not work right in nested contexts.
const FormComponentDateTimeComponent = registerComponent("FormComponentDateTime", FormComponentDateTime, {styles});

declare global {
  interface ComponentTypes {
    FormComponentDateTime: typeof FormComponentDateTimeComponent
  }
}

