import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import Input from '@material-ui/core/Input';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  // input: {
  //   // This needs to be here because of Bootstrap. I am sorry :(
  //   // padding: "6px 0 7px !important",
  //   fontSize: "15px !important"
  // },
})

class MuiInput extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      contents: (props.document && props.document[props.path]) || props.defaultValue || ""
    }
  }

  componentDidMount() {
    this.context.addToSuccessForm(() => this.setState({contents: ""}))
    this.context.updateCurrentValues({
      [this.props.path]: (this.props.document && this.props.document[this.props.path]) || ""
    })
  }

  onChange = (event) => {
    this.setState({contents: event.target.value})
    this.context.updateCurrentValues({
      [this.props.path]: event.target.value
    })
  }

  render() {
    return <div className="mui-text-field">
      <Input
        className={this.props.className}
        value={this.state.contents || ""}
        label={this.props.label}
        onChange={this.onChange}
        multiline={this.props.multiLine}
        rows={this.props.rows}
        placeholder={this.props.hintText || this.props.placeholder || this.props.label}
        rowsMax={this.props.rowsMax}
        fullWidth={this.props.fullWidth}
        disableUnderline={this.props.disableUnderline}
        classes={{input: this.props.classes.input}}
        startAdornment={this.props.startAdornment}
      /><br />
    </div>
  }
}

MuiInput.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};
registerComponent("MuiInput", MuiInput, withStyles(styles, { name: "MuiInput" }));
