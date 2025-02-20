import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType) => ({
  // input: {
  //   // This needs to be here because of Bootstrap. I am sorry :(
  //   // padding: "6px 0 7px !important",
  //   fontSize: "15px !important"
  // },
})

class MuiInput extends Component<any,any> {
  declare context: AnyBecauseTodo

  constructor(props: any, context: any) {
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

  onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    this.setState({contents: event.target.value})
    this.context.updateCurrentValues({
      [this.props.path]: event.target.value
    })
  }

  render() {
    const { className, label, multiLine, rows, hintText, placeholder,
      rowsMax, fullWidth, disableUnderline, startAdornment, disabled, classes } = this.props;
    return <Input
        className={className}
        value={this.state.contents || ""}
        onChange={this.onChange}
        multiline={multiLine}
        rows={rows}
        placeholder={hintText || placeholder || label}
        rowsMax={rowsMax}
        fullWidth={fullWidth}
        disableUnderline={disableUnderline}
        classes={{input: classes.input}}
        startAdornment={startAdornment}
        disabled={disabled}
      />
  }
};

(MuiInput as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

const MuiInputComponent = registerComponent("MuiInput", MuiInput, {styles});

declare global {
  interface ComponentTypes {
    MuiInput: typeof MuiInputComponent
  }
}
