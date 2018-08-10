import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Input from '@material-ui/core/Input';
import classnames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  input: {
    // This needs to be here because of Bootstrap. I am sorry :(
    padding: "6px 0 7px !important",
    fontSize: "13px !important",
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
    const { classes, label, multiLine, rows, hintText, placeholder, fullWidth, disableUnderline, minHeight } = this.props

    return <div className="mui-text-field">
      <Input
        value={this.state.content}
        label={label}
        onChange={this.onChange}
        multiline={multiLine}
        rows={rows}
        placeholder={hintText || placeholder || label}
        fullWidth={fullWidth}
        style={{minHeight: minHeight}}
        disableUnderline={disableUnderline}
        classes={{input: classes.input}}
        className={classnames(
          "mui-text-field-form-component",
          {"full-width":fullWidth},
        )}
      /><br />
    </div>
  }
}

MuiTextField.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("MuiTextField", MuiTextField, withStyles(styles));
