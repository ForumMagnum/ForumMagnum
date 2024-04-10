import React, { useState, useEffect } from "react";
import { Components, registerComponent, combineUrls } from "../../lib/vulcan-lib";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../lib/instanceSettings";
import { useSingle } from "../../lib/crud/withSingle";
import { useForeignApolloClient } from "../hooks/useForeignApolloClient";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Button from "@material-ui/core/Button";
import LoginIcon from "@material-ui/icons/LockOpen"
import UnlinkIcon from "@material-ui/icons/RemoveCircle";
import { gql, useMutation } from "@apollo/client";
import { useOnFocusTab } from "../hooks/useOnFocusTab";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "column",
    margin: 8,
    "& .MuiTypography-root": {
      color: theme.palette.text.normal,
    },
  },
  link: {
    color: theme.palette.primary.main,
  },
  crosspostMessage: {
    marginBottom: 12,
  },
  button: {
    background: theme.palette.buttons.imageUpload.background,
    "&:hover": {
      background: theme.palette.buttons.imageUpload.hoverBackground,
    },
    color: theme.palette.text.invertedBackgroundText,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: theme.spacing.unit,
  },
  error: {
    color: theme.palette.error.main,
    margin: "8px 0",
  },
});

/**
 * FMCrosspostAccount displays the user's account on the other platform after
 * it's already been authorized
 */
const FMCrosspostAccount = ({fmCrosspostUserId, classes}: {
  fmCrosspostUserId: string,
  classes: ClassesType,
}) => {
  const apolloClient = useForeignApolloClient();
  const {document, loading} = useSingle({
    documentId: fmCrosspostUserId,
    collectionName: "Users",
    fragmentName: "UsersCrosspostInfo",
    apolloClient,
  });

  const link = `${fmCrosspostBaseUrlSetting.get()}users/${document?.slug}`;

  const {Loading} = Components;
  
  if (!document || loading) {
    return <Loading/>
  }
  return <div className={classes.crosspostMessage}>
    This post will be crossposted to {fmCrosspostSiteNameSetting.get()} by
    your account <a className={classes.link} href={link} target="_blank" rel="noreferrer">
      {document.username}
    </a>
  </div>
}

/**
 * FMCrosspostAuth shows the user their account if they've already set up crossposting along
 * with an option to remove the account to perhaps add another, or, if they've not set up an
 * account yet they'll be prompted to do so.
 */
const FMCrosspostAuth = ({fmCrosspostUserId, loading, onClickLogin, onClickUnlink, classes}: {
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

  return fmCrosspostUserId
    ? (
      <div>
        <FMCrosspostAccount fmCrosspostUserId={fmCrosspostUserId} classes={classes} />
        <Button onClick={onClickUnlink} className={classes.button}>
          <UnlinkIcon className={classes.buttonIcon} />
          Unlink this account
        </Button>
      </div>
    )
    :(
      <div>
        <Button onClick={onClickLogin} className={classes.button}>
          <LoginIcon className={classes.buttonIcon} />
          Login to {fmCrosspostSiteNameSetting.get()} to enable crossposting
        </Button>
      </div>
    );
}

const unlinkCrossposterMutation = gql`
  mutation unlinkCrossposter {
    unlinkCrossposter
  }
`;

/**
 * FMCrosspostControl is the main form component for setting up crossposts
 * It allows the user to choose whether or not to make this post a crosspost,
 * and it also allows them to connect or disconnect their account on the other
 * platform.
 */
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
  const [error, setError] = useState<string | null>(null);

  const loading = loadingUnlink || loadingDocument;

  useOnFocusTab(() => {
    if (!loading && !document?.fmCrosspostUserId) {
      refetch();
    }
  });

  const onClickLogin = async () => {
    try {
      const result = await fetch("/api/crosspostToken");
      const {token, error} = await result.json();
      if (token) {
        const url = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", `crosspostLogin?token=${token}`);
        window.open(url, "_blank")?.focus();
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError("Couldn't create login token");
      }
    } catch {
      setError("Couldn't create login token");
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
            onChange={(_, checked) => {
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
      {error && <div className={classes.error}>Error: {error}</div>}
      {!error && isCrosspost &&
        <FMCrosspostAuth
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
