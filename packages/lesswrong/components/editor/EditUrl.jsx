import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import InputAdornment from '@material-ui/core/InputAdornment';
import classNames from 'classnames'
import Input from '@material-ui/core/Input';

const styles = theme => ({
  root: {
    marginRight: theme.spacing.unit
  },
  input: {
    marginLeft: 5,
    display: 'inline-block',
    overflow: 'hidden',
    transition: 'width 0.25s',
    width: 150,
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
  state = {
    active: !!this.props.value
  }

  toggleEditor = () => {
    this.setState({active: !this.state.active}, () => {
      if (!this.state.active) { // Reset the URL when you deactivate the URL editor
        this.context.updateCurrentValues({
          [this.props.path]: null
        })
      }
    })
  }

  onChange = (event) => {
    this.context.updateCurrentValues({
      [this.props.path]: event.target.value
    })
  }

  render() {
    const active = this.state.active
    const { classes, document, path, defaultValue, label, hintText, placeholder } = this.props;
    
    const startAdornmentInactive = <InputAdornment className={classes.button} onClick={this.toggleEditor} position="start">
      <Icon>link</Icon>
    </InputAdornment>
    const startAdornmentActive = <InputAdornment className={classes.button} onClick={this.toggleEditor} position="start">
      <Icon>link_off</Icon></InputAdornment>

    return (
      <div className={classes.root}>
        <div>
          <span className={classNames(classes.input, {[classes.hideInput]: !active})}>
            <div className="mui-text-field">
              <Input
                className={classes.innerInput}
                value={(document && document[path]) || defaultValue || ""}
                label={label}
                onChange={this.onChange}
                placeholder={hintText || placeholder || label}
                disableUnderline={!active}
                classes={{input: classes.input}}
                startAdornment={active ? startAdornmentActive : startAdornmentInactive}
              />
            </div>
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
