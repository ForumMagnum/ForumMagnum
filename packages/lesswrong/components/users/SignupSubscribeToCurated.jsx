import React, { Component } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';
import Info from '@material-ui/icons/Info';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
  root: {
    ...theme.typography.body1,
    marginBottom: 10,
  },
  checkbox: {
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingRight: 6,
  },
  infoIcon: {
    width: 16,
    height: 16,
    verticalAlign: "middle",
    color: "rgba(0,0,0,.4)",
    marginLeft: 6,
  },
});

class SignupSubscribeToCurated extends Component
{
  state = {
    checked: this.props.defaultValue
  }
  render() {
    const { onChange, id, classes } = this.props;
    return <div key={id} className={classes.root}>
      <Checkbox
        checked={this.state.checked}
        className={classes.checkbox}
        onChange={(ev, checked) => {
          this.setState({
            checked: checked
          });
          onChange({target: {value: checked}})
        }}
      />
      Subscribe to Curated posts
      <Tooltip title="Emails 2-3 times per week with the best posts, chosen by the LessWrong moderation team.">
        <Info className={classes.infoIcon}/>
      </Tooltip>
    </div>
  }
}

registerComponent('SignupSubscribeToCurated', SignupSubscribeToCurated,
  withStyles(styles, {name: "SignupSubscribeToCurated"}));