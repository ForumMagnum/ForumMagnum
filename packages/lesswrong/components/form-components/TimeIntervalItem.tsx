import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';
import React, { useCallback, useMemo, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

type IntervalUnit = 'minutes' | 'hours' | 'days';

const MS_IN_MINUTE = 1000 * 60;
const MS_IN_HOUR = MS_IN_MINUTE * 60;
const MS_IN_DAY = MS_IN_HOUR * 24;

const INTERVAL_MS_MAP = {
  minutes: MS_IN_MINUTE,
  hours: MS_IN_HOUR,
  days: MS_IN_DAY
};

const parseIntervalUnit = (input: string): IntervalUnit => {
  switch (input) {
    case 'minutes': return 'minutes';
    case 'hours': return 'hours';
    case 'days': return 'days';
    default: return 'hours';
  }
};

export const TimeIntervalItem = ({value, updateCurrentValues, classes}: FormComponentProps<number> & {
  classes: ClassesType,
}) => {
  const { MenuItem } = Components;

  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('hours');
  const [intervalQuantity, setIntervalQuantity] = useState<number>(value);

  const onUpdate = useCallback(() => {
    updateCurrentValues({ intervalMs: intervalQuantity });
  }, [intervalQuantity]);

  const displayedIntervalQuantity = useMemo(() => intervalQuantity / INTERVAL_MS_MAP[intervalUnit], [intervalQuantity, intervalUnit]);

  const updateIntervalQuantity = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newIntervalQuantity = parseInt(e.target.value) || 1;
    const intervalUnitMultiplier = INTERVAL_MS_MAP[intervalUnit];
    setIntervalQuantity(newIntervalQuantity * intervalUnitMultiplier);
    onUpdate();
  }, [intervalUnit, displayedIntervalQuantity]);

  const updateIntervalUnit = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIntervalUnit = parseIntervalUnit(e.target.value);
    const intervalUnitMultiplier = INTERVAL_MS_MAP[newIntervalUnit];
    setIntervalQuantity(displayedIntervalQuantity * intervalUnitMultiplier);
    setIntervalUnit(newIntervalUnit);
    onUpdate();
  }, [displayedIntervalQuantity]);

  return <div className={classes.root}>
    <Select
      value={intervalUnit}
      onChange={updateIntervalUnit}
    >
      <MenuItem value='minutes'>minutes</MenuItem>
      <MenuItem value='hours'>hours</MenuItem>
      <MenuItem value='days'>days</MenuItem>
    </Select>
    <Input
      value={displayedIntervalQuantity}
      type='number'
      onChange={updateIntervalQuantity}
    />
  </div>;
}

const TimeIntervalItemComponent = registerComponent('TimeIntervalItem', TimeIntervalItem, {styles});

declare global {
  interface ComponentTypes {
    TimeIntervalItem: typeof TimeIntervalItemComponent
  }
}

