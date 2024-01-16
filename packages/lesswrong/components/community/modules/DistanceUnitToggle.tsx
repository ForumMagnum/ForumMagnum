import { registerComponent, } from '../../../lib/vulcan-lib';
import React, { useEffect } from 'react';
import { createStyles } from '@material-ui/core/styles';
import ToggleButtonGroup from './ToggleButtonGroup';
import ToggleButton from './ToggleButton';

const styles = createStyles((): JssStyles => ({
  root: {
    marginLeft: 5
  },
}))

const DistanceUnitToggle = ({distanceUnit='km', onChange, skipDefaultEffect, classes}: {
  distanceUnit: "km"|"mi",
  onChange: Function,
  skipDefaultEffect?: boolean,
  classes: ClassesType,
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

  return <ToggleButtonGroup
    value={distanceUnit}
    onChange={( _e, newUnit) => onChange(newUnit)}
    name="distanceUnit"
    className={classes.root}
  >
    <ToggleButton value="km">km</ToggleButton>
    <ToggleButton value="mi">mi</ToggleButton>
  </ToggleButtonGroup>
}

const DistanceUnitToggleComponent = registerComponent('DistanceUnitToggle', DistanceUnitToggle, {styles});

declare global {
  interface ComponentTypes {
    DistanceUnitToggle: typeof DistanceUnitToggleComponent
  }
}
