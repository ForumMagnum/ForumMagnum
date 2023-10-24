import React, { FC, useState, useCallback } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isLWorAF } from "../../lib/instanceSettings";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { useMessages } from "../common/withMessages";
import { Link } from "../../lib/reactRouterWrapper";
import Checkbox from '@material-ui/core/Checkbox';
import InputLabel from '@material-ui/core/InputLabel';

export const TosLink: FC = ({children}) =>
  <Link to="/termsOfUse" target="_blank" rel="noreferrer">{children ?? "terms of use"}</Link>

export const LicenseLink: FC = ({children}) =>
  <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noreferrer">
    {children ?? "CC-BY"}
  </a>

const styles = (theme: ThemeType) => ({
  checkboxLabel: {
    display: "flex",
    flexDirection: "row",
    rowGap: "15px",
    padding: "30px 5px 20px 5px",
    cursor: 'pointer',
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
  classes: ClassesType,
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
    <InputLabel className={classes.checkboxLabel}>
      <Checkbox
        onChange={onAccept}
        checked={loading}
        disabled={loading}
        disableRipple
      />
      {loading
        ? <Components.Loading className={classes.spinner} />
        : <Components.Typography variant="body2" className={classes.label}>
          Before you can publish this post you must agree to the <TosLink /> including
          your content being available under a <LicenseLink /> license
        </Components.Typography>
      }
    </InputLabel>
  );
}

const PostsAcceptTosComponent = registerComponent("PostsAcceptTos", PostsAcceptTos, {styles});

declare global {
  interface ComponentTypes {
    PostsAcceptTos: typeof PostsAcceptTosComponent
  }
}
