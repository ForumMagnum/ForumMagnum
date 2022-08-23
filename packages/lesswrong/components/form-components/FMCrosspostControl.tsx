import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { fmCrosspostSiteName } from "../../lib/publicSettings";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Button from '@material-ui/core/Button';
import classNames from "classnames";
import { useCurrentUser } from "../common/withUser";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "column",
  },
  frame: {
    border: "none",
  },
});

const FMCrosspostControl = ({updateCurrentValues, classes, value, path, currentUser}: {
  updateCurrentValues: Function,
  classes: ClassesType,
  value: {isCrosspost: boolean, hostedHere?: boolean, foreignPostId?: string},
  path: string,
  currentUser: UsersCurrent,
}) => {
  const {isCrosspost} = value ?? {};

  const token = "THE_TOKEN";

  const onClickLogin = () => {
    window.open(`http://localhost:4000/crosspostLogin?token=${token}`, "_blank")?.focus();
  }

  return (
    <div className={classes.root}>
      <FormControlLabel
        label={`Crosspost to ${fmCrosspostSiteName.get()}`}
        control={
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
        }
      />
      {isCrosspost && !currentUser?.fmCrosspostProfile &&
        <Button onClick={onClickLogin} className={classes.button}>
          Login to {fmCrosspostSiteName.get()} to enable crossposting
        </Button>
      }
    </div>
  );
};

const FMCrosspostControlComponent = registerComponent("FMCrosspostControl", FMCrosspostControl, {styles});

declare global {
  interface ComponentTypes {
    FMCrosspostControl: typeof FMCrosspostControlComponent
  }
}
