import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const AprilFools2022 = ({classes}: {
  classes: ClassesType,
}) => {
    const {results} = useMulti({
        terms: {view: 'usersByGoodHeartTokens'},
        collectionName: "Users",
        fragmentName: 'UsersProfile',
        enableTotal: false,
      });
  return <div className={classes.root}>
      {results?.map(user=> <div>
          <span>{`${user.displayName}: ${user.goodHeartTokens || 0}`}</span>
      </div>)}
  </div>;
}

const AprilFools2022Component = registerComponent('AprilFools2022', AprilFools2022, {styles});

declare global {
  interface ComponentTypes {
    AprilFools2022: typeof AprilFools2022Component
  }
}

