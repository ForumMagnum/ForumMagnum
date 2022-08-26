import React, { useState, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../lib/instanceSettings";
import { useSingle } from "../../lib/crud/withSingle";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import classNames from "classnames";
import { gql, useMutation } from "@apollo/client";
import { useCurrentUser } from "../common/withUser";
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

const FMCrosspostView = ({fmCrosspostUserId, loading, onClickLogin, onClickUnlink, classes}: {
  fmCrosspostUserId?: string,
  loading: boolean,
  onClickLogin: () => void,
  onClickUnlink: () => void,
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
      <div>
        <div>
          This post will be crossposted to {fmCrosspostSiteNameSetting.get()} on
          your account with user ID &quot;{fmCrosspostUserId}&quot;
        </div>
        <Button onClick={onClickUnlink} className={classes.button}>
          Unlink this account
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={onClickLogin} className={classes.button}>
      Login to {fmCrosspostSiteNameSetting.get()} to enable crossposting
    </Button>
  );
}

const unlinkCrossposterMutation = gql`
  mutation unlinkCrossposter {
    unlinkCrossposter
  }
`;

const FMCrosspostControl = ({updateCurrentValues, classes, value, path, currentUser}: {
  updateCurrentValues: Function,
  classes: ClassesType,
  value: {isCrosspost: boolean, hostedHere?: boolean, foreignPostId?: string},
  path: string,
  currentUser: UsersCurrent,
}) => {
  const {isCrosspost} = value ?? {};

  const [unlink, {loading: loadingUnlink}] = useMutation(unlinkCrossposterMutation, {errorPolicy: "all"});
  const {document, refetch, loading: loadingDocument} = useSingle({
    documentId: currentUser._id,
    collectionName: "Users",
    fragmentName: "UsersCrosspostInfo",
    notifyOnNetworkStatusChange: true,
  });
  const [token, setToken] = useState<string | null>(null);

  const loading = loadingUnlink || loadingDocument;

  useEffect(() => {
    const getToken = async () => {
      // TODO: Error handling here
      if (!document?.fmCrosspostUserId) {
        const result = await fetch("/api/crosspostToken");
        const {token} = await result.json();
        setToken(token);
      }
    }
    void getToken();
  }, [document?.fmCrosspostUserId]);

  useOnTabView(() => {
    if (!loading && !document?.fmCrosspostUserId) {
      refetch();
    }
  });

  const onClickLogin = () => {
    if (token?.length) {
      const url = `${fmCrosspostBaseUrlSetting.get()}crosspostLogin?token=${token}`;
      window.open(url, "_blank")?.focus();
    } else {
      // TODO Better error handling here
      throw new Error("Invalid token");
    }
  }

  const onClickUnlink = async () => {
    await unlink();
    await refetch();
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
                  isCrosspost: checked,
                  hostedHere: true,
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
          onClickUnlink={onClickUnlink}
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
