import React, { useState } from "react";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../lib/instanceSettings";
import { useForeignApolloClient } from "../hooks/useForeignApolloClient";
import FormControlLabel from "@/lib/vendor/@material-ui/core/src/FormControlLabel";
import Checkbox from "@/lib/vendor/@material-ui/core/src/Checkbox";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import LoginIcon from "@/lib/vendor/@material-ui/icons/src/LockOpen"
import UnlinkIcon from "@/lib/vendor/@material-ui/icons/src/RemoveCircle";
import { useMutation } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery"
import { useOnFocusTab } from "../hooks/useOnFocusTab";
import { combineUrls } from "../../lib/vulcan-lib/utils";
import { useCurrentUser } from "../common/withUser";
import { gql } from "@/lib/crud/wrapGql";
import { generateTokenRoute } from "@/lib/fmCrosspost/routes";
import { TypedFieldApi } from "@/components/tanstack-form-components/BaseAppForm";
import { defineStyles, useStyles } from "../hooks/useStyles";
import Loading from "../vulcan-core/Loading";

const UsersCrosspostInfoQuery = gql(`
  query FMCrosspostControl($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersCrosspostInfo
      }
    }
  }
`);

const styles = defineStyles('FMCrosspostControl', (theme: ThemeType) => ({
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
}));

/**
 * FMCrosspostAccount displays the user's account on the other platform after
 * it's already been authorized
 */
const FMCrosspostAccount = ({fmCrosspostUserId}: {
  fmCrosspostUserId: string,
}) => {
  const classes = useStyles(styles);
  const apolloClient = useForeignApolloClient();
  const { loading, data } = useQuery(UsersCrosspostInfoQuery, {
    variables: { documentId: fmCrosspostUserId },
    client: apolloClient,
  });
  const document = data?.user?.result;

  const link = `${fmCrosspostBaseUrlSetting.get()}users/${document?.slug}`;
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
const FMCrosspostAuth = ({fmCrosspostUserId, loading, onClickLogin, onClickUnlink}: {
  fmCrosspostUserId?: string,
  loading: boolean,
  onClickLogin: () => void,
  onClickUnlink: () => void,
}) => {
  const classes = useStyles(styles);

  if (loading) {
    return (
      <Loading />
    );
  }

  return fmCrosspostUserId
    ? (
      <div>
        <FMCrosspostAccount fmCrosspostUserId={fmCrosspostUserId} />
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

/**
 * FMCrosspostControl is the main form component for setting up crossposts
 * It allows the user to choose whether or not to make this post a crosspost,
 * and it also allows them to connect or disconnect their account on the other
 * platform.
 */
export const FMCrosspostControl = ({ field }: {
  field: TypedFieldApi<{ isCrosspost: boolean, hostedHere?: boolean | null, foreignPostId?: string | null } | null | undefined>
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const {isCrosspost} = field.state.value ?? {};
  if (!currentUser) throw new Error("FMCrosspostControl should only appear when logged in");

  const [unlink, {loading: loadingUnlink}] = useMutation(gql(`
    mutation unlinkCrossposter {
      unlinkCrossposter
    }
  `), {errorPolicy: "all"});
  const { refetch, loading: loadingDocument, data } = useQuery(UsersCrosspostInfoQuery, {
    variables: { documentId: currentUser._id },
    notifyOnNetworkStatusChange: true,
  });
  const document = data?.user?.result;
  const [error, setError] = useState<string | null>(null);

  const loading = loadingUnlink || loadingDocument;

  useOnFocusTab(() => {
    if (!loading && !document?.fmCrosspostUserId) {
      void refetch();
    }
  });

  const onClickLogin = async () => {
    try {
      const {token} = await generateTokenRoute.makeRequest({});
      if (token) {
        const url = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", `crosspostLogin?token=${token}`);
        window.open(url, "_blank")?.focus();
      } else {
        setError("Couldn't create login token");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create login token");
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
            checked={isCrosspost}
            onChange={(_, checked) => {
              field.handleChange({
                isCrosspost: checked,
                hostedHere: true,
              })
            }}
            disableRipple
          />
        }
      />
      {error && <div className={classes.error}>Error: {error}</div>}
      {!error && isCrosspost &&
        <FMCrosspostAuth
          fmCrosspostUserId={document?.fmCrosspostUserId ?? undefined}
          loading={loading}
          onClickLogin={onClickLogin}
          onClickUnlink={onClickUnlink}
        />
      }
    </div>
  );
};

