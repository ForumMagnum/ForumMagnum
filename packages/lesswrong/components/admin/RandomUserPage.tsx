import React from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { gql, useLazyQuery } from '@apollo/client';
import { Button } from '@material-ui/core';

const styles = (theme: ThemeType): JssStyles => ({
  root: {},
});

const RandomUserPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const [getRandomUser, {loading, error, data}] = useLazyQuery(gql`
    query randomUser {
      GetRandomUser {
        ...UsersMinimumInfo
      }
    }
    ${fragmentTextForQuery('UsersMinimumInfo')}
  `, {
    onCompleted: (data) => {
      console.log(data);
    }
  });
  
  console.log('data', data);
  
  const { SingleColumnSection, Error404 } = Components;
  
  if (!userIsAdminOrMod(currentUser)) {
    return <Error404 />
  }

  return <SingleColumnSection>
    <Button onClick={() => getRandomUser()}>Get Random User</Button>
  </SingleColumnSection>
}

const RandomUserPageComponent = registerComponent(
  "RandomUserPage", RandomUserPage, {styles}
);

declare global {
  interface ComponentTypes {
    RandomUserPage: typeof RandomUserPageComponent
  }
}
