import { Components, registerComponent, } from "../../lib/vulcan-lib";
import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import { useCurrentUser } from "../common/withUser";
import { useGetParameter } from "../common/withGetParameter";
import { forumHeaderTitleSetting } from "../common/Header";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { gql, useMutation } from "@apollo/client";

const styles = (theme: ThemeType): JssStyles => ({
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
});

const connectCrossposterMutation = gql`
  mutation connectCrossposter($token: String) {
    connectCrossposter(token: $token)
  }
`;

const CrosspostLoginPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const token = useGetParameter("token");
  const hasLogo = forumTypeSetting.get() === "EAForum";

  const [mutate, loading] = useMutation(connectCrossposterMutation, {errorPolicy: "all"});

  const {WrappedLoginForm, SiteLogo, Loading, Typography} = Components;

  const onConfirm = async () => {
    if (!currentUser) {
      throw new Error("Can't connect crosspost account whilst logged out");
    }
    const result = await mutate({
      variables: {token},
    });
    if (result?.data?.connectCrossposter === "success") {
      window.close();
    } else {
      // TODO: Proper error handling
      alert(`Error: ${JSON.stringify(result)}`);
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.heading}>
        {hasLogo && <SiteLogo />}
        <Typography variant="title" className={classes.headingText}>
          {forumHeaderTitleSetting.get()}
        </Typography>
      </div>
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
          <WrappedLoginForm />
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
