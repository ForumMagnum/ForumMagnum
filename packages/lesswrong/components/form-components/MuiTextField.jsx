import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import TextField from 'material-ui/TextField';


class MuiTextField extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      content: props.document && props.document[props.name] || ""
    }
  }

  componentDidMount() {
    this.context.addToSuccessForm(() => this.setState({content: ""}))
  }

  onChange = (event, value) => {
    this.setState({content: value})
    this.context.addToAutofilledValues({
      [this.props.name]: value
    })
  }

  render() {
    return <div className="mui-text-field">
      <TextField
        value={this.state.content}
        label={this.props.label}
        onChange={this.onChange}
        multiLine={this.props.multiLine}
        rows={this.props.rows}
        hintText={this.props.label || this.props.hintText}
        fullWidth={this.props.fullWidth}
        underlineShow={this.props.underlineShow}
        className="mui-text-field-form-component"
      /><br />
    </div>
  }
}

MuiTextField.contextTypes = {
  addToAutofilledValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("MuiTextField", MuiTextField);
