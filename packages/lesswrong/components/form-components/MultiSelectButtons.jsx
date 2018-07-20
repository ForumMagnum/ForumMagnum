import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import FlatButton from 'material-ui/FlatButton';


class MultiSelectButtons extends Component {
  constructor(props, context) {
    super(props,context);
    this.state = {
      options: this.props.document[this.props.name] || [],
    }
  }

  componentDidMount() {
    this.context.addToSuccessForm(() => this.setState({options: []}))
    this.context.updateCurrentValues({
      [this.props.name]: this.props.document && this.props.document[this.props.name] || []
    })
  }

  handleClick = (option) => {
    if (this.state.options && this.state.options.includes(option)) {
      this.context.updateCurrentValues({
        [this.props.name]: _.without(this.state.options, option)
      })
      this.setState({options: _.without(this.state.options, option)})
    } else {
      this.context.updateCurrentValues({
        [this.props.name]: [...this.state.options, option]
      })
      this.setState({options: [...this.state.options, option]})
    }
  }

  render() {
    return <div className="multi-select-buttons">
      {this.props.label && <label className="multi-select-buttons-label">{this.props.label}</label>}
      {this.props.options.map((option) => {
        const selected = this.state.options && this.state.options.includes(option.value);
        return <FlatButton
          className="multi-select-buttons-button"
          primary={selected}
          labelStyle={ selected ?
            {color: "white", fontSize: "16px", textTransform: "none"}
          : {fontSize: "16px", textTransform: "none", color: "rgba(0,0,0,0.6)"}
          }
          backgroundColor={selected ? (option.color || "#0C869B") : "rgba(0,0,0,0)"}
          hoverColor={selected ? (option.hoverColor || "#0C869B") : "rgba(0,0,0,0.1)"}
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
  addToSuccessForm: PropTypes.func,
};

MultiSelectButtons.defaultProps = {

}
registerComponent("MultiSelectButtons", MultiSelectButtons);
