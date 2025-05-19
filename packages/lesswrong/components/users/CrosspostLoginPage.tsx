import React, { useState } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import { useCurrentUser } from "../common/withUser";
import { forumHeaderTitleSetting } from '@/lib/instanceSettings';
import { gql, useMutation } from "@apollo/client";
import { hasProminentLogoSetting } from "../../lib/publicSettings";
import { isE2E } from "@/lib/executionEnvironment";
import { useLocation } from "@/lib/routeUtil";
import LoginForm from "./LoginForm";
import SiteLogo from "../ea-forum/SiteLogo";
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heading: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: "1.5em",
  },
  headingText: {
    fontSize: 20,
    margin: 0,
  },
  buttonContainer: {
    marginTop: "1.5em",
  },
  error: {
    color: theme.palette.error.main,
    marginTop: 16,
  },
});

const CrosspostLoginPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [connectCrossposter, loading] = useMutation(gql`
    mutation connectCrossposter($token: String) {
      connectCrossposter(token: $token)
    }
  `, {errorPolicy: "all"});
  const [error, setError] = useState<string | null>(null);
  const currentUser = useCurrentUser();
  const {query: {token}} = useLocation();

  const onConfirm = async () => {
    if (!currentUser) {
      throw new Error("Can't connect crosspost account whilst logged out");
    }
    const result = await connectCrossposter({
      variables: {token},
    });
    if (result?.data?.connectCrossposter === "success") {
      setError(null);
      window.close();
    } else if (result?.errors?.length) {
      setError(result.errors[0].message);
    } else {
      setError("Failed to connect accounts");
    }
  }
  return (
    <div className={classes.root}>
      <div className={classes.heading}>
        {hasProminentLogoSetting.get() && <SiteLogo />}
        <Typography variant="title" className={classes.headingText}>
          {forumHeaderTitleSetting.get()}
        </Typography>
      </div>
      {error && <div className={classes.error}>Error: {error}</div>}
      {currentUser
        ? (
          <>
            <Typography variant="body2">
              Logged in as {currentUser.displayName}
            </Typography>
            <div className={classes.buttonContainer}>
              {loading?.loading || (loading?.called && !loading?.error)
                ? (
                  <Loading />
                )
                : (
                  <Button onClick={onConfirm}>
                    Click to connect your account for crossposting
                  </Button>
                )
              }
            </div>
          </>
        )
        : (
          <LoginForm immediateRedirect={!isE2E} />
        )
      }
    </div>
  );
}

export default registerComponent("CrosspostLoginPage", CrosspostLoginPage, {styles});


