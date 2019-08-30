import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

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

class FormComponentCheckbox extends Component {
  constructor(props, context) {
    super(props,context);
  }

  render() {
    const { classes, label, disabled=false } = this.props
    return <div className={classes.root}>
        <Checkbox
          className={classes.size}
          checked={this.props.value}
          onChange={(event, checked) => {
            this.context.updateCurrentValues({
              [this.props.path]: checked
            })
          }}
          disabled={disabled}
          disableRipple
        />
        <Typography className={classes.inline} variant="body1" component="label">{label}</Typography>
    </div>
  }
}

FormComponentCheckbox.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

// Replaces FormComponentCheckbox from vulcan-ui-bootstrap
registerComponent("FormComponentCheckbox", FormComponentCheckbox, withStyles(styles, { name: "FormComponentCheckbox" }));
