import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
  fmCrosspostUseAuth0Setting,
} from "../../lib/instanceSettings";
import { useSingle } from '../../lib/crud/withSingle';
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Button from '@material-ui/core/Button';
import classNames from "classnames";
import { useCurrentUser } from "../common/withUser";
import { useAsyncEffect } from "../common/withAsyncEffect";
import { useOnTabView } from "../common/withOnTabView";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "column",
  },
  frame: {
    border: "none",
  },
});

const FMCrosspostView = ({fmCrosspostUserId, loading, onClickLogin, classes}: {
  fmCrosspostUserId?: string,
  loading: boolean,
  onClickLogin: () => void,
  classes: ClassesType,
}) => {
  const {Loading} = Components;

  if (loading) {
    return (
      <Loading />
    );
  }

  if (fmCrosspostUserId) {
    return (
      <p>{fmCrosspostUserId}</p>
    );
  }

  return (
    <Button onClick={onClickLogin} className={classes.button}>
      Login to {fmCrosspostSiteNameSetting.get()} to enable crossposting
    </Button>
  );
}

const FMCrosspostControl = ({updateCurrentValues, classes, value, path, currentUser}: {
  updateCurrentValues: Function,
  classes: ClassesType,
  value: {isCrosspost: boolean, hostedHere?: boolean, foreignPostId?: string},
  path: string,
  currentUser: UsersCurrent,
}) => {
  const {isCrosspost} = value ?? {};
  const [token, setToken] = useState<string | null>(null);
  const {document, refetch, loading} = useSingle({
    documentId: currentUser._id,
    collectionName: "Users",
    fragmentName: "UsersCrosspostInfo",
    notifyOnNetworkStatusChange: true,
  });

  useAsyncEffect(async () => {
    // TODO: Error handling here
    const result = await fetch("/api/crosspostToken");
    const {token} = await result.json();
    setToken(token);
  }, []);

  useOnTabView(() => {
    if (!document?.fmCrosspostUserId) {
      console.log("refetching");
      refetch();
    }
  });

  const onClickLogin = () => {
    if (fmCrosspostUseAuth0Setting.get()) {
      alert("TODO: Implement Auth0 redirect");
    } else if (!token?.length) {
      // TODO Proper error handling
      throw new Error("Invalid token");
    } else {
      const url = `${fmCrosspostBaseUrlSetting.get()}crosspostLogin?token=${token}`;
      window.open(url, "_blank")?.focus();
    }
  }

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
      {isCrosspost &&
        <FMCrosspostView
          fmCrosspostUserId={document?.fmCrosspostUserId}
          loading={loading}
          onClickLogin={onClickLogin}
          classes={classes}
        />
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
