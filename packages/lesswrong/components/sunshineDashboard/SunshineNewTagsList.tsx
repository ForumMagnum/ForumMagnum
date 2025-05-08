import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.sunshineNewTags,
  }
})

const SunshineNewTagsListInner = ({ classes }: {classes: ClassesType<typeof styles>}) => {
  const { results, totalCount, loadMoreProps } = useMulti({
    terms: {view:"unreviewedTags", limit: 30 },
    collectionName: "Tags",
    fragmentName: "SunshineTagFragment",
    enableTotal: true, itemsPerPage: 30,
  });
  const currentUser = useCurrentUser();
  
  const { SunshineListCount, SunshineListTitle, SunshineNewTagsItem, LoadMore } = Components
  if (results && results.length && userCanDo(currentUser, "posts.moderate.all")) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Unreviewed {taggingNamePluralCapitalSetting.get()} <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(tag =>
          <div key={tag._id} >
            <SunshineNewTagsItem tag={tag}/>
          </div>
        )}
        <LoadMore {...loadMoreProps}/>
      </div>
    )
  } else {
    return null
  }
}

export const SunshineNewTagsList = registerComponent('SunshineNewTagsList', SunshineNewTagsListInner, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewTagsList: typeof SunshineNewTagsList
  }
}
