import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import classnames from 'classnames';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
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
    // TODO: This green is hardcoded, but it's k because it's only used for events
    backgroundColor: "rgba(100,169,105, 0.9)",

    "&:hover": {
      backgroundColor: "rgba(100,169,105, 0.5)",
    },
  },

  notSelected: {
    textTransform: "none",
    color: "rgba(0,0,0,0.6)",
    backgroundColor: "transparent",

    "&:hover": {
      backgroundColor: "rgba(0,0,0, 0.1)",
    },
  },
});

const MultiSelectButtons = ({ value, classes, label, options, path }, context) => {
  const handleClick = (option) => {    
    if (value && value.includes(option)) {
      context.updateCurrentValues({
        [path]: _.without(value, option)
      })
    } else {
      context.updateCurrentValues({
        [path]: [...value, option]
      })
    }
  }

  return <div className="multi-select-buttons">
    {label && <label className="multi-select-buttons-label">{label}</label>}
    {options.map((option) => {
      const selected = value && value.includes(option.value);
      return <Button
        className={classnames(
          "multi-select-buttons-button",
          classes.button,
          {
            [classes.selected]: selected,
            [classes.notSelected]: !selected,
          }
        )}
        onClick={() => handleClick(option.value)}
        key={option.value}
      >
        {option.label || option.value}
      </Button>
    })}
  </div>
}

(MultiSelectButtons as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const MultiSelectButtonsComponent = registerComponent("MultiSelectButtons", MultiSelectButtons, {styles});

declare global {
  interface ComponentTypes {
    MultiSelectButtons: typeof MultiSelectButtonsComponent
  }
}
