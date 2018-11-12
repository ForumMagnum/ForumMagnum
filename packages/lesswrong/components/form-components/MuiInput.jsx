import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Input from '@material-ui/core/Input';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  // input: {
  //   // This needs to be here because of Bootstrap. I am sorry :(
  //   // padding: "6px 0 7px !important",
  //   fontSize: "15px !important"
  // },
})

class MuiInput extends PureComponent {
  constructor(props, context) {
    super(props,context);
  }

  onChange = (event) => {
    this.context.updateCurrentValues({
      [this.props.path]: event.target.value
    })
  }

  render() {
    return <div className="mui-text-field">
      <Input
        className={this.props.className}
        value={this.props.value}
        label={this.props.label}
        onChange={this.onChange}
        multiline={this.props.multiLine}
        rows={this.props.rows}
        rowsMax={this.props.rowsMax}
        placeholder={this.props.hintText || this.props.placeholder || this.props.label}
        fullWidth={this.props.fullWidth}
        disableUnderline={this.props.disableUnderline}
        classes={{input: this.props.classes.input}}
      /><br />
    </div>
  }
}

MuiInput.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("MuiInput", MuiInput, withStyles(styles, { name: "MuiInput" }));
