import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components } from 'meteor/vulcan:core';
import defineComponent from '../../lib/defineComponent';

class FormComponentDefault extends Component {
  render() {
    return <Components.MuiTextField {...this.props} />
  }
}

export default defineComponent({
  name: "FormComponentDefault",
  component: FormComponentDefault
});
