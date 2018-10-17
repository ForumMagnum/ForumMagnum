import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import TextField from '@material-ui/core/TextField';
import classnames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  labelColor: {
    color: theme.secondary
  },
  textField: {
    fontSize: "15px",
    width: 350,
    [theme.breakpoints.down('md')]: {
      width: "100%",
    },
  },
  fullWidth: {
    width:"100%",
  }
})

class MuiTextField extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      content: props.document && props.document[props.name] || ""
    }
  }

  componentDidMount() {
    this.context.addToSuccessForm(() => this.setState({content: ""}))
    this.context.updateCurrentValues({
      [this.props.name]: this.props.document && this.props.document[this.props.name] || ""
    })
  }

  onChange = (event) => {
    this.setState({content: event.target.value})
    this.context.updateCurrentValues({
      [this.props.name]: event.target.value
    })
  }

  render() {
    const { classes, select, children, label, multiLine, rows, fullWidth, type, defaultValue, InputLabelProps } = this.props

    return <TextField
        select={select}
        value={this.state.content}
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
        classes={{input: classes.input}}
        className={classnames(
          classes.textField,
          {fullWidth:fullWidth}
        )}
      >
        {children}
      </TextField>
  }
}

MuiTextField.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

// TODO: Does not work in nested contexts because it doesn't use the
// vulcan-forms APIs correctly.
registerComponent("MuiTextField", MuiTextField, withStyles(styles, { name: "MuiTextField" }));
