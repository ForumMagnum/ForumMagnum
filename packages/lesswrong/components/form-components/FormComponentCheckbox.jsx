import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Switch from '@material-ui/core/Switch';
import { withStyles, withTheme } from '@material-ui/core/styles';
import Divider from 'material-ui/Divider';

const styles = theme => ({
  icon: {
    position:"relative",
    left:14,
    top:-1,
    width:32,
    height:18,
  },
  formWrapper: {
    display:"flex",
    justifyContent: "space-between",
    alignItems: "center",
  }
})

class MuiCheckbox extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      content: props.document && props.document[props.name] || false
    }
  }

  componentDidMount() {
    this.context.addToSuccessForm(() => this.setState({content: false}))
    this.context.updateCurrentValues({
      [this.props.name]: this.props.document && this.props.document[this.props.name] || false
    })
  }

  onChange = (event) => {
    this.setState({content: !this.state.content})
    this.context.updateCurrentValues({
      [this.props.name]: !this.state.content
    })
  }

  render() {
    const { classes, label, theme } = this.props
    return <div className="">
      {/* <Divider /> */}
      {/* <div className={classes.formWrapper}> */}
        <Switch
          checked={this.state.content}
          onClick={this.onChange}
          classes={{
            icon: classes.icon
          }}
        />
        <label>{label}</label>

      {/* </div> */}
      {/* <Divider /> */}
    </div>
  }
}

MuiCheckbox.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("FormComponentCheckbox", MuiCheckbox, withStyles(styles),  withTheme());
