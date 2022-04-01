import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';

export const goodHeartStartDate = new Date("01/01/2022")

const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex",
    ...theme.typography.commentStyle,
    background: "white",
    marginBottom: 2,
    verticalAlign: "center",
    boxShadow: theme.boxShadow
  },
  column: {
    width: 250,
  },
  index: {
    width: 20,
    padding: 6,
    fontSize: 10,
    color: theme.palette.grey[60]
  },
  username: {
    padding: 6,
    width: 200,
  },
  goodHeartTokens: {
    padding: 6,
    width: 20,
    textAlign: "right",
  }
});

export const AprilFools2022 = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, SectionTitle } = Components

    
  // const { document: postVoting } = useSingle({
  //   documentId: "SBpymoJe9Mq64A8xc",
  //   collectionName: "Posts",
  //   fragmentName: "PostsList"
  // });

  const {results} = useMulti({
      terms: {view: 'usersByGoodHeartTokens'},
      collectionName: "Users",
      fragmentName: 'UsersProfile',
      enableTotal: false,
    });
  return <SingleColumnSection>
    <SectionTitle title="Good Heart Ranking"/>
    <div className={classes.column}>
      {results?.slice(0,5).map((user, i)=> <div key={user._id} className={classes.row}>
        <div className={classes.index}>{ i+1 }</div>
        <div className={classes.username}>{user.displayName}</div>
        <div className={classes.goodHeartTokens}>${user.goodHeartTokens || 0}</div>
      </div>)}
    </div>
  </SingleColumnSection>;
}

const AprilFools2022Component = registerComponent('AprilFools2022', AprilFools2022, {styles});

declare global {
  interface ComponentTypes {
    AprilFools2022: typeof AprilFools2022Component
  }
}

