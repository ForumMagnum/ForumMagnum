import React from 'react';
import moment from '../../lib/moment-timezone';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTimezone } from './withTimezone';
import { convertTimeOfWeekTimezone } from '../../lib/utils/timeUtil';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import withErrorBoundary from './withErrorBoundary';
import * as _ from 'underscore';
import { MenuItem } from "./Menus";

type TimeChange = {
  timeOfDay: number;
} | {
  dayOfWeek: string;
};

export interface PickedTime {
  timeOfDayGMT: number;
  dayOfWeekGMT: string;
}

// value: {timeOfDayGMT:int, dayOfWeekGMT:string}
// onChange: ({ timeOfDayGMT, dayOfWeekGMT })=>Unit
const BatchTimePickerInner = ({ mode, value, onChange, disabled = false }: {
  mode: string,
  value: PickedTime,
  onChange: (value: PickedTime) => void,
  disabled?: boolean,
}) => {
  const { timezone } = useTimezone();
  const valueLocal = convertTimeOfWeekTimezone(value.timeOfDayGMT, value.dayOfWeekGMT, "GMT", timezone);
  const { timeOfDay, dayOfWeek } = valueLocal;
  const applyChange = (change: TimeChange) => {
    const newTimeLocal = { ...valueLocal, ...change };
    const newTimeGMT = convertTimeOfWeekTimezone(newTimeLocal.timeOfDay, newTimeLocal.dayOfWeek, timezone, "GMT");
    onChange({
      timeOfDayGMT: newTimeGMT.timeOfDay,
      dayOfWeekGMT: newTimeGMT.dayOfWeek,
    });
  };
  
  return <React.Fragment>
    { (mode==="daily" || mode==="weekly") && <span>
      <Select
        value={timeOfDay}
        onChange={(event) => applyChange({ timeOfDay: parseInt(event.target.value) })}
        disabled={disabled}
      >
        { _.range(24).map(hour =>
            <MenuItem key={hour} value={hour}>{hour}:00</MenuItem>
          )
        }
      </Select>
      {moment().tz(timezone).format("z")}
    </span>}
    
    { mode==="weekly" && <span>
        {" on "}
        <Select
          value={dayOfWeek}
          onChange={(event) => applyChange({ dayOfWeek: event.target.value })}
          disabled={disabled}
        >
          <MenuItem value="Sunday">Sunday</MenuItem>
          <MenuItem value="Monday">Monday</MenuItem>
          <MenuItem value="Tuesday">Tuesday</MenuItem>
          <MenuItem value="Wednesday">Wednesday</MenuItem>
          <MenuItem value="Thursday">Thursday</MenuItem>
          <MenuItem value="Friday">Friday</MenuItem>
          <MenuItem value="Saturday">Saturday</MenuItem>
        </Select>
      </span>
    }
  </React.Fragment>;
}

export const BatchTimePicker = registerComponent("BatchTimePicker", BatchTimePickerInner, {hocs:[withErrorBoundary]});

declare global {
  interface ComponentTypes {
    BatchTimePicker: typeof BatchTimePicker
  }
}
