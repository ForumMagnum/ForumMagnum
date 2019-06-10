import React, { Component } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
});

class SignupSubscribeToCurated extends Component
{
  state = {
    checked: this.props.defaultValue
  }
  render() {
    const {onChange, id} = this.props;
    return <div key={id}>
      <Checkbox
        checked={this.state.checked}
        onChange={(ev, checked) => {
          this.setState({
            checked: checked
          });
          onChange({target: {value: checked}})
        }}
      />
      Subscribe to curated posts
    </div>
  }
}

registerComponent('SignupSubscribeToCurated', SignupSubscribeToCurated,
  withStyles(styles, {name: "SignupSubscribeToCurated"}));