import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Checkbox from '@material-ui/core/Checkbox';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
});

const FMCrosspostControl = ({updateCurrentValues, classes, value, path}: {
  updateCurrentValues: Function,
  classes: ClassesType,
  value: {isCrosspost: boolean, hostedHere?: boolean, foreignPostId?: string},
  path: string,
}) => {
  const {isCrosspost} = value ?? {};

  return (
    <div className={classes.root}>
      <Checkbox
        className={classes.size}
        checked={isCrosspost}
        onChange={(event, checked) => {
          updateCurrentValues({
            [path]: {
              ...value,
              isCrosspost: checked,
            },
          })
        }}
        disableRipple
      />
      <Components.Typography className={classes.inline} variant="body2" component="label">Crosspost</Components.Typography>
    </div>
  );
};

const FMCrosspostControlComponent = registerComponent("FMCrosspostControl", FMCrosspostControl, {styles});

declare global {
  interface ComponentTypes {
    FMCrosspostControl: typeof FMCrosspostControlComponent
  }
}
