import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import classnames from 'classnames';
import * as _ from 'underscore';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  button: {
    // TODO: Pick typography for this button. (This is just the typography that
    // Material UI v0 happened to use.)
    fontWeight: isFriendlyUI ? 600 : 500,
    fontSize: "16px",
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : "Roboto, sans-serif",
  },

  selected: {
    color: theme.palette.buttons.primaryDarkText,
    textTransform: "none",
    fontWeight: isFriendlyUI ? 500 : undefined,
    // TODO: This green is hardcoded, but it's k because it's only used for events
    backgroundColor: theme.palette.buttons.groupTypesMultiselect.background,

    "&:hover": {
      backgroundColor: theme.palette.buttons.groupTypesMultiselect.hoverBackground,
    },
  },

  notSelected: {
    textTransform: "none",
    color: theme.palette.text.dim60,
    backgroundColor: "transparent",

    "&:hover": {
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
});

const MultiSelectButtons = ({ value, label, options, path, classes }: FormComponentProps<string> & {
  options: Array<{ value: string; label?: string }>;
  classes: ClassesType<typeof styles>;
}, context: any) => {
  const handleClick = (option: string) => {    
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
