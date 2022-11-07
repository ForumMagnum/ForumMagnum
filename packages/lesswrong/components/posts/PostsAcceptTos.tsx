import React, { useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { forumTypeSetting, tosUrlSetting, licenseUrlSetting } from "../../lib/instanceSettings";
import Button from "@material-ui/core/Button";
import { gql, useMutation } from "@apollo/client";
import { useMessages } from "../common/withMessages";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    rowGap: "15px",
    padding: "30px 5px 20px 5px",
    "& a": {
      color: theme.palette.primary.main,
    },
  },
  button: {
    maxWidth: 100,
  },
});

const PostsAcceptTos = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const [loading, setLoading] = useState(false);
  const [acceptTos] = useMutation(gql`
    mutation AcceptTos {
      UserAcceptTos
    }
  `, {refetchQueries: ['getCurrentUser']})
  const {flash} = useMessages();

  if (forumTypeSetting.get() !== "EAForum" || currentUser.acceptedTos) {
    return null;
  }

  const onAccept = async () => {
    setLoading(true);
    const result = await acceptTos();
    const accepted = result?.data?.UserAcceptTos;
    if (accepted) {
      flash("Thank you for accepting the terms of use");
    } else {
      flash("Error: Something went wrong, please try again");
      setLoading(false);
    }
  }

  return (
    <div className={classes.root}>
      <Components.Typography variant="body2">
        To continue you must agree to the{" "}
        <a href={tosUrlSetting.get()} target="_blank" rel="noreferrer">terms of use</a>,
        including your content being available under a{" "}
        <a href={licenseUrlSetting.get()} target="_blank" rel="noreferrer">CC-BY</a> license
      </Components.Typography>
      <Button variant="contained" color="primary" className={classes.button} onClick={onAccept} disabled={loading}>
        {loading ? <Components.Loading /> : "I agree"}
      </Button>
    </div>
  );
}

const PostsAcceptTosComponent = registerComponent("PostsAcceptTos", PostsAcceptTos, {styles});

declare global {
  interface ComponentTypes {
    PostsAcceptTos: typeof PostsAcceptTosComponent
  }
}
