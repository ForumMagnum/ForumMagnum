import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    ...theme.typography.errorStyle
  }
})

const FieldErrors = ({ classes, errors }) => (
  <ul className={classNames(classes.root, "form-input-errors")}>
    {errors.map((error, index) => (
      <li key={index}>
        <Components.FormError error={error} errorContext="field" />
      </li>
    ))}
  </ul>
);
FieldErrors.propTypes = {
  errors: PropTypes.array.isRequired
};
registerComponent('FieldErrors', FieldErrors, withStyles(styles, {name:"FieldErrors"}));
