import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import SunshineListCount from "@/components/sunshineDashboard/SunshineListCount";
import SunshineListTitle from "@/components/sunshineDashboard/SunshineListTitle";
import SunshineNewTagsItem from "@/components/sunshineDashboard/SunshineNewTagsItem";
import LoadMore from "@/components/common/LoadMore";

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.sunshineNewTags,
  }
})

const SunshineNewTagsList = ({ classes }: {classes: ClassesType<typeof styles>}) => {
  const { results, totalCount, loadMoreProps } = useMulti({
    terms: {view:"unreviewedTags", limit: 30 },
    collectionName: "Tags",
    fragmentName: "SunshineTagFragment",
    enableTotal: true, itemsPerPage: 30,
  });
  const currentUser = useCurrentUser();
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

const SunshineNewTagsListComponent = registerComponent('SunshineNewTagsList', SunshineNewTagsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewTagsList: typeof SunshineNewTagsListComponent
  }
}

export default SunshineNewTagsListComponent;
