import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames'

const styles = theme => ({
  input: {
    marginLeft: 5,
    display: 'inline-block',
    overflow: 'hidden',
    transition: 'width 0.25s',
    width: 110,
  },
  hideInput: {
    width: 0,
  },
  button: {
    '&:hover': {
      cursor:'pointer'
    }
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
    const { classes } = this.props
    return (
      <div className={classes.root}>
        <div>
          <span onClick={this.toggleEditor} className={classes.button}>
            { !active ? <Icon>link</Icon> : <Icon>link_off</Icon> }
          </span>
          <span className={classNames(classes.input, {[classes.hideInput]: !active})}>
            <Components.MuiTextField
              {...this.props}
              type={"url"}
              layout="elementOnly"
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

registerComponent("EditUrl", EditUrl, withStyles(styles));
