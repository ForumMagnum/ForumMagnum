import React, { useEffect, useState } from 'react';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useLazyQuery } from '@apollo/client/react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { gql } from "@/lib/generated/gql-codegen";
import { registerComponent } from "../../lib/vulcan-lib/components";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import { Typography } from "../common/Typography";
import Error404 from "../common/Error404";
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: -theme.spacing.mainLayoutPaddingTop,
    padding: "24px 36px 60px",
    backgroundColor: theme.palette.background.paper,
  },
  body: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginTop: 4,
    marginBottom: 20,
  },
  button: {
    padding: "12px 24px",
    marginRight: 16,
    backgroundColor: theme.palette.grey[60],
  },
});

const RandomUserPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [newTabKeyHeld, setNewTabKeyHeld] = useState(false);
  const [alreadyRedirected, setAlreadyRedirected] = useState(false);
  const [getRandomUser, {loading, data }] = useLazyQuery(gql(`
    query randomUser($userIsAuthor: String!) {
      GetRandomUser(userIsAuthor: $userIsAuthor) {
        ...UsersMinimumInfo
      }
    }
  `), {
    fetchPolicy: "no-cache",
  });

  // Redirect to the user page
  // useEffect combined with recievedNewResults ensures that we only redirect once
  useEffect(() => {
    if (data?.GetRandomUser && !alreadyRedirected) {
      const user = data?.GetRandomUser
      if (!user) {
        // eslint-disable-next-line no-console
        console.error("No user found");
        return;
      }
      // Redirect to the user page
      const url = `/users/${user.slug}`;
      if (newTabKeyHeld) {
        window.open(url, "_blank")?.focus();
      } else {
        window.location.href = url;
      }
      setNewTabKeyHeld(false);
      setAlreadyRedirected(true);
    }
  }, [data, newTabKeyHeld, alreadyRedirected]);
  if (!userIsAdminOrMod(currentUser)) {
    return <Error404 />
  }

  return <SingleColumnSection className={classes.root}>
    <SectionTitle title="Random active user" noTopMargin />
    <Typography variant="body1" className={classes.body}>
      Active is defined as reading or writing something in the past month, respectively.
    </Typography>
    <Button
      onClick={(e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) setNewTabKeyHeld(true);
        void getRandomUser({variables: {userIsAuthor: 'optional'}})
      }}
      className={classes.button}
    >
      Get a random active user
    </Button>
    <Button
      onClick={(e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) setNewTabKeyHeld(true);
        void getRandomUser({variables: {userIsAuthor: 'required'}})
      }}
      className={classes.button}
    >
      Get a random active writer
    </Button>
    {loading && <Loading />}
  </SingleColumnSection>
}

export default registerComponent(
  "RandomUserPage", RandomUserPage, {styles}
);


