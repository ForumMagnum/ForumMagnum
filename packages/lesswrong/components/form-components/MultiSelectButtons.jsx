import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

const styles = theme => ({
  button: {
    
    // TODO: Pick typography for this button. (This is just the typography that
    // Material UI v0 happened to use.)
    fontWeight: 500,
    fontSize: "16px",
    fontFamily: "Roboto, sans-serif",
  },
  
  selected: {
    color: "white",
    textTransform: "none",
    backgroundColor: "rgba(100,169,105, 0.9)",
    
    "&:hover": {
      backgroundColor: "rgba(100,169,105, 0.5)",
    },
  },
  
  notSelected: {
    textTransform: "none",
    color: "rgba(0,0,0,0.6)",
    backgroundColor: "rgba(0,0,0, 0)",
    
    "&:hover": {
      backgroundColor: "rgba(0,0,0, 0.1)",
    },
  },
});


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
    const { classes } = this.props;
    
    return <div className="multi-select-buttons">
      {this.props.label && <label className="multi-select-buttons-label">{this.props.label}</label>}
      {this.props.options.map((option) => {
        const selected = this.state.options && this.state.options.includes(option.value);
        return <Button
          className={classnames(
            "multi-select-buttons-button",
            classes.button,
            {
              [classes.selected]: selected,
              [classes.notSelected]: !selected,
            }
          )}
          primary={selected}
          onClick={() => this.handleClick(option.value)}
          key={option.value}
        >
          {option.label || option.value}
        </Button>
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
registerComponent("MultiSelectButtons", MultiSelectButtons,
  withStyles(styles, { name: "MultiSelectButtons" }));
