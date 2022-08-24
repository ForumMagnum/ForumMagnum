import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
  fmCrosspostUseAuth0Setting,
} from "../../lib/instanceSettings";
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

  const [token, setToken] = useState("");
  console.log("token", token);

  useEffect(() => {
    const callback = async () => {
      const result = await fetch("/api/crosspostToken");
      const json = await result.json();
      setToken(json.token);
    }
    void callback();
  }, []);

  const onClickLogin = () => {
    if (fmCrosspostUseAuth0Setting.get()) {
      alert("TODO: Implement Auth0 redirect");
    } else {
      window.open(`${fmCrosspostBaseUrlSetting.get()}crosspostLogin?token=${token}`, "_blank")?.focus();
    }
  }

  useEffect(() => {
    const handler = () => {
      if (!document.hidden) {
        // TODO
      }
    }
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  });

  return (
    <div className={classes.root}>
      <FormControlLabel
        label={`Crosspost to ${fmCrosspostSiteNameSetting.get()}`}
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
          Login to {fmCrosspostSiteNameSetting.get()} to enable crossposting
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
