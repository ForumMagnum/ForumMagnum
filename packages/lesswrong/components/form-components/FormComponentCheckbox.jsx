import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components } from 'meteor/vulcan:core';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import defineComponent from '../../lib/defineComponent';

const styles = theme => ({
  root: {
    marginRight:theme.spacing.unit*3,
    marginTop: 5,
    display: "flex",
    alignItems: "center"
  },
  size: {
    width:36,
    height:0
  },
  inline: {
    display:"inline",
  }
})

class MuiCheckbox extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      checked: props.document && props.document[props.name] || false
    }
  }

  componentDidMount() {
    this.context.addToSuccessForm(() => this.setState({checked: false}))
    this.context.updateCurrentValues({
      [this.props.name]: this.props.document && this.props.document[this.props.name] || false
    })
  }

  onChange = (event) => {
    this.setState({checked: !this.state.checked})
    this.context.updateCurrentValues({
      [this.props.name]: !this.state.checked
    })
  }

  render() {
    const { classes, label, disabled=false } = this.props
    return <div className={classes.root}>
        <Checkbox
          className={classes.size}
          checked={this.state.checked}
          onClick={this.onChange}
          disabled={disabled}
          disableRipple
        />
        <Typography className={classes.inline} variant="body2" component="label">{label}</Typography>
    </div>
  }
}

MuiCheckbox.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

export default defineComponent({
  name: "FormComponentCheckbox",
  component: MuiCheckbox,
  styles: styles,
});
