import React from 'react';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import LoadMore from "../common/LoadMore";
import TagsListItem from "./TagsListItem";
import FormatDate from "../common/FormatDate";
import MetaInfo from "../common/MetaInfo";
import UsersNameDisplay from "../users/UsersNameDisplay";
import { useQuery } from "@apollo/client";
import { useLoadMore } from "@/components/hooks/useLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SunshineTagFragmentMultiQuery = gql(`
  query multiTagNewTagsListQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
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
    ...theme.typography.commentStyle,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    padding: 12,
    paddingTop: 2,
    boxShadow: theme.palette.boxShadow.default,
  },
  date: {
    width: 30,
    marginRight: 8
  },
  user: {
    marginRight: 12,
  },
  postCount: {
    marginRight: 12,
  },
  loadMore: {
    marginLeft: 2,
    marginTop: 6
  }
})

const NewTagsList = ({classes, showHeaders = true}: {
  classes: ClassesType<typeof styles>,
  showHeaders?: boolean
}) => {
  const { data, loading, fetchMore } = useQuery(SunshineTagFragmentMultiQuery, {
    variables: {
      selector: { newTags: {} },
      limit: 4,
      enableTotal: true,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.tags?.results;

  const loadMoreProps = useLoadMore({
    data: data?.tags,
    loading,
    fetchMore,
    initialLimit: 4,
    itemsPerPage: 20,
    enableTotal: true,
    resetTrigger: {view:"newTags", limit: 4 }
  });

  return <div className={classes.root}>
    {showHeaders && <h2>New {taggingNamePluralCapitalSetting.get()}</h2>}
    <table>
      <tbody>
        {results?.map(tag => <tr key={tag._id}>
          {tag.user && <td className={classes.user}>
            <MetaInfo>
              <UsersNameDisplay user={tag.user}/>
            </MetaInfo>
          </td>}
          <td>
            <TagsListItem tag={tag}/>
          </td>
          <td>
            <MetaInfo>
              <FormatDate date={tag.createdAt}/>
            </MetaInfo>
          </td>
        </tr>)}
      </tbody>
    </table>
    <div className={classes.loadMore}>
      <LoadMore {...loadMoreProps}/>
    </div>
  </div>
}

export default registerComponent("NewTagsList", NewTagsList, {styles});



