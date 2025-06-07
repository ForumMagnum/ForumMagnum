import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import SunshineListCount from "./SunshineListCount";
import SunshineListTitle from "./SunshineListTitle";
import SunshineNewTagsItem from "./SunshineNewTagsItem";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SunshineTagFragmentMultiQuery = gql(`
  query multiTagSunshineNewTagsListQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshineTagFragment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.sunshineNewTags,
  }
})

const SunshineNewTagsList = ({ classes }: {classes: ClassesType<typeof styles>}) => {
  const { data, loadMoreProps } = useQueryWithLoadMore(SunshineTagFragmentMultiQuery, {
    variables: {
      selector: { unreviewedTags: {} },
      limit: 30,
      enableTotal: true,
    },
    itemsPerPage: 30,
  });

  const results = data?.tags?.results.filter(tag => tag.needsReview);

  const totalCount = data?.tags?.totalCount ?? 0;
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

export default registerComponent('SunshineNewTagsList', SunshineNewTagsList, {styles});


