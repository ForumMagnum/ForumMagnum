import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import Tags from '../../lib/collections/tags/collection';
import Users from '../../lib/collections/users/collection';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor:"rgba(80,80,0,.08)"
  }
})

const SunshineNewTagsList = ({ classes }:{classes:ClassesType}) => {
  const { results, totalCount } = useMulti({
    terms: {view:"unreviewedTags", limit: 30 },
    collection: Tags,
    fragmentName: "SunshineTagFragment",
    enableTotal: true,
  });
  const currentUser = useCurrentUser();
  
  const { SunshineListCount, SunshineListTitle, SunshineNewTagsItem } = Components
  if (results && results.length && Users.canDo(currentUser, "posts.moderate.all")) {
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

