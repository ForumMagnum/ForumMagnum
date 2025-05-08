import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { useEffect } from 'react';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'inline-block',
    ...theme.typography.commentStyle,
    marginLeft: 5
  },
  radio: {
    display: 'none'
  },
  label: {
    padding: '5px 10px',
    cursor: 'pointer',
    border: `1px solid ${theme.palette.grey[315]}`,
    '&.left': {
      borderRightColor: theme.palette.primary.dark,
      borderRadius: '4px 0 0 4px',
    },
    '&.right': {
      borderLeftWidth: 0,
      borderRadius: '0 4px 4px 0'
    },
    '&.selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.text.invertedBackgroundText,
      borderColor: theme.palette.primary.dark,
    },
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.text.invertedBackgroundText,
      borderColor: theme.palette.primary.dark,
    }
  },
});

const DistanceUnitToggleInner = ({distanceUnit='km', onChange, skipDefaultEffect, classes}: {
  distanceUnit: "km"|"mi",
  onChange: Function,
  skipDefaultEffect?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  
  useEffect(() => {
    if (skipDefaultEffect) return
    
    // only US and UK default to miles - everyone else defaults to km
    // (this is checked here to allow SSR to work properly)
    if (['en-US', 'en-GB'].some(lang => lang === window?.navigator?.language)) {
      onChange('mi')
    }
    //No exhaustive deps because this is supposed to run only on mount
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  return <div className={classes.root}>
    <input type="radio" id="km" name="distanceUnit" value="km" className={classes.radio}
      checked={distanceUnit === 'km'} onChange={() => onChange('km')} />
    <label htmlFor="km" className={classNames(classes.label, 'left', {'selected': distanceUnit === 'km'})}>
      km
    </label>

    <input type="radio" id="mi" name="distanceUnit" value="mi" className={classes.radio}
      checked={distanceUnit === 'mi'} onChange={() => onChange('mi')} />
    <label htmlFor="mi" className={classNames(classes.label, 'right', {'selected': distanceUnit === 'mi'})}>
      mi
    </label>
  </div>
}

export const DistanceUnitToggle = registerComponent('DistanceUnitToggle', DistanceUnitToggleInner, {styles});

declare global {
  interface ComponentTypes {
    DistanceUnitToggle: typeof DistanceUnitToggle
  }
}
