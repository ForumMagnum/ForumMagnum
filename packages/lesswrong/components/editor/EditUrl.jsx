import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import InputAdornment from '@material-ui/core/InputAdornment';
import classNames from 'classnames'

const styles = theme => ({
  root: {
    marginRight: theme.spacing.unit
  },
  input: {
    marginLeft: 5,
    display: 'inline-block',
    overflow: 'hidden',
    transition: 'width 0.25s',
    width: 140,
  },
  hideInput: {
    width: 28,
  },
  button: {
    '&:hover': {
      cursor:'pointer'
    }
  },
  innerInput: {
    padding: '6px 0 7px'
  }
})

class EditUrl extends Component {
  constructor(props, context) {
    super(props,context);

    this.state = {
      active: !!this.props.value,
      url: this.props.value,
    };
  }

  toggleEditor = () => {this.setState({active: !this.state.active})}

  render() {
    const active = this.state.active

    // Pass properties other than `classes` (which is created by `withStyles`)
    // through to `Components.MuiTextField`. (If we passed through `classes`,
    // it would clash with the one that `MuiTextField`'s own `withStyles` would
    // add, producing a spurious error).
    // (NOTE: If you add properties here, or add something to this component
    // which creates a property, give some though to whether it should be passed
    // through.)
    const { classes, ...otherProps } = this.props;
    const startAdornmentInactive = <InputAdornment className={classes.button} onClick={this.toggleEditor} position="start">
      <Icon>link</Icon>
    </InputAdornment>
    const startAdornmentActive = <InputAdornment className={classes.button} onClick={this.toggleEditor} position="start">
      <Icon>link_off</Icon></InputAdornment>
    return (
      <div className={classes.root}>
        <div>
          <span className={classNames(classes.input, {[classes.hideInput]: !active})}>
            <Components.MuiInput
              {...otherProps}
              type={"url"}
              layout="elementOnly"
              startAdornment={active ? startAdornmentActive : startAdornmentInactive}
              className={classes.innerInput}
              disableUnderline={!active}
            />
          </span>
        </div>
      </div>
    )
  }
}

EditUrl.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
};

registerComponent("EditUrl", EditUrl, withStyles(styles, { name: "EditUrl" }));
