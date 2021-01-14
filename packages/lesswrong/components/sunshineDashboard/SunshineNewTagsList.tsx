import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor:"rgba(80,80,0,.08)"
  }
})

const SunshineNewTagsList = ({ classes }:{classes:ClassesType}) => {
  const { results, totalCount } = useMulti({
    terms: {view:"unreviewedTags", limit: 30 },
    collectionName: "Tags",
    fragmentName: "SunshineTagFragment",
    enableTotal: true,
  });
  const currentUser = useCurrentUser();
  
  const { SunshineListCount, SunshineListTitle, SunshineNewTagsItem } = Components
  if (results && results.length && userCanDo(currentUser, "posts.moderate.all")) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Unreviewed Tags <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(tag =>
          <div key={tag._id} >
            <SunshineNewTagsItem tag={tag}/>
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}

const SunshineNewTagsListComponent = registerComponent('SunshineNewTagsList', SunshineNewTagsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewTagsList: typeof SunshineNewTagsListComponent
  }
}

