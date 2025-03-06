import React, { FC, useState, useCallback, PropsWithChildren } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isLWorAF } from "../../lib/instanceSettings";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useMessages } from "../common/withMessages";
import { Link } from "../../lib/reactRouterWrapper";
import Checkbox from '@material-ui/core/Checkbox';
import { Typography } from "@/components/common/Typography";
import { Loading } from "@/components/vulcan-core/Loading";

export const TosLink: FC<PropsWithChildren<{}>> = ({children}) =>
  <Link to="/termsOfUse" target="_blank" rel="noreferrer">{children ?? "terms of use"}</Link>

export const LicenseLink: FC<PropsWithChildren<{}>> = ({children}) =>
  <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
    {children ?? "Creative Commons Attribution 4.0"}
  </a>

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    rowGap: "15px",
    padding: "30px 5px 20px 5px",
    "& a": {
      color: theme.palette.primary.main,
    },
  },
  label: {
    paddingTop: 4,
  },
  spinner: {
    marginTop: 18,
  },
});

const PostsAcceptTos = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(currentUser.acceptedTos);
  const updateCurrentUser = useUpdateCurrentUser();
  const {flash} = useMessages();

  const onAccept = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    const result = await updateCurrentUser({
      acceptedTos: true,
    });
    const accepted = result?.data?.updateUser?.data?.acceptedTos;
    if (accepted) {
      flash("Thank you for accepting the terms of use");
      setAccepted(true);
    } else {
      flash("Error: Something went wrong, please try again");
      setLoading(false);
    }
  }, [loading, setLoading, flash, updateCurrentUser]);

  if (isLWorAF || accepted) {
    return null;
  }

  return (
    <div className={classes.root}>
      <Checkbox
        onChange={onAccept}
        checked={loading}
        disabled={loading}
        disableRipple
      />
      {loading
        ? <Loading className={classes.spinner} />
        : <Typography variant="body2" className={classes.label}>
          Before you can publish this post you must agree to the <TosLink /> including
          your content being available under a <LicenseLink /> license
        </Typography>
      }
    </div>
  );
}

const PostsAcceptTosComponent = registerComponent("PostsAcceptTos", PostsAcceptTos, {styles});

declare global {
  interface ComponentTypes {
    PostsAcceptTos: typeof PostsAcceptTosComponent
  }
}

export default PostsAcceptTosComponent;
