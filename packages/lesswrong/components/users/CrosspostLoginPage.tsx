import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import Button from "@material-ui/core/Button";
import { useCurrentUser } from "../common/withUser";
import { forumHeaderTitleSetting } from "../common/Header";
import { gql, useMutation } from "@apollo/client";
import { hasProminentLogoSetting } from "../../lib/publicSettings";
import { isE2E } from "@/lib/executionEnvironment";
import { useLocation } from "@/lib/routeUtil";

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

const connectCrossposterMutation = gql`
  mutation connectCrossposter($token: String) {
    connectCrossposter(token: $token)
  }
`;

const CrosspostLoginPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [connectCrossposter, loading] = useMutation(connectCrossposterMutation, {errorPolicy: "all"});
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

  const {LoginForm, SiteLogo, Loading, Typography} = Components;

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

const CrosspostLoginPageComponent = registerComponent("CrosspostLoginPage", CrosspostLoginPage, {styles});

declare global {
  interface ComponentTypes {
    CrosspostLoginPage: typeof CrosspostLoginPageComponent,
  }
}
