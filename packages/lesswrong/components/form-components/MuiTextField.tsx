import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import TextField from '@material-ui/core/TextField';
import classnames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  labelColor: {
    color: theme.secondary
  },
  textField: {
    fontSize: "15px",
    width: 350,
    [theme.breakpoints.down('sm')]: {
      width: "calc(100% - 30px)", // leaving 30px so that the "clear" button for select forms has room
      // Keep the input at >=16px on mobile so that iOS Safari doesn't auto-zoom
      // the viewport when the field is focused.
      fontSize: "16px",
    },
  },
  fullWidth: {
    width:"100%",
  }
})

class MuiTextField extends PureComponent<any> {
  constructor(props, context) {
    super(props,context);
  }

  onChange = (event) => {
    this.context.updateCurrentValues({
      [this.props.path]: event.target.value
    })
  }

  render() {
    const { classes, value, select, children, label, multiLine, rows, fullWidth, type, defaultValue, InputLabelProps } = this.props

    return <TextField
        select={select}
        value={value||""}
        defaultValue={defaultValue}
        label={label}
        onChange={this.onChange}
        multiline={multiLine}
        rows={rows}
        type={type}
        fullWidth={fullWidth}
        InputLabelProps={{
          className: classes.cssLabel,
          ...InputLabelProps
        }}
        className={classnames(
          classes.textField,
          {fullWidth:fullWidth}
        )}
      >
        {children}
      </TextField>
  }
};

(MuiTextField as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const MuiTextFieldComponent = registerComponent("MuiTextField", MuiTextField, {styles});

declare global {
  interface ComponentTypes {
    MuiTextField: typeof MuiTextFieldComponent
  }
}
