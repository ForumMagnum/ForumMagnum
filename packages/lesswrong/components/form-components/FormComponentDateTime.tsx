import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import DateTimePicker from 'react-datetime';
import moment from '../../lib/moment-timezone';
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
  wrapper: {
    '& .rdtPicker': {
      bottom: 30,
    }
  },
  timezone: {
    marginLeft: 4
  }
})


const FormComponentDateTime = ({ path, value, name, label, classes, position }, context) => {
  const updateDate = (date: Date | undefined) => {
    if (date) context.updateCurrentValues({[path]: date})
  }

  const date = value ? (typeof value === 'string' ? new Date(value) : value) : null;
  // since tz abbrev can depend on the date (i.e. EST vs EDT),
  // we try to use the selected date to determine the tz (and default to now)
  const tzDate = date ? moment(date) : moment();

  return <FormControl>
    <InputLabel className={classes.label}>
      { label } <span className={classes.timezone}>({tzDate.tz(moment.tz.guess()).zoneAbbr()})</span>
    </InputLabel>
    <DateTimePicker
      className={classes.wrapper}
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

