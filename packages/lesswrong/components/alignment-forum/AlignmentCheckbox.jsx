import { registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Checkbox } from 'formsy-react-components';

class AlignmentCheckbox extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showWarning: false,
    };
  }

  handleClickDialog = () => {
    // The warning should not show by default, but should be displayed if the
    // checkbox is toggled from false-to-true
    this.setState({showWarning:!this.props.value})
  }

  render () {
    return <div className="alignment-checkbox-wrapper">
      <Checkbox
        className="alignment-checkbox"
        onClick={this.handleClickDialog}
        {...this.props.inputProperties}
        placeholder={ this.props.placeholder }
        layout="elementOnly"
             />
      { this.state.showWarning && <span className="alignment-checkbox-warning">
        NOTE: Upstream comments will become visible on Alignment Forum
      </span>}
    </div>
  }
}

registerComponent("AlignmentCheckbox", AlignmentCheckbox);
