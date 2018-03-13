import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import TextField from 'material-ui/TextField';
import classnames from 'classnames';

class MuiTextField extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      content: props.document && props.document[props.name] || ""
    }
  }

  componentDidMount() {
    this.context.addToSuccessForm(() => this.setState({content: ""}))
    this.context.addToAutofilledValues({
      [this.props.name]: this.props.document && this.props.document[this.props.name] || ""
    })
  }

  onChange = (event, value) => {
    this.setState({content: value})
    this.context.addToAutofilledValues({
      [this.props.name]: value
    })
  }

  render() {

    const hintStyle = this.props.hintStyle || this.props.multiLine ? {top:"0px"} : {}

    return <div className="mui-text-field">
      <TextField
        value={this.state.content}
        label={this.props.label}
        onChange={this.onChange}
        multiLine={this.props.multiLine}
        rows={this.props.rows}
        hintText={this.props.hintText || this.props.label}
        hintStyle={hintStyle}
        fullWidth={this.props.fullWidth}
        underlineShow={this.props.underlineShow}
        className={classnames(
          "mui-text-field-form-component",
          {"full-width":this.props.fullWidth}
        )}
      /><br />
    </div>
  }
}

MuiTextField.contextTypes = {
  addToAutofilledValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("MuiTextField", MuiTextField);
