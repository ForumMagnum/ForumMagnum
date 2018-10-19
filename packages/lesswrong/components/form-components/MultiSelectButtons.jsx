import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import FlatButton from 'material-ui/FlatButton';


class MultiSelectButtons extends Component {
  constructor(props, context) {
    super(props,context);
  }

  handleClick = (option) => {
    const { value } = this.props;
    
    if (value && value.includes(option)) {
      this.context.updateCurrentValues({
        [this.props.path]: _.without(value, option)
      })
    } else {
      this.context.updateCurrentValues({
        [this.props.path]: [...value, option]
      })
    }
  }

  render() {
    const { value } = this.props;
    
    return <div className="multi-select-buttons">
      {this.props.label && <label className="multi-select-buttons-label">{this.props.label}</label>}
      {this.props.options.map((option) => {
        const selected = value && value.includes(option.value);
        return <FlatButton
          className="multi-select-buttons-button"
          primary={selected}
          labelStyle={ selected ?
            {color: "white", fontSize: "16px", textTransform: "none"}
          : {fontSize: "16px", textTransform: "none", color: "rgba(0,0,0,0.6)"}
          }
          backgroundColor={selected ? (option.color || "rgba(100, 169, 105, 0.9)") : "rgba(0,0,0,0)"}
          hoverColor={selected ? (option.hoverColor || "rgba(100, 169, 105, 0.5)") : "rgba(0,0,0,0.1)"}
          label={option.label || option.value}
          onClick={() => this.handleClick(option.value)}
          key={option.value}
               />
      })}
    </div>
  }
}

MultiSelectButtons.contextTypes = {
  updateCurrentValues: PropTypes.func,
};

MultiSelectButtons.defaultProps = {

}

registerComponent("MultiSelectButtons", MultiSelectButtons);
