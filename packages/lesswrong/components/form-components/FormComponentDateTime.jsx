import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import DateTimePicker from 'react-datetime';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
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


class FormComponentDateTime extends Component {
  
  updateDate = (date) => {
    this.context.updateCurrentValues({[this.props.path]: date});
  }

  render() {
    const { value, name, label, classes } = this.props

    const date = value ? (typeof value === 'string' ? new Date(value) : value) : null;

    return <FormControl>
        <InputLabel className={classes.label}>{ label }</InputLabel>
        <DateTimePicker
          placeholder={label}
          value={date}
          inputProps={{
            name:name,
            autoComplete:"off",
            className:classes.input
          }}
          // newDate argument is a Moment object given by react-datetime
          onChange={newDate => this.updateDate(newDate._d)}
          format={"x"}
        />
    </FormControl>
  }
}

FormComponentDateTime.propTypes = {
  control: PropTypes.any,
  datatype: PropTypes.any,
  group: PropTypes.any,
  label: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.any,
};

FormComponentDateTime.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

// Replaces FormComponentDateTime from vulcan-ui-bootstrap.
// TODO: This may not work right in nested contexts.
registerComponent("FormComponentDateTime", FormComponentDateTime, withStyles(styles, { name: "FormComponentDateTime" }));
